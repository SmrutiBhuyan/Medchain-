import random
import barcode
from barcode.writer import ImageWriter
from PIL import Image
import os

def generate_ibuprofen_barcodes(quantity=5):
    # Base product code for Ibuprofen 5
    base_code = "IBU5"
    
    # Create output directory if it doesn't exist
    if not os.path.exists("barcodes"):
        os.makedirs("barcodes")
    
    # Generate barcodes in different formats
    formats = {
        "CODE39": barcode.get_barcode_class('code39'),
        "CODE128": barcode.get_barcode_class('code128'),
        "EAN13": barcode.get_barcode_class('ean'),
        "UPC-A": barcode.get_barcode_class('upc')
    }
    
    generated_barcodes = []
    
    for i in range(1, quantity + 1):
        # Create unique serial number for each unit
        serial = f"{i:03d}"
        barcode_data = f"{base_code}-{serial}"
        
        # Generate in all formats
        for format_name, barcode_class in formats.items():
            try:
                # Special handling for EAN13 (needs 12-13 digits)
                if format_name == "EAN13":
                    ean_data = "5901234" + serial.zfill(5)
                    barcode_obj = barcode_class(ean_data, writer=ImageWriter())
                # Special handling for UPC-A (needs 11-12 digits)
                elif format_name == "UPC-A":
                    upc_data = "0360002" + serial.zfill(4)
                    barcode_obj = barcode_class(upc_data, writer=ImageWriter())
                else:
                    barcode_obj = barcode_class(barcode_data, writer=ImageWriter(), add_checksum=False)
                
                # Save barcode image
                filename = f"barcodes/IBU5-Unit{i}-{format_name}"
                barcode_obj.save(filename)
                
                # Convert to PNG and add human-readable text
                img = Image.open(filename + ".png")
                img_with_text = Image.new('RGB', (img.width, img.height + 30), color='white')
                img_with_text.paste(img, (0, 0))
                
                # Add text
                from PIL import ImageDraw, ImageFont
                draw = ImageDraw.Draw(img_with_text)
                try:
                    font = ImageFont.truetype("arial.ttf", 14)
                except:
                    font = ImageFont.load_default()
                
                text = f"IBU5-{serial} ({format_name})"
                text_width = draw.textlength(text, font=font)
                draw.text(((img.width - text_width) / 2, img.height + 5), text, font=font, fill="black")
                
                img_with_text.save(filename + ".png")
                generated_barcodes.append({
                    "unit": i,
                    "format": format_name,
                    "value": barcode_data,
                    "image": filename + ".png"
                })
                
            except Exception as e:
                print(f"Error generating {format_name} barcode: {e}")
    
    return generated_barcodes

# Generate 5 sample barcodes
barcodes = generate_ibuprofen_barcodes(5)
for bc in barcodes:
    print(f"Unit {bc['unit']} - {bc['format']}: {bc['value']} (saved as {bc['image']})")