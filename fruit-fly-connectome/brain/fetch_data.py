"""Download only the two required public files; reject changed content."""
import hashlib
import shutil
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = [
    ('Connectivity_783.parquet',
     'https://raw.githubusercontent.com/philshiu/Drosophila_brain_model/91bdd1e7dcf193f3e7ca5a8933497fcef63b7960/Connectivity_783.parquet',
     'efeb23fb99098e9c390f6869969b2a121a2ee92c833cfc45ecb2c1d8e1af0347'),
    ('Supplemental_file1_neuron_annotations.tsv',
     'https://raw.githubusercontent.com/flyconnectome/flywire_annotations/main/supplemental_files/Supplemental_file1_neuron_annotations.tsv',
     '9a4f8b2f843196074431ebd7cd883536afa1be86c8a4ce90970441e8be81d1be')
]

def sha(path):
    with path.open('rb') as f:
        return hashlib.file_digest(f, 'sha256').hexdigest()

def main():
    raw = ROOT/'data/raw'
    raw.mkdir(parents=True, exist_ok=True)
    for name, url, expected in FILES:
        target = raw/name
        if target.exists() and sha(target) == expected:
            print('Verified', name)
            continue
        tmp = target.with_suffix(target.suffix+'.download')
        print('Downloading', name, flush=True)
        with urllib.request.urlopen(url, timeout=120) as response, tmp.open('wb') as out:
            shutil.copyfileobj(response, out)
        if sha(tmp) != expected:
            raise ValueError(f'{name}: hash mismatch; existing data preserved. Inspect the upstream version.')
        tmp.replace(target)
        print('Verified', name)

if __name__ == '__main__':
    main()
