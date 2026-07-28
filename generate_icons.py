from PIL import Image
import os

source_path = 'assets/favicon/icon-512.png'
base_res_path = 'android/app/src/main/res/'

sizes = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
}

try:
    img = Image.open(source_path)
    # Ensure it has an alpha channel
    img = img.convert("RGBA")
    
    for folder, size in sizes.items():
        folder_path = os.path.join(base_res_path, folder)
        if not os.path.exists(folder_path):
            os.makedirs(folder_path)
            
        resized_img = img.resize((size, size), Image.Resampling.LANCZOS)
        
        # Save normal
        normal_path = os.path.join(folder_path, 'ic_launcher.png')
        resized_img.save(normal_path, "PNG")
        
        # Save round (just same image for now)
        round_path = os.path.join(folder_path, 'ic_launcher_round.png')
        resized_img.save(round_path, "PNG")
        
        # Save foreground
        foreground_path = os.path.join(folder_path, 'ic_launcher_foreground.png')
        resized_img.save(foreground_path, "PNG")

    print("Icons generated successfully!")
except Exception as e:
    print(f"Error generating icons: {e}")
