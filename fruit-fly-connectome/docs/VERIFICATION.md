# Verification — 16 September 2026

- `python -m pytest -q`: 12 passed. Tests include six Python/JavaScript controller parity cases, held-out neural seeds, no direct stimulus bypass, reward timing, immutable evaluation, buffer ablation, disconnected control and mesh buffer bounds.
- JavaScript syntax checks passed for the UI and arena modules.
- Source data downloader verified both required SHA-256 hashes against local files.
- Browser training completed 300 episodes, seed 0: before 49.0%, after 99.5%, matching the CLI.
- Reversing the mapping changed the displayed optimal choice to Paisa while retaining the readout.
- Slow single-test playback showed pending payout before updating the ledger.
- Frozen 100-choice test completed; test totals are separate from training totals.
- Methods dialog opened and closed; no browser console errors were reported in the checked run.
- At a 390 × 844 viewport, document width and scroll width were both 390 px; the anatomical fly and reward cards remained visible. The temporary viewport override was reset.
- The source ZIP passed its integrity check and ran the CLI from a fresh temporary extraction without the neural simulation dependencies.
- Deployment archive was checked for the correct Site ID and exact index contents. Finder metadata was removed from the packaged output.

Scope: these checks validate the implementation and its reported runs. They do
not establish biological fidelity, reproduce all upstream projects, or show a
connectome advantage. The measured transfer and reversal failures remain in
the public-facing evidence section and research report.
