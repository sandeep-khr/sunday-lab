"""Make the checked-in research audit readable on the static website."""
from pathlib import Path
from markdown_it import MarkdownIt

root=Path(__file__).resolve().parents[1]
source=(root/'docs/RESEARCH.md').read_text()
html=MarkdownIt('default',{'html':False}).render(source)
page='''<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Research & evidence · Money Follows Fly</title><link rel="stylesheet" href="style.css">
<style>article{max-width:1080px;margin:auto;padding:35px 5% 70px;line-height:1.75}article h1{font-size:52px;line-height:1.1;margin:25px 0}article h2{font-size:30px;margin:45px 0 18px;color:var(--lime)}article h3{margin:30px 0 13px}article p{margin:16px 0;color:#c4cfd7}article a{color:var(--cyan);text-decoration:underline}article table{white-space:normal;display:block;overflow-x:auto;margin:23px 0;font-size:14px}article td{min-width:130px;vertical-align:top}article td:nth-child(n+3){font:inherit}article th{font-size:12px}article pre{padding:20px;background:#111e28;overflow-x:auto;border:1px solid var(--line);font:13px/1.8 var(--mono)}article code{font:13px var(--mono);color:#dfeeb2}article blockquote{border-left:2px solid var(--lime);padding-left:22px;margin:22px 0}.back{font:13px var(--mono)}@media(max-width:760px){article h1{font-size:39px}article h2{font-size:25px}article td{min-width:180px}}
</style></head><body><article><a class="back" href="index.html">← BACK TO THE EXPERIMENT</a>'''+html+'''<a class="back" href="index.html">← TRY THE CONTROLS</a></article></body></html>'''
(root/'frontend/dist/research.html').write_text(page)
print('Rendered research.html')
