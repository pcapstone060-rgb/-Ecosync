from PIL import Image
import base64
import io

img_path = r"C:\Users\sreek\.gemini\antigravity\brain\33324ec0-501f-420d-8fa6-4ce96e219a53\s4_premium_logo_1772602535948.png"
output_path = r"C:\Users\sreek\.gemini\antigravity\brain\33324ec0-501f-420d-8fa6-4ce96e219a53\s4_logo_small.png"

with Image.open(img_path) as img:
    # Resize to something small like 80x80
    img.thumbnail((120, 120))
    # Save with high compression
    img.save(output_path, "PNG", optimize=True)

with open(output_path, "rb") as f:
    encoded = base64.b64encode(f.read()).decode('utf-8')
    print(f"BASE64_LENGTH: {len(encoded)}")
    print(f"BASE64_START: {encoded[:100]}...")
    print(f"FULL_BASE64: {encoded}")
