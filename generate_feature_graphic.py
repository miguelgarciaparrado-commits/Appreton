#!/usr/bin/env python3
"""Generates the 1024x500 Google Play feature graphic for APPreton."""

from PIL import Image, ImageDraw, ImageFont
import math

W, H = 1024, 500
MARGIN = 90

# Colors
BG_CREAM     = (245, 230, 211)   # #F5E6D3
BROWN_DARK   = (139, 69, 19)     # #8B4513
BROWN_MID    = (210, 105, 30)    # #D2691E
GOLD         = (255, 215, 0)     # #FFD700
WHITE        = (255, 255, 255)
BROWN_SHADOW = (100, 50, 10)

FONT_BOLD = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
FONT_REG  = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

img = Image.new("RGB", (W, H), BG_CREAM)
draw = ImageDraw.Draw(img)

# ── Background decorative circles (subtle) ──────────────────────────────────
for cx, cy, r, alpha in [
    (820, 80,  140, 18),
    (900, 420, 100, 14),
    (60,  60,   80, 12),
    (150, 430,  60, 10),
]:
    overlay = Image.new("RGB", (W, H), BG_CREAM)
    od = ImageDraw.Draw(overlay)
    od.ellipse([cx-r, cy-r, cx+r, cy+r], fill=BROWN_MID)
    img = Image.blend(img, overlay, alpha/100)
    draw = ImageDraw.Draw(img)

# ── Gold accent bar at top ───────────────────────────────────────────────────
draw.rectangle([0, 0, W, 8], fill=GOLD)
draw.rectangle([0, H-8, W, H], fill=GOLD)

# ── Poop emoji drawn in pure Pillow (no font dependency) ────────────────────
def draw_poop(draw, cx, cy, size):
    """Draw a stylized poop emoji using shapes."""
    s = size

    # Shadow
    draw.ellipse([cx - s*0.52 + 4, cy - s*0.18 + 4, cx + s*0.52 + 4, cy + s*0.52 + 4],
                 fill=(80, 40, 5))

    # Base mound (brown)
    draw.ellipse([cx - s*0.52, cy - s*0.18, cx + s*0.52, cy + s*0.52], fill=BROWN_DARK)
    draw.ellipse([cx - s*0.38, cy - s*0.48, cx + s*0.38, cy + s*0.20], fill=BROWN_DARK)
    draw.ellipse([cx - s*0.24, cy - s*0.72, cx + s*0.24, cy - s*0.08], fill=BROWN_DARK)
    # Tip
    draw.ellipse([cx - s*0.12, cy - s*0.88, cx + s*0.12, cy - s*0.56], fill=BROWN_MID)

    # Highlight swirls (lighter brown)
    draw.ellipse([cx - s*0.45, cy - s*0.10, cx + s*0.10, cy + s*0.40], fill=BROWN_MID)
    draw.ellipse([cx - s*0.30, cy - s*0.42, cx + s*0.12, cy + s*0.05], fill=BROWN_MID)
    draw.ellipse([cx - s*0.18, cy - s*0.65, cx + s*0.10, cy - s*0.18], fill=BROWN_MID)

    # Eyes (white + pupil)
    ey = cy + s*0.04
    for ex_off in [-0.16, 0.16]:
        ex = cx + s*ex_off
        draw.ellipse([ex - s*0.09, ey - s*0.09, ex + s*0.09, ey + s*0.09], fill=WHITE)
        draw.ellipse([ex - s*0.045, ey - s*0.045, ex + s*0.045, ey + s*0.045], fill=(30, 15, 0))

    # Smile
    smile_box = [cx - s*0.18, cy + s*0.14, cx + s*0.18, cy + s*0.36]
    draw.arc(smile_box, start=10, end=170, fill=WHITE, width=max(3, int(s*0.045)))

    # Rosy cheeks
    for chk_x in [cx - s*0.28, cx + s*0.28]:
        draw.ellipse([chk_x - s*0.09, ey + s*0.04, chk_x + s*0.09, ey + s*0.16],
                     fill=(210, 100, 80, 160))

    # Stars / sparkles around poop
    star_positions = [
        (cx - s*0.72, cy - s*0.55),
        (cx + s*0.68, cy - s*0.60),
        (cx - s*0.65, cy + s*0.15),
    ]
    for sx, sy in star_positions:
        sr = max(6, int(s * 0.07))
        draw.text((int(sx), int(sy)), "✨", fill=GOLD)

draw_poop(draw, cx=200, cy=250, size=160)

# ── App name "APPreton" ──────────────────────────────────────────────────────
try:
    font_title = ImageFont.truetype(FONT_BOLD, 108)
    font_tag   = ImageFont.truetype(FONT_BOLD, 36)
    font_sub   = ImageFont.truetype(FONT_REG,  26)
except Exception as e:
    print(f"Font error: {e}")
    font_title = ImageFont.load_default()
    font_tag   = font_title
    font_sub   = font_title

title_text = "APPreton"
tx = 400
ty = 130

# Shadow
draw.text((tx+4, ty+4), title_text, font=font_title, fill=BROWN_SHADOW)
# Main gradient-like effect: draw twice with slight offset in lighter brown
draw.text((tx+2, ty+2), title_text, font=font_title, fill=BROWN_MID)
draw.text((tx,   ty),   title_text, font=font_title, fill=BROWN_DARK)

# Gold underline
bbox = draw.textbbox((tx, ty), title_text, font=font_title)
line_y = bbox[3] + 6
draw.rectangle([tx, line_y, bbox[2], line_y + 6], fill=GOLD)

# ── Tagline ──────────────────────────────────────────────────────────────────
tag_y = line_y + 22
tag_text = "¿Te cagas? ¡Ábreme!"
draw.text((tx+2, tag_y+2), tag_text, font=font_tag, fill=BROWN_SHADOW)
draw.text((tx,   tag_y),   tag_text, font=font_tag, fill=BROWN_DARK)

# ── Sub-tagline ──────────────────────────────────────────────────────────────
sub_y = tag_y + 56
sub_text = "Encuentra WC limpios cerca de ti"
draw.text((tx, sub_y), sub_text, font=font_sub, fill=BROWN_MID)

# ── Small decorative toilet icon (bottom-right corner, away from text) ───────
def draw_toilet_icon(draw, x, y, size):
    s = size
    draw.rounded_rectangle([x, y, x+s, y+s*0.45], radius=s*0.08, fill=BROWN_MID)
    draw.ellipse([x - s*0.08, y + s*0.38, x + s*1.08, y + s], fill=BROWN_MID)
    draw.ellipse([x + s*0.10, y + s*0.50, x + s*0.90, y + s*0.95], fill=BG_CREAM)
    draw.line([x + s*0.05, y + s*0.44, x + s*0.95, y + s*0.44], fill=BROWN_DARK, width=3)

draw_toilet_icon(draw, x=900, y=340, size=70)

# ── Gold star rating (drawn as polygons, no emoji font needed) ────────────────
def draw_star(draw, cx, cy, r_outer, r_inner, fill):
    points = []
    for i in range(10):
        angle = math.radians(i * 36 - 90)
        r = r_outer if i % 2 == 0 else r_inner
        points.append((cx + r * math.cos(angle), cy + r * math.sin(angle)))
    draw.polygon(points, fill=fill)

star_x = tx
star_y = sub_y + 46
for i in range(5):
    draw_star(draw, cx=star_x + 18 + i*40, cy=star_y+14, r_outer=14, r_inner=6, fill=GOLD)

# ── Bottom tagline strip ──────────────────────────────────────────────────────
draw.rectangle([0, H-52, W, H-8], fill=BROWN_DARK)
bottom_font = ImageFont.truetype(FONT_BOLD, 22)
bottom_text = "La app de WC publicos mas divertida"
btw = draw.textlength(bottom_text, font=bottom_font)
draw.text(((W - btw) / 2, H-42), bottom_text, font=bottom_font, fill=GOLD)

# ── Save ──────────────────────────────────────────────────────────────────────
out_path = "/home/user/Appreton/feature-graphic.png"
img.save(out_path, "PNG")
print(f"Saved: {out_path}  ({W}x{H}px)")
