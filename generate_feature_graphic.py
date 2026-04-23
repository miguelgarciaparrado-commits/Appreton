"""Feature graphic 1024x500 para Google Play Store — Appreton."""
from PIL import Image, ImageDraw, ImageFont
import os

W, H = 1024, 500

BG = (139, 105, 20)
BG_LIGHT = (175, 140, 50)
WHITE = (255, 255, 255)
CREAM = (245, 222, 179)
BROWN_DARK = (101, 67, 33)
BROWN_MID = (139, 90, 43)
BROWN_LIGHT = (160, 110, 60)


def gradient_bg(draw, w, h):
    for y in range(h):
        t = y / h
        r = int(BG[0] * (1 - t) + BG_LIGHT[0] * t)
        g = int(BG[1] * (1 - t) + BG_LIGHT[1] * t)
        b = int(BG[2] * (1 - t) + BG_LIGHT[2] * t)
        draw.line([(0, y), (w, y)], fill=(r, g, b))


def draw_poop(draw, cx, cy, scale):
    s = scale / 1024
    base_y = cy + int(180 * s)
    bw, bh = int(280 * s), int(160 * s)
    draw.ellipse([cx - bw, base_y - bh, cx + bw, base_y + bh], fill=BROWN_DARK)
    mid_y = cy + int(40 * s)
    mw, mh = int(220 * s), int(150 * s)
    draw.ellipse([cx - mw, mid_y - mh, cx + mw, mid_y + mh], fill=BROWN_MID)
    draw.rectangle([cx - int(200 * s), mid_y, cx + int(200 * s), base_y], fill=BROWN_MID)
    draw.rectangle([cx - int(260 * s), cy + int(110 * s), cx + int(260 * s), base_y], fill=BROWN_DARK)
    upper_y = cy - int(80 * s)
    uw, uh = int(160 * s), int(130 * s)
    draw.ellipse([cx - uw, upper_y - uh, cx + uw, upper_y + uh], fill=BROWN_LIGHT)
    draw.rectangle([cx - int(150 * s), upper_y, cx + int(150 * s), mid_y], fill=BROWN_MID)
    top_y = cy - int(190 * s)
    tw, th = int(100 * s), int(100 * s)
    draw.ellipse([cx - tw, top_y - th, cx + tw, top_y + th], fill=BROWN_LIGHT)
    tip_y = cy - int(260 * s)
    tiw, tih = int(55 * s), int(60 * s)
    draw.ellipse([cx - int(15 * s) - tiw, tip_y - tih, cx - int(15 * s) + tiw, tip_y + tih], fill=BROWN_LIGHT)
    eye_y = cy + int(10 * s)
    esp = int(90 * s)
    er = int(42 * s)
    pr = int(22 * s)
    shr = int(9 * s)
    for side in (-1, 1):
        ex = cx + side * esp
        draw.ellipse([ex - er, eye_y - er, ex + er, eye_y + er], fill='white')
        px = ex + int(6 * s)
        draw.ellipse([px - pr, eye_y - pr, px + pr, eye_y + pr], fill=(50, 50, 50))
        draw.ellipse([px - pr + int(8 * s), eye_y - pr + int(4 * s), px - pr + int(8 * s) + shr, eye_y - pr + int(4 * s) + shr], fill='white')
    smy = cy + int(90 * s)
    smw, smh = int(75 * s), int(45 * s)
    draw.arc([cx - smw, smy - smh, cx + smw, smy + smh], 0, 180, fill='white', width=max(1, int(10 * s)))
    chr = int(28 * s)
    chy = cy + int(70 * s)
    chx = int(150 * s)
    draw.ellipse([cx - chx - chr, chy - chr, cx - chx + chr, chy + chr], fill=(255, 180, 180, 100))
    draw.ellipse([cx + chx - chr, chy - chr, cx + chx + chr, chy + chr], fill=(255, 180, 180, 100))


def find_font(size, bold=False):
    candidates = [
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf' if bold else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf' if bold else '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
        'C:/Windows/Fonts/arialbd.ttf' if bold else 'C:/Windows/Fonts/arial.ttf',
    ]
    for path in candidates:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


img = Image.new('RGB', (W, H), BG)
draw = ImageDraw.Draw(img)

gradient_bg(draw, W, H)

draw_poop(draw, 220, H // 2, 600)

title_font = find_font(92, bold=True)
subtitle_font = find_font(38, bold=True)
tagline_font = find_font(26, bold=False)

title = 'Appreton'
tx, ty = 430, 150
draw.text((tx + 3, ty + 3), title, font=title_font, fill=(80, 50, 0))
draw.text((tx, ty), title, font=title_font, fill=WHITE)

subtitle = '¿Te cagas? abreme'
draw.text((tx, ty + 110), subtitle, font=subtitle_font, fill=CREAM)

tagline = 'Encuentra los WC'
tagline2 = 'mas limpios cerca de ti'
draw.text((tx, ty + 165), tagline, font=tagline_font, fill=CREAM)
draw.text((tx, ty + 200), tagline2, font=tagline_font, fill=CREAM)

img.save('assets/feature-graphic.png')
print(f'Generated assets/feature-graphic.png ({W}x{H})')
