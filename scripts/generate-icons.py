"""Generate app icons and the favicon from scripts/assets/amrita-source.png."""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "scripts/assets/amrita-source.png"
ICONS = ROOT / "public/icons"


def icon(size: int, artwork_size: int) -> Image.Image:
    canvas = Image.new("RGB", (size, size), "white")
    artwork = Image.open(SOURCE).convert("RGB").resize(
        (artwork_size, artwork_size), Image.Resampling.LANCZOS
    )
    canvas.paste(artwork, ((size - artwork.width) // 2, (size - artwork.height) // 2))
    return canvas


ICONS.mkdir(parents=True, exist_ok=True)
icon(192, 172).save(ICONS / "amrita-192.png", optimize=True)
icon(512, 460).save(ICONS / "amrita-512.png", optimize=True)
icon(180, 160).save(ICONS / "amrita-apple-touch.png", optimize=True)
icon(512, 352).save(ICONS / "amrita-maskable-512.png", optimize=True)
icon(48, 44).convert("RGBA").save(ROOT / "app/favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
print("App icons and favicon generated")
