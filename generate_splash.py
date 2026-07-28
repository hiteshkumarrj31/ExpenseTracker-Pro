from PIL import Image
import os
import glob

source_path = 'assets/favicon/icon-512.png'

# Find all splash.png files in the res directory
splash_files = glob.glob('android/app/src/main/res/**/splash.png', recursive=True)

try:
    icon = Image.open(source_path).convert("RGBA")
    
    for splash_file in splash_files:
        # Get dimensions of existing splash to replace it identically
        with Image.open(splash_file) as original:
            w, h = original.size
            
        # Create a new white image of the same size
        bg = Image.new("RGBA", (w, h), (255, 255, 255, 255))
        
        # Scale icon to fit 40% of the screen width/height, whichever is smaller
        icon_size = int(min(w, h) * 0.4)
        scaled_icon = icon.resize((icon_size, icon_size), Image.Resampling.LANCZOS)
        
        # Calculate position to center the icon
        pos = ((w - icon_size) // 2, (h - icon_size) // 2)
        
        # Paste the icon onto the background using the icon as a mask for transparency
        bg.paste(scaled_icon, pos, scaled_icon)
        
        # Save over the old splash file
        bg.save(splash_file, "PNG")

    print(f"Splash screens generated successfully for {len(splash_files)} files!")
except Exception as e:
    print(f"Error generating splash screens: {e}")
