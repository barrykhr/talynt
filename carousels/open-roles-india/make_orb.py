# Renders the soft pastel orb used on the Studio cover (assets/studio-orb.png).
from PIL import Image, ImageDraw, ImageFilter

S = 1400
img = Image.new("RGBA", (S, S), (236, 230, 255, 255))  # pale lilac base
blobs = [  # (cx, cy, r, colour)
    (480, 520, 520, (160, 190, 255)),  # periwinkle
    (950, 450, 460, (255, 196, 160)),  # peach
    (820, 950, 500, (212, 190, 255)),  # lilac
    (430, 1000, 360, (184, 234, 222)),  # mint
]
for cx, cy, r, c in blobs:
    # blur only the alpha, so colours never fade through black
    a = Image.new("L", (S, S), 0)
    ImageDraw.Draw(a).ellipse((cx - r, cy - r, cx + r, cy + r), fill=255)
    layer = Image.new("RGBA", (S, S), c + (0,))
    layer.putalpha(a.filter(ImageFilter.GaussianBlur(170)))
    img = Image.alpha_composite(img, layer)
mask = Image.new("L", (S, S), 0)
ImageDraw.Draw(mask).ellipse((60, 60, S - 60, S - 60), fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(6))
img.putalpha(Image.composite(img.getchannel("A"), Image.new("L", (S, S), 0), mask))
img.save(__file__.rsplit("/", 1)[0] + "/assets/studio-orb.png")
