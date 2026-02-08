from PIL import Image, ImageDraw, ImageFilter

def create_icon(size, filename, transparent=False):
    # Colors
    BG_COLOR = (2, 6, 23, 255) # #020617
    CYAN_LOW = (34, 211, 238, 255) # #22d3ee
    CYAN_HIGH = (8, 145, 178, 255) # #0891b2
    SLATE = (30, 41, 59, 255) # #1e293b

    # Create image
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0) if transparent else BG_COLOR)
    draw = ImageDraw.Draw(img)
    
    scale = size / 100
    
    def s(val): return val * scale

    # 1. Background Glow (if not transparent)
    if not transparent:
        glow_size = int(s(80))
        glow = Image.new('RGBA', (glow_size, glow_size), (0, 0, 0, 0))
        draw_glow = ImageDraw.Draw(glow)
        draw_glow.ellipse([0, 0, glow_size, glow_size], fill=(34, 211, 238, 30))
        glow = glow.filter(ImageFilter.GaussianBlur(radius=s(10)))
        img.paste(glow, (int(s(10)), int(s(10))), glow)

    # 2. Shield Shape
    shield_pts = [
        (s(50), s(10)),  # Top
        (s(85), s(25)),  # Right top
        (s(85), s(50)),  # Right side
        (s(50), s(90)),  # Bottom
        (s(15), s(50)),  # Left side
        (s(15), s(25)),  # Left top
    ]
    draw.polygon(shield_pts, fill=SLATE, outline=CYAN_LOW, width=int(s(2)))
    
    # 3. Inner Accents (Radar circles)
    for radius in [15, 25, 35]:
        r = s(radius)
        bbox = [s(50)-r, s(50)-r, s(50)+r, s(50)+r]
        draw.arc(bbox, start=0, end=360, fill=(34, 211, 238, 100), width=int(s(0.5)))

    # 4. Vehicle Silhouette (Simplified)
    # Car body
    draw.polygon([
        (s(35), s(65)), (s(65), s(65)), (s(62), s(55)), (s(38), s(55))
    ], fill=CYAN_LOW)
    # Car roof
    draw.polygon([
        (s(40), s(55)), (s(60), s(55)), (s(56), s(45)), (s(44), s(45))
    ], fill=CYAN_LOW)
    
    # 5. Glowing pulse
    pulse_y = s(50)
    draw.line([(s(25), pulse_y), (s(40), pulse_y), (s(45), pulse_y-s(10)), (s(55), pulse_y+s(10)), (s(60), pulse_y), (s(75), pulse_y)], 
              fill=CYAN_HIGH, width=int(s(1.5)))

    img.save(filename)
    print(f"Created {filename}")

# Generate assets
import os
assets_dir = r"c:\Users\Nigeram Ventures\Desktop\FLEETGUARDIAN\mobile-tracker\assets"
os.makedirs(assets_dir, exist_ok=True)

create_icon(1024, os.path.join(assets_dir, "icon.png"))
create_icon(1024, os.path.join(assets_dir, "adaptive-icon.png"), transparent=True)
create_icon(1024, os.path.join(assets_dir, "splash-icon.png"))
create_icon(48, os.path.join(assets_dir, "favicon.png"))

# Also for device-app and dashboard if they have assets folders
for project in ["device-app", "dashboard"]:
    p_dir = os.path.join(r"c:\Users\Nigeram Ventures\Desktop\FLEETGUARDIAN", project)
    if os.path.exists(p_dir):
        # Create public folder if it doesn't exist
        pub_dir = os.path.join(p_dir, "public")
        os.makedirs(pub_dir, exist_ok=True)
        create_icon(64, os.path.join(pub_dir, "favicon.ico"))
        create_icon(512, os.path.join(pub_dir, "icon.png"))
