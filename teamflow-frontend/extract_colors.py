
import colorgram

# Extract 6 colors from the image
colors = colorgram.extract('public/assets/images/logo teamflow png.png', 6)

print("Extracted Colors:")
for color in colors:
    rgb = color.rgb
    hex_color = '#{:02x}{:02x}{:02x}'.format(rgb.r, rgb.g, rgb.b)
    print(f"RGB: {rgb}, Hex: {hex_color}, Proportion: {color.proportion}")
