# Frontier Anti-Pattern Catalog

Shapes that read naturally to a model and poorly to a human, with the plain
replacement and the rule ID. Use during review-lane triage.

Contents: [comprehension that is an algorithm](#before-and-after-the-comprehension-that-is-an-algorithm) ·
[kwargs tunnel](#before-and-after-the-kwargs-tunnel) ·
[decorator that hides a retry](#before-and-after-the-decorator-that-hides-a-retry) ·
[registry metaclass](#before-and-after-the-registry-metaclass) ·
[swallowed exception](#before-and-after-the-swallowed-exception) ·
[gratuitous generics](#before-and-after-gratuitous-generics) ·
[index arithmetic without a name](#before-and-after-index-arithmetic-without-a-name)

## Before and after: the comprehension that is an algorithm
Before (ITER-2, ITER-8):
```python
chunks = [
    (layer.id, i, ring[j : j + n])
    for layer in scene.layers
    for i, ring in enumerate(layer.rings)
    if len(ring) > n
    for j in range(0, len(ring), n)
]
```
After:
```python
chunks: list[Chunk] = []
for layer in scene.layers:
    for index, ring in enumerate(layer.rings):
        if len(ring) <= n:
            continue
        for start in range(0, len(ring), n):
            chunks.append(Chunk(layer.id, index, ring[start : start + n]))
```

## Before and after: the kwargs tunnel
Before (FLOW-6, META-2):
```python
def emit(scene, **kwargs):
    return _emit_layers(scene, **kwargs)

def _emit_layers(scene, **kwargs):
    return [_emit_layer(layer, **kwargs) for layer in scene.layers]

def _emit_layer(layer, decimals=2, profile="fastsvg", **_):
    ...
```
After (same return value, one list of per-layer results; the signature
change is a contract change, agreed and made with every caller in the same
diff):
```python
@dataclass(frozen=True)
class EmitOptions:
    decimals: int = 2
    profile: Profile = Profile.FASTSVG

def emit(scene: Scene, options: EmitOptions) -> list[str]:
    return [_emit_layer(layer, options) for layer in scene.layers]
```

## Before and after: the decorator that hides a retry
Before (FLOW-10, META-2):
```python
@retry(times=3, backoff=2.0, on=(TimeoutError, OSError))
def fetch(bbox: BBox) -> bytes: ...
```
After:
```python
def fetch(bbox: BBox, *, attempts: int = 3) -> bytes:
    """Fetch the Overpass response for bbox, retrying transient failures."""
    for attempt in range(1, attempts + 1):
        try:
            return _fetch_once(bbox)
        except (TimeoutError, OSError) as err:
            if attempt == attempts:
                raise FetchError(f"overpass {bbox}: gave up after {attempts}") from err
            time.sleep(2.0**attempt)
    raise AssertionError("unreachable: loop returns or raises")
```

## Before and after: the registry metaclass
Before (META-3, META-10):
```python
class EmitterMeta(type):
    registry: dict[str, type] = {}
    def __new__(mcs, name, bases, ns):
        cls = super().__new__(mcs, name, bases, ns)
        if ns.get("name"):
            mcs.registry[ns["name"]] = cls
        return cls
```
After:
```python
EMITTERS: dict[str, type[Emitter]] = {
    "fastsvg": FastSvgEmitter,
    "browser": BrowserEmitter,
}
```

## Before and after: the swallowed exception
This one changes behaviour on purpose: the failure path raises instead of
returning `None`. That is an error-policy change, authorized separately
from a style sweep, with every caller of `load_theme` updated and tested in
the same diff (review lane §6).

Before (ERR-1, ERR-6):
```python
def load_theme(path):
    try:
        return json.loads(path.read_text())
    except Exception:
        return None
```
After:
```python
def load_theme(path: Path) -> Theme:
    """Load a theme file.

    Raises:
        ThemeError: the file is missing or is not valid theme JSON.
    """
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as err:
        raise ThemeError(f"theme not found: {path}") from err
    except json.JSONDecodeError as err:
        raise ThemeError(f"theme {path} is not valid JSON: {err.msg}") from err
    return Theme.from_json(raw)
```

## Before and after: gratuitous generics
Before (TYPE-5):
```python
T = TypeVar("T", bound="Feature")
class Layer(Generic[T]):
    features: list[T]
```
After (one feature type exists):
```python
@dataclass(frozen=True)
class Layer:
    features: tuple[Feature, ...]
```

## Before and after: index arithmetic without a name
Before (ITER-10, DOC-6):
```python
out = a[np.r_[0, np.flatnonzero(np.any(np.diff(a, axis=0) != 0, axis=1)) + 1]]
```
After:
```python
# Drop consecutive duplicate vertices produced by rounding.
# a: (N, 2) float64, vertices in ring order.
changed = np.any(np.diff(a, axis=0) != 0, axis=1)   # (N-1,) True where a[i+1] != a[i]
keep = np.concatenate(([True], changed))             # always keep the first vertex
out = a[keep]
```
