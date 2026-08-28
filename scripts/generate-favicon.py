#!/usr/bin/env python3
"""Generate Jarvis favicon PNGs using Pillow."""
from PIL import Image, ImageDraw
import os

def generate_favicon(size):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    s = size / 512

    # Rounded rect paper background
    r = int(96 * s)
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=(244, 238, 226, 255))

    # Center
    cx, cy = size // 2, size // 2

    # Ink brush J — draw as thick polyline segments
    stroke_w = max(int(12 * s), 2)

    # Vertical stem
    draw.line(
        [(cx - int(8*s), cy - int(120*s)), (cx - int(6*s), cy - int(80*s)),
         (cx - int(4*s), cy - int(10*s)), (cx - int(4*s), cy + int(20*s))],
        fill=(26, 26, 26, 217), width=stroke_w
    )
    # Bottom curve
    draw.line(
        [(cx - int(4*s), cy + int(20*s)), (cx + int(0*s), cy + int(80*s)),
         (cx + int(10*s), cy + int(100*s))],
        fill=(26, 26, 26, 217), width=stroke_w
    )
    # Hook
    draw.line(
        [(cx + int(10*s), cy + int(100*s)), (cx + int(30*s), cy + int(120*s)),
         (cx + int(45*s), cy + int(115*s)), (cx + int(30*s), cy + int(75*s))],
        fill=(26, 26, 26, 217), width=stroke_w
    )

    # Ink bleed dots
    dot_r = max(int(2 * s), 1)
    draw.ellipse([cx - int(8*s) - dot_r, cy - int(75*s) - dot_r,
                  cx - int(8*s) + dot_r, cy - int(75*s) + dot_r],
                 fill=(26, 26, 26, 25))
    dot_r2 = max(int(1.5 * s), 1)
    draw.ellipse([cx + int(3*s) - dot_r2, cy + int(60*s) - dot_r2,
                  cx + int(3*s) + dot_r2, cy + int(60*s) + dot_r2],
                 fill=(26, 26, 26, 20))

    return img


public_dir = os.path.join(os.path.dirname(__file__), "..", "public")

sizes = {
    "favicon-192.png": 192,
    "favicon-512.png": 512,
    "apple-touch-icon.png": 180,
    "favicon.ico": 32,
}

for name, size in sizes.items():
    img = generate_favicon(size)
    out_path = os.path.join(public_dir, name)
    if name.endswith(".ico"):
        img.save(out_path, format="ICO", sizes=[(size, size)])
    else:
        img.save(out_path, format="PNG")
    print(f"Generated {name} ({size}x{size})")

print("Done!")
