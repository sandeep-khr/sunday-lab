"""Bundle the runnable experiment, excluding local environments and credentials."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

ROOT=Path(__file__).resolve().parents[1]
out=ROOT/'frontend/dist/money-follows-fly-source.zip'
folders=['brain','environment','training','experiments','scripts','tests','docs','results','data','frontend/dist']
skip={'.git','.openai','__pycache__','raw','cache','node_modules','.DS_Store'}
files=[ROOT/n for n in ['README.md','LICENSE','requirements.txt','pytest.ini','train.py','.gitignore','frontend/package.json','frontend/package-lock.json','frontend/.gitignore']]
for name in folders:
    files.extend(p for p in (ROOT/name).rglob('*') if p.is_file() and not any(x in skip for x in p.relative_to(ROOT).parts) and p.suffix not in ['.zip','.png','.pyc'])
with ZipFile(out,'w',ZIP_DEFLATED,compresslevel=6) as z:
    for p in sorted(set(files)):
        z.write(p,'money-follows-fly/'+str(p.relative_to(ROOT)))
with ZipFile(out) as z:
    assert z.testzip() is None
print(f'Packaged {len(set(files))} files; {out.stat().st_size:,} bytes')
