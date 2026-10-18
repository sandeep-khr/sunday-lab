# Source snapshot notes

This folder contains Fruit Fly Connectome project code and documentation copied
from the local project. The original files were left untouched. The browser's
handwritten JavaScript, HTML, and CSS are retained in `frontend/dist/` because
that is where this project keeps its browser source.

To keep this snapshot limited to code and docs, the following are omitted:

- Python environments, installed packages, caches, and local hosting state.
- Downloaded repositories under `research/upstream/` and vendored Three.js code.
- Downloaded/raw/cached datasets, neural response banks, and generated results.
- Generated mesh data (`fly.bin` and `fly.json`) and the packaged source ZIP.

Dependency manifests, lockfiles, and attribution/license documents are retained.
Follow the project README to install dependencies and rebuild the neural data,
experiment summaries, and fly anatomy. The browser also expects Three.js files
under `frontend/dist/vendor/`; restore the matching files from the version
specified in `frontend/package-lock.json` after installing the npm dependency.

The README's ready-to-run demo instructions assume these omitted runtime assets
are present. This source snapshot requires those assets to be rebuilt/restored
before the complete demo or data-dependent experiments can run.
