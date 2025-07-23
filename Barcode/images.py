from barcode import get_barcode_class
from barcode.writer import ImageWriter
import os

# Create output directory if it doesn't exist
os.makedirs('barcodes', exist_ok=True)

def generate_barcode(barcode_type, data, filename, options=None):
    """Generate a barcode image"""
    try:
        # Default options
        default_options = {
            'module_width': 0.2,
            'module_height': 15,
            'font_size': 10,
            'text_distance': 5,
            'quiet_zone': 5
        }
        
        # Merge with custom options
        if options:
            default_options.update(options)
        
        # Generate barcode
        barcode_class = get_barcode_class(barcode_type)
        barcode = barcode_class(data, writer=ImageWriter())
        
        # Save file
        full_path = os.path.join('barcodes', filename)
        barcode.save(full_path, options=default_options)
        
        print(f"Successfully generated {barcode_type} barcode: {full_path}.png")
        return full_path + '.png'
    except Exception as e:
        print(f"Error generating {barcode_type} barcode: {str(e)}")
        return None

# Example barcodes for pharmaceutical use
barcodes_to_generate = [
    # Format: (barcode_type, data, filename, options)
    ('upca', '036000291452', 'paracetamol_upc'),
    ('ean13', '5901234123457', 'ibuprofen_ean'),
    ('code128', 'DRUG-1A2B-3C4D', 'amoxicillin_code128', {'module_width': 0.3}),
    ('code39', 'MED-2023-001', 'loratadine_code39', {'add_checksum': False}),
    ('code128', 'PCT500-2023001', 'paracetamol_custom', {'module_height': 20, 'font_size': 12})
]

# Generate all barcodes
generated_files = []
for barcode in barcodes_to_generate:
    if len(barcode) == 3:
        generated = generate_barcode(barcode[0], barcode[1], barcode[2])
    else:
        generated = generate_barcode(barcode[0], barcode[1], barcode[2], barcode[3])
    if generated:
        generated_files.append(generated)

print("\nGenerated barcode files:")
for file in generated_files:
    print(f"- {file}")