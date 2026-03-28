"""Generate a funny poop icon for Appreton app."""
from PIL import Image, ImageDraw, ImageFont
import math

def draw_poop_icon(size, bg_color=None):
    """Draw a cartoon poop emoji icon."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx, cy = size // 2, size // 2
    s = size / 1024  # scale factor

    # Background circle (optional)
    if bg_color:
        draw.ellipse([0, 0, size - 1, size - 1], fill=bg_color)

    # Poop body - brown layered shape
    brown_dark = (101, 67, 33)
    brown_mid = (139, 90, 43)
    brown_light = (160, 110, 60)

    # Base (widest part)
    base_y = int(620 * s)
    base_w = int(380 * s)
    base_h = int(220 * s)
    draw.ellipse([cx - base_w, base_y - base_h//2, cx + base_w, base_y + base_h//2], fill=brown_dark)

    # Middle section
    mid_y = int(460 * s)
    mid_w = int(300 * s)
    mid_h = int(200 * s)
    draw.ellipse([cx - mid_w, mid_y - mid_h//2, cx + mid_w, mid_y + mid_h//2], fill=brown_mid)

    # Connect base and middle
    draw.rectangle([cx - int(280*s), mid_y, cx + int(280*s), base_y], fill=brown_mid)
    draw.rectangle([cx - int(350*s), int(550*s), cx + int(350*s), base_y], fill=brown_dark)

    # Upper section
    upper_y = int(340 * s)
    upper_w = int(220 * s)
    upper_h = int(180 * s)
    draw.ellipse([cx - upper_w, upper_y - upper_h//2, cx + upper_w, upper_y + upper_h//2], fill=brown_light)

    # Connect middle and upper
    draw.rectangle([cx - int(200*s), upper_y, cx + int(200*s), mid_y], fill=brown_mid)

    # Top swirl
    top_y = int(230 * s)
    top_w = int(130 * s)
    top_h = int(140 * s)
    draw.ellipse([cx - top_w, top_y - top_h//2, cx + top_w, top_y + top_h//2], fill=brown_light)

    # Tip (the curl)
    tip_y = int(175 * s)
    tip_w = int(70 * s)
    tip_h = int(80 * s)
    draw.ellipse([cx - int(20*s) - tip_w, tip_y - tip_h//2, cx - int(20*s) + tip_w, tip_y + tip_h//2], fill=brown_light)

    # Eyes - white circles with black pupils
    eye_y = int(420 * s)
    eye_spacing = int(120 * s)
    eye_r = int(50 * s)
    pupil_r = int(25 * s)

    # Left eye
    draw.ellipse([cx - eye_spacing - eye_r, eye_y - eye_r, cx - eye_spacing + eye_r, eye_y + eye_r], fill='white')
    draw.ellipse([cx - eye_spacing - pupil_r + int(8*s), eye_y - pupil_r, cx - eye_spacing + pupil_r + int(8*s), eye_y + pupil_r], fill='black')
    # Eye shine
    shine_r = int(10 * s)
    draw.ellipse([cx - eye_spacing - pupil_r + int(15*s), eye_y - pupil_r + int(5*s), cx - eye_spacing - pupil_r + int(15*s) + shine_r, eye_y - pupil_r + int(5*s) + shine_r], fill='white')

    # Right eye
    draw.ellipse([cx + eye_spacing - eye_r, eye_y - eye_r, cx + eye_spacing + eye_r, eye_y + eye_r], fill='white')
    draw.ellipse([cx + eye_spacing - pupil_r + int(8*s), eye_y - pupil_r, cx + eye_spacing + pupil_r + int(8*s), eye_y + pupil_r], fill='black')
    # Eye shine
    draw.ellipse([cx + eye_spacing - pupil_r + int(15*s), eye_y - pupil_r + int(5*s), cx + eye_spacing - pupil_r + int(15*s) + shine_r, eye_y - pupil_r + int(5*s) + shine_r], fill='white')

    # Smile - a happy curve
    smile_y = int(520 * s)
    smile_w = int(100 * s)
    smile_h = int(60 * s)
    # Draw smile as arc
    draw.arc([cx - smile_w, smile_y - smile_h, cx + smile_w, smile_y + smile_h], 0, 180, fill='white', width=int(12*s))

    # Rosy cheeks
    cheek_r = int(35 * s)
    cheek_y = int(500 * s)
    cheek_x = int(200 * s)
    draw.ellipse([cx - cheek_x - cheek_r, cheek_y - cheek_r, cx - cheek_x + cheek_r, cheek_y + cheek_r], fill=(255, 180, 180, 120))
    draw.ellipse([cx + cheek_x - cheek_r, cheek_y - cheek_r, cx + cheek_x + cheek_r, cheek_y + cheek_r], fill=(255, 180, 180, 120))

    return img


# Generate all required icons
icons = {
    'assets/icon.png': (1024, '#8B6914'),
    'assets/adaptive-icon.png': (1024, None),
    'assets/splash-icon.png': (1024, '#8B6914'),
    'assets/favicon.png': (196, '#8B6914'),
}

for path, (size, bg) in icons.items():
    bg_tuple = None
    if bg:
        # Convert hex to RGB
        bg = bg.lstrip('#')
        bg_tuple = tuple(int(bg[i:i+2], 16) for i in (0, 2, 4)) + (255,)
    img = draw_poop_icon(size, bg_tuple)
    img.save(path)
    print(f'Generated {path} ({size}x{size})')

print('All icons generated!')
