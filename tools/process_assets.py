"""把 assets/raw/ 的原始生成圖處理成遊戲用素材。

- 貼紙（有透明背景）：清掉半透明雜點、裁掉透明邊、縮到最長邊 MAX_STICKER
- 場景（房間、背景、地面）：縮放到固定尺寸
- 全部輸出成 assets/<name>.webp，並產生 assets/manifest.js（各圖尺寸）

用法：python tools/process_assets.py
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "assets" / "raw"
OUT = ROOT / "assets"

MAX_STICKER = 512
SCENES = {
    "room_": (1500, 1000),
    "bg_": (800, 800),
    "ground_": (512, 512),
}


def scene_size(name):
    for prefix, size in SCENES.items():
        if name.startswith(prefix):
            return size
    return None


def process_sticker(im):
    im = im.convert("RGBA")
    alpha = im.getchannel("A")
    # 半透明雜點歸零，避免裁切範圍被撐大
    alpha = alpha.point(lambda a: 0 if a < 24 else a)
    im.putalpha(alpha)
    box = alpha.point(lambda a: 255 if a > 60 else 0).getbbox()
    if box:
        pad = 6
        box = (max(0, box[0] - pad), max(0, box[1] - pad), min(im.width, box[2] + pad), min(im.height, box[3] + pad))
        im = im.crop(box)
    im.thumbnail((MAX_STICKER, MAX_STICKER), Image.LANCZOS)
    return im


def process_scene(im, size):
    im = im.convert("RGB")
    tw, th = size
    # 等比放大到覆蓋目標尺寸再置中裁切
    k = max(tw / im.width, th / im.height)
    im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    left, top = (im.width - tw) // 2, (im.height - th) // 2
    return im.crop((left, top, left + tw, top + th))


def main():
    sizes = {}
    for src in sorted(RAW.glob("*.png")):
        name = src.stem
        im = Image.open(src)
        size = scene_size(name)
        out = process_scene(im, size) if size else process_sticker(im)
        dst = OUT / f"{name}.webp"
        out.save(dst, "WEBP", quality=86, method=6)
        sizes[name] = out.size
        print(f"{name:24s} {im.size} -> {out.size}  {dst.stat().st_size // 1024} KB")

    lines = ",\n".join(f'  "{k}": [{w}, {h}]' for k, (w, h) in sorted(sizes.items()))
    (OUT / "manifest.js").write_text(
        "// 由 tools/process_assets.py 自動產生：各素材的像素尺寸\nwindow.ASSET_SIZES = {\n" + lines + "\n};\n",
        encoding="utf-8",
    )
    print(f"{len(sizes)} assets")


if __name__ == "__main__":
    main()
