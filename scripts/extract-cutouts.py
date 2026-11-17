import os
import glob

os.environ["U2NET_HOME"] = "E:/DevCache/u2net"
os.makedirs("E:/DevCache/u2net", exist_ok=True)

from PIL import Image
from rembg import new_session, remove

SRC_DIR = "E:/Projects/Chameleon-RonyDress/tmp-gen"
OUT_DIR = "E:/Projects/Chameleon-RonyDress/tmp-gen/cutouts"
os.makedirs(OUT_DIR, exist_ok=True)

session = new_session("isnet-general-use")

files = sorted(glob.glob(os.path.join(SRC_DIR, "rd-0*-*.jpg")))
count = 0
for path in files:
    name = os.path.basename(path)
    if "-detail." in name:
        continue
    base = os.path.splitext(name)[0]
    out_path = os.path.join(OUT_DIR, f"{base}.png")
    img = Image.open(path).convert("RGB")
    cut = remove(img, session=session, post_process_mask=True)
    cut.save(out_path)
    count += 1
    print(f"[{count}] Cutout saved: {base}.png")

print(f"Done! Extracted {count} RGBA cutouts.")
