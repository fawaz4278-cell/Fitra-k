"""Usage: python3 scripts/generate-splash.py .

Generate iOS PWA startup images (portrait) for current iPhones.

Layout (CSS px, matched by the in-app splash in app/layout.tsx):
  icon 96x96 centred, its top at 46% of screen height minus 48px; wordmark 22px below; tagline 64px above bottom.
"""
import sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = sys.argv[1]
DEVICES = [  # css width, css height, pixel ratio
    (440, 956, 3), (402, 874, 3), (420, 912, 3), (430, 932, 3), (393, 852, 3),
    (428, 926, 3), (390, 844, 3), (375, 812, 3), (414, 896, 3), (414, 896, 2), (375, 667, 2),
]
_raw = Image.open(f"{ROOT}/public/icons/icon-512.png").convert("RGBA")
# The app icon has a dark frame baked in; keep only the bright gradient tile.
_bright = _raw.convert("L").point(lambda v: 255 if v > 40 else 0)
ICON = _raw.crop(_bright.getbbox())
BOLD = "/usr/share/fonts/opentype/inter/Inter-Bold.otf"
SEMI = "/usr/share/fonts/opentype/inter/Inter-SemiBold.otf"


def glow(size, box, color, blur):
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).ellipse(box, fill=color)
    return layer.filter(ImageFilter.GaussianBlur(blur))


def render(w, h, r):
    W, H = w * r, h * r
    img = Image.new("RGBA", (W, H), (0, 0, 0, 255))
    # Same corner glows as the app background, plus a soft halo behind the icon.
    img = Image.alpha_composite(img, glow((W, H), (-0.45 * W, -0.75 * 420 * r, 0.75 * W, 0.55 * 420 * r), (10, 132, 255, 46), 70 * r))
    img = Image.alpha_composite(img, glow((W, H), (0.45 * W, -0.75 * 420 * r, 1.45 * W, 0.45 * 420 * r), (48, 209, 88, 28), 70 * r))
    cy = 0.46 * H
    img = Image.alpha_composite(img, glow((W, H), (W / 2 - 110 * r, cy - 110 * r, W / 2 + 110 * r, cy + 110 * r), (40, 170, 200, 55), 60 * r))

    s = 96 * r
    icon = ICON.resize((s, s), Image.LANCZOS)
    mask = Image.new("L", (s, s), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, s - 1, s - 1), radius=int(s * 0.225), fill=255)
    icon.putalpha(Image.composite(icon.getchannel("A"), Image.new("L", (s, s), 0), mask))
    top = int(cy - 48 * r)
    img.alpha_composite(icon, (int(W / 2 - s / 2), top))

    d = ImageDraw.Draw(img)
    word = ImageFont.truetype(BOLD, 30 * r)
    d.text((W / 2, top + s + 22 * r), "Fitrack", font=word, fill=(255, 255, 255, 255), anchor="mt")

    # Semi-transparent text needs its own layer to blend, not overwrite.
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    tag = ImageFont.truetype(SEMI, 11 * r)
    text = "IPPT · WEIGHT · TRAINING"
    spacing = 1.6 * r
    widths = [d.textlength(c, font=tag) for c in text]
    x = W / 2 - (sum(widths) + spacing * (len(text) - 1)) / 2
    y = H - 64 * r
    for c, cw in zip(text, widths):
        d.text((x, y), c, font=tag, fill=(235, 235, 245, 105), anchor="ls")
        x += cw + spacing
    img = Image.alpha_composite(img, layer)

    out = f"{ROOT}/public/splash/splash-{W}x{H}.png"
    img.convert("RGB").save(out, optimize=True)
    return out


for w, h, r in DEVICES:
    print(render(w, h, r))

# The rounded mark on its own, for the in-app splash that takes over from the static image.
s = 288
mark = ICON.resize((s, s), Image.LANCZOS)
mask = Image.new("L", (s, s), 0)
ImageDraw.Draw(mask).rounded_rectangle((0, 0, s - 1, s - 1), radius=int(s * 0.225), fill=255)
mark.putalpha(Image.composite(mark.getchannel("A"), Image.new("L", (s, s), 0), mask))
mark.save(f"{ROOT}/public/splash/mark.png", optimize=True)
print("mark.png")
