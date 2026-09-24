# usage: python3 e2e/sheet.py out name... -> side-by-side half-size contact sheet of e2e/shots/<name>.png
import sys
from PIL import Image, ImageDraw
out, names = sys.argv[1], sys.argv[2:]
ims = [Image.open(f'e2e/shots/{n}.png') for n in names]
w, h = ims[0].size
s = Image.new('RGB', (w * len(ims) // 2, h // 2 + 20), 'white')
d = ImageDraw.Draw(s)
for i, (n, im) in enumerate(zip(names, ims)):
    s.paste(im.resize((w // 2, h // 2)), (i * w // 2, 20))
    d.text((i * w // 2 + 4, 4), n, fill='black')
s.save(f'e2e/shots/{out}.png')
