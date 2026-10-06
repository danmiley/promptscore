Fix the empty-cart failure in tests/test_checkout.py.

Done when: `uv run pytest tests/test_checkout.py -q` exits 0, and that empty-cart case is the one that was failing.

Constraints:
- Change only the checkout test or the cart code the failure proves is wrong.
- Do not change the payment provider.
- Do not guess a cause you have not reproduced.

Output:
- The cause, the files you changed, and the pytest output you observed.

Verify:
- Re-run that pytest command and include the exit status.
