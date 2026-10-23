from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

ROOT = Path(r"C:\Users\DELL\Documents\deepseek-harness\default-workspace\musichub\musichub-master")
PUBLIC = ROOT / "public"
ICONS = PUBLIC / "icons"
ICONS.mkdir(parents=True, exist_ok=True)

BG = (10, 10, 10)
FG = (250, 250, 250)
MUTED = (160, 160, 160)


def draw_icon(size):
    scale = 8
    img = Image.new("RGBA", (size * scale, size * scale), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    radius = int(size * scale * 0.25)
    d.rounded_rectangle(
        [0, 0, size * scale - 1, size * scale - 1], radius=radius, fill=BG
    )

    bars = [
        (0.195, 0.421, 0.578),
        (0.336, 0.312, 0.687),
        (0.477, 0.203, 0.796),
        (0.617, 0.328, 0.671),
        (0.758, 0.437, 0.562),
    ]
    bar_w = 0.078 * size * scale
    for x_ratio, top_ratio, bottom_ratio in bars:
        x = x_ratio * size * scale
        top = top_ratio * size * scale
        bottom = bottom_ratio * size * scale
        d.rounded_rectangle(
            [x, top, x + bar_w, bottom], radius=bar_w / 2, fill=FG
        )

    return img.resize((size, size), Image.LANCZOS)


for size, name in [
    (192, "icon-192.png"),
    (512, "icon-512.png"),
    (180, "apple-touch-icon.png"),
]:
    draw_icon(size).save(ICONS / name)
    print("wrote", ICONS / name)

# Open Graph card
W, H = 1200, 630
og = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(og)

# subtle border
d.rounded_rectangle([24, 24, W - 24, H - 24], radius=28, outline=(38, 38, 38), width=2)

# icon block
icon = draw_icon(132)
og.paste(icon, (72, 72), icon)

bold_path = r"C:\Windows\Fonts\segoeuib.ttf"
regular_path = r"C:\Windows\Fonts\segoeui.ttf"
try:
    title_font = ImageFont.truetype(bold_path, 92)
    subtitle_font = ImageFont.truetype(regular_path, 34)
    tag_font = ImageFont.truetype(bold_path, 24)
    small_font = ImageFont.truetype(regular_path, 24)
except Exception:
    title_font = ImageFont.load_default()
    subtitle_font = ImageFont.load_default()
    tag_font = ImageFont.load_default()
    small_font = ImageFont.load_default()

title = "VibeSound "
title_width = d.textlength(title, font=title_font)
d.text((72, 300), title, font=title_font, fill=FG)
d.text((72 + title_width, 300), "AI", font=title_font, fill=MUTED)
d.text((72, 436), "Your mood. Your music. Your discovery.", font=subtitle_font, fill=MUTED)

d.rounded_rectangle([72, 224, 472, 270], radius=23, outline=(60, 60, 60), width=2)
d.text((94, 234), "AI-POWERED MUSIC DISCOVERY", font=tag_font, fill=MUTED)

d.text((W - 330, H - 44), "musichub · vibesound ai", font=small_font, fill=(110, 110, 110))

og.save(PUBLIC / "og-vibesound.png", optimize=True)
print("wrote", PUBLIC / "og-vibesound.png")
