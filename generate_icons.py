"""Generate Appreton app icons — cute poop centered in adaptive safe zone."""
from PIL import Image, ImageDraw


def draw_poop(draw, cx, cy, scale):
    """Draw a cute cartoon poop centered at (cx, cy) with given scale."""
    s = scale / 1024

    brown_dark = (101, 67, 33)
    brown_mid = (139, 90, 43)
    brown_light = (160, 110, 60)

    # Base (widest)
    base_y = cy + int(180 * s)
    bw, bh = int(280 * s), int(160 * s)
    draw.ellipse([cx - bw, base_y - bh, cx + bw, base_y + bh], fill=brown_dark)

    # Middle
    mid_y = cy + int(40 * s)
    mw, mh = int(220 * s), int(150 * s)
    draw.ellipse([cx - mw, mid_y - mh, cx + mw, mid_y + mh], fill=brown_mid)

    # Connect base ↔ middle
    draw.rectangle([cx - int(200 * s), mid_y, cx + int(200 * s), base_y], fill=brown_mid)
    draw.rectangle([cx - int(260 * s), cy + int(110 * s), cx + int(260 * s), base_y], fill=brown_dark)

    # Upper
    upper_y = cy - int(80 * s)
    uw, uh = int(160 * s), int(130 * s)
    draw.ellipse([cx - uw, upper_y - uh, cx + uw, upper_y + uh], fill=brown_light)
    draw.rectangle([cx - int(150 * s), upper_y, cx + int(150 * s), mid_y], fill=brown_mid)

    # Top swirl
    top_y = cy - int(190 * s)
    tw, th = int(100 * s), int(100 * s)
    draw.ellipse([cx - tw, top_y - th, cx + tw, top_y + th], fill=brown_light)

    # Tip curl
    tip_y = cy - int(260 * s)
    tiw, tih = int(55 * s), int(60 * s)
    draw.ellipse([cx - int(15 * s) - tiw, tip_y - tih,
                  cx - int(15 * s) + tiw, tip_y + tih], fill=brown_light)

    # Eyes
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
        draw.ellipse([px - pr + int(8 * s), eye_y - pr + int(4 * s),
                      px - pr + int(8 * s) + shr, eye_y - pr + int(4 * s) + shr],
                     fill='white')

    # Smile
    smy = cy + int(90 * s)
    smw, smh = int(75 * s), int(45 * s)
    draw.arc([cx - smw, smy - smh, cx + smw, smy + smh],
             0, 180, fill='white', width=max(1, int(10 * s)))

    # Rosy cheeks
    chr = int(28 * s)
    chy = cy + int(70 * s)
    chx = int(150 * s)
    draw.ellipse([cx - chx - chr, chy - chr, cx - chx + chr, chy + chr],
                 fill=(255, 180, 180, 100))
    draw.ellipse([cx + chx - chr, chy - chr, cx + chx + chr, chy + chr],
                 fill=(255, 180, 180, 100))


def make_icon(size, bg_color=None, safe_zone_pct=1.0):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    if bg_color:
        draw.ellipse([0, 0, size - 1, size - 1], fill=bg_color)

    poop_scale = size * safe_zone_pct
    draw_poop(draw, size // 2, size // 2 + int(size * 0.02), poop_scale)
    return img


BG = (139, 105, 20, 255)

# Adaptive foreground: content in inner 66% (safe zone)
fg = make_icon(1024, bg_color=None, safe_zone_pct=0.55)
fg.save('assets/adaptive-icon.png')
print('adaptive-icon.png (foreground, safe zone 55%)')

# Also save as android-icon-foreground
fg.save('assets/android-icon-foreground.png')
print('android-icon-foreground.png')

# Standard icon (with background, full)
icon = make_icon(1024, bg_color=BG, safe_zone_pct=0.75)
icon.save('assets/icon.png')
print('icon.png (1024x1024 with bg)')

# Copy as logo
icon.save('assets/logo-appreton.png')
icon.resize((512, 512), Image.LANCZOS).save('assets/logo-appreton-512.png')
print('logo-appreton.png + 512')

# Splash icon
icon.save('assets/splash-icon.png')
print('splash-icon.png')

# Favicon
fav = make_icon(196, bg_color=BG, safe_zone_pct=0.75)
fav.save('assets/favicon.png')
print('favicon.png (196x196)')

print('\nAll icons generated!')
