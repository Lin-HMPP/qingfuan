"""打包离线版为 ZIP"""
import zipfile, os

src = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dist-offline')
out = os.path.join(os.path.dirname(src), '青付安_离线版.zip')

with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk(src):
        for f in files:
            fp = os.path.join(root, f)
            arc = os.path.relpath(fp, src)
            zf.write(fp, arc)

size_kb = os.path.getsize(out) / 1024
print(f'离线包已生成: {out} ({size_kb:.0f} KB)')
