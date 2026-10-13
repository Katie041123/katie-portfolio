"""Generate web-ready assets for the portfolio site.

Run from the repository root after changing images, content or page text:

    python tools/build_assets.py            # everything
    python tools/build_assets.py images     # images only
    python tools/build_assets.py fonts      # font subsets only (run after text changes)

Needs Pillow, fontTools (+ brotli) and PyMuPDF.
"""
import json
import re
import shutil
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
ASSETS = SITE / "assets"
WORKS = ASSETS / "works"
IMG = ASSETS / "img"
FONTS = ASSETS / "fonts"
MEDIA = ASSETS / "media"
SOURCE = ROOT / "design" / "source"  # originals that are not deployed

LONG_RATIO = 3.2      # height / width above which an image is tiled
TILE_HEIGHT = 1600
DISPLAY_MAX_W = 1600
DISPLAY_MIN_BYTES = 600 * 1024


def save_webp(im, path, quality=82):
    path.parent.mkdir(parents=True, exist_ok=True)
    im.save(path, "WEBP", quality=quality, method=6)
    print(f"  {path.relative_to(SITE)}  {im.size[0]}x{im.size[1]}  {path.stat().st_size // 1024}KB")


def save_jpg(im, path, quality=80):
    path.parent.mkdir(parents=True, exist_ok=True)
    im.convert("RGB").save(path, "JPEG", quality=quality, progressive=True, optimize=True)


def trim_alpha(im):
    box = im.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()
    return im.crop(box) if box else im


def fit_height(im, h):
    return im.resize((round(im.width * h / im.height), h), Image.LANCZOS)


def fit_width(im, w):
    return im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)


def crop_ratio(im, ratio, anchor_y=0.5):
    """Crop to width/height == ratio, centred horizontally, anchored vertically."""
    w, h = im.size
    if w / h > ratio:
        nw = round(h * ratio)
        x = (w - nw) // 2
        return im.crop((x, 0, x + nw, h))
    nh = round(w / ratio)
    y = round((h - nh) * anchor_y)
    return im.crop((0, y, w, y + nh))


def content_bbox(im, min_x_frac=0.0, threshold=238):
    """Bounding box of non-white pixels, ignoring the left `min_x_frac` of the image."""
    g = im.convert("L")
    x0 = int(g.width * min_x_frac)
    mask = g.crop((x0, 0, g.width, g.height)).point(lambda v: 255 if v < threshold else 0)
    box = mask.getbbox()
    return (box[0] + x0, box[1], box[2] + x0, box[3])


def mascots():
    print("mascots")
    for name in ["mascot-wave", "mascot-wink"]:
        im = trim_alpha(Image.open(SOURCE / f"{name}.png").convert("RGBA"))
        save_webp(fit_height(im, 640), IMG / f"{name}.webp", 86)
    for name in ["book-bear-v2", "book-winter-v2", "book-flower-v2"]:
        im = trim_alpha(Image.open(SOURCE / f"{name}.png").convert("RGBA"))
        save_webp(fit_width(im, 520), IMG / f"{name.replace('-v2', '')}.webp", 86)


def covers():
    print("covers")
    # Hero polaroids: each card keeps a natural orientation.
    im = Image.open(WORKS / "work-042.jpg")
    save_webp(fit_width(crop_ratio(im, 3 / 4, 0), 540), IMG / "hero-longform.webp")
    im = Image.open(WORKS / "work-086.jpg")
    plog = im.crop(content_bbox(im, 0.2))
    save_webp(fit_width(plog, 540), IMG / "hero-ugc-plog.webp")
    save_webp(fit_width(crop_ratio(plog, 3 / 2, 0.3), 640), IMG / "cover-ugc-plog.webp")
    im = Image.open(WORKS / "work-049.jpg")
    save_webp(fit_width(crop_ratio(im, 4 / 3), 720), IMG / "hero-light.webp")
    im = Image.open(WORKS / "website-1-cover.jpg")
    save_webp(crop_ratio(im, 4 / 3), IMG / "hero-websites.webp")
    im = Image.open(WORKS / "brief-1-rId4.jpg")
    save_webp(fit_width(crop_ratio(im, 3 / 2, 0), 640), IMG / "cover-kol.webp")
    # Vertical video covers.
    for i in range(5):
        im = Image.open(WORKS / f"video-cover-{i}.jpg")
        save_webp(fit_width(im, 405), IMG / f"video-cover-{i}.webp", 80)
    # Portrait for the "about" polaroid.
    im = Image.open(ASSETS / "portrait.jpg")
    save_webp(fit_width(im, 800), IMG / "portrait.webp")


def media_manifest():
    """Tiles for very long images and lighter display copies for heavy ones."""
    print("media")
    if MEDIA.exists():
        shutil.rmtree(MEDIA)
    manifest = {}
    for src in sorted(WORKS.glob("*.jpg")):
        if src.stem.endswith("-thumb"):
            continue
        im = Image.open(src)
        w, h = im.size
        key = f"assets/works/{src.name}"
        if h / w > LONG_RATIO:
            if w > 1080:
                im = fit_width(im, 1080)
                w, h = im.size
            tiles = []
            for n, top in enumerate(range(0, h, TILE_HEIGHT), 1):
                tile = im.crop((0, top, w, min(top + TILE_HEIGHT, h)))
                out = MEDIA / f"{src.stem}-{n:02d}.jpg"
                save_jpg(tile, out, 78)
                tiles.append({"src": f"assets/media/{out.name}", "width": tile.width, "height": tile.height})
            manifest[key] = {"tiles": tiles}
            print(f"  {key}: {len(tiles)} tiles")
        elif src.stat().st_size > DISPLAY_MIN_BYTES:
            if w > DISPLAY_MAX_W:
                im = fit_width(im, DISPLAY_MAX_W)
            out = MEDIA / f"{src.stem}.jpg"
            save_jpg(im, out, 80)
            manifest[key] = {"display": f"assets/media/{out.name}", "width": im.width, "height": im.height}
            print(f"  {key}: display {src.stat().st_size // 1024}KB -> {out.stat().st_size // 1024}KB")
    js = "window.PORTFOLIO_MEDIA=" + json.dumps(manifest, ensure_ascii=False, separators=(",", ":")) + ";\n"
    (SITE / "media.js").write_text("// Generated by tools/build_assets.py — do not edit.\n" + js, encoding="utf-8")


def resume():
    print("resume")
    import fitz  # PyMuPDF

    pdf = WORKS / "katie-resume.pdf"
    doc = fitz.open(pdf)
    pix = doc[0].get_pixmap(matrix=fitz.Matrix(2, 2))
    im = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    save_webp(fit_width(im, 1240), IMG / "resume.webp", 85)


def og_image():
    print("og")
    w, h = 1200, 630
    im = Image.new("RGB", (w, h), "#fff6f8")
    d = ImageDraw.Draw(im)
    for y in range(12, h, 24):
        for x in range(12, w, 24):
            d.ellipse((x - 1.5, y - 1.5, x + 1.5, y + 1.5), fill="#ecdde3")
    hand = str(SOURCE / "kuaile.ttf")
    d.text((90, 150), "何静瑶 Katie", font=ImageFont.truetype(hand, 92), fill="#3a3138")
    d.text((92, 290), "让好内容被看见，也被记住。", font=ImageFont.truetype(hand, 46), fill="#a9546f")
    d.text((94, 380), "内容运营 · 新媒体运营 · 品牌传播 · 交互 / 体验设计", font=ImageFont.truetype(hand, 30), fill="#7d7178")
    d.rectangle((90, 470, 330, 476), fill="#f3c9d8")
    m = fit_height(trim_alpha(Image.open(SOURCE / "mascot-wave.png").convert("RGBA")), 560)
    im.paste(m, (w - m.width - 70, h - m.height), m)
    out = IMG / "og.jpg"
    save_jpg(im, out, 86)
    print(f"  {out.relative_to(SITE)}  {out.stat().st_size // 1024}KB")


def fonts():
    print("fonts")
    from fontTools import subset

    text = ""
    for f in [SITE / "index.html", *SITE.glob("*.js"), *(SITE / "js").glob("*.js")]:
        if f.name != "media.js":
            text += f.read_text(encoding="utf-8")
    cjk = {ch for ch in text if ord(ch) > 0x2E7F}
    chars = "".join(sorted(cjk)) + "".join(chr(c) for c in range(0x20, 0x7F)) + "“”‘’·—…，。！？、：；（）《》「」『』【】～"
    FONTS.mkdir(parents=True, exist_ok=True)
    for src, out, glyphs in [
        (SOURCE / "kuaile.ttf", FONTS / "kuaile.woff2", chars),
        (SOURCE / "amatic.ttf", FONTS / "amatic.woff2", "".join(chr(c) for c in range(0x20, 0x7F)) + "“”‘’·—…"),
    ]:
        opts = subset.Options()
        opts.flavor = "woff2"
        opts.layout_features = ["*"]
        font = subset.load_font(str(src), opts)
        sub = subset.Subsetter(opts)
        sub.populate(text=glyphs)
        sub.subset(font)
        subset.save_font(font, str(out), opts)
        print(f"  {out.relative_to(SITE)}  {len(glyphs)} chars  {out.stat().st_size // 1024}KB")


TASKS = {"images": [mascots, covers, media_manifest, resume, og_image], "fonts": [fonts]}

if __name__ == "__main__":
    picked = sys.argv[1:] or ["images", "fonts"]
    for name in picked:
        for task in TASKS[name]:
            task()
