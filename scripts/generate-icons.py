"""Generates the PWA and Android icons: python3 scripts/generate-icons.py"""
from PIL import Image, ImageDraw, ImageFont

TEAL = (169, 36, 74)
WHITE = (255, 255, 255)
FONT = "/System/Library/Fonts/Helvetica.ttc"

def mark(size: int, inset: float, rounded: bool) -> Image.Image:
    image = Image.new("RGBA", (size, size), TEAL + (255,))
    draw = ImageDraw.Draw(image)
    # a "C" for CampusConnect with a small dot linking two people
    font = ImageFont.truetype(FONT, int(size * 0.62), index=1)
    text = "C"
    box = draw.textbbox((0, 0), text, font=font)
    width, height = box[2] - box[0], box[3] - box[1]
    draw.text(((size - width) / 2 - box[0] - size * 0.03, (size - height) / 2 - box[1] - size * 0.02), text, font=font, fill=WHITE)
    dot = size * 0.075
    cx, cy = size * 0.69, size * 0.5
    draw.ellipse((cx - dot, cy - dot, cx + dot, cy + dot), fill=WHITE)
    if rounded:
        mask = Image.new("L", (size, size), 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, size, size), radius=int(size * 0.22), fill=255)
        image.putalpha(mask)
    return image

mark(192, 0, True).save("public/icons/icon-192.png")
mark(512, 0, True).save("public/icons/icon-512.png")
mark(180, 0, False).convert("RGB").save("public/icons/apple-touch-icon.png")
# Maskable icons need the artwork inside the central safe zone, so draw it smaller on a full-bleed background
full = Image.new("RGBA", (512, 512), TEAL + (255,))
inner = mark(512, 0, False).resize((352, 352))
full.paste(inner, (80, 80))
full.convert("RGB").save("public/icons/maskable-512.png")
print("icons written")
