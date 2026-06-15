import zlib
import struct

def parse_png(filename):
    with open(filename, 'rb') as f:
        signature = f.read(8)
        if signature != b'\x89PNG\r\n\x1a\n':
            raise ValueError("Not a PNG file")
        
        width = 0
        height = 0
        bit_depth = 0
        color_type = 0
        idat_data = b''
        
        while True:
            chunk_header = f.read(8)
            if not chunk_header or len(chunk_header) < 8:
                break
            length, chunk_type = struct.unpack('>I4s', chunk_header)
            data = f.read(length)
            crc = f.read(4)
            
            if chunk_type == b'IHDR':
                width, height, bit_depth, color_type, comp = struct.unpack('>IIBBB', data[:11])
            elif chunk_type == b'IDAT':
                idat_data += data
            elif chunk_type == b'IEND':
                break
                
    # Decompress IDAT
    decompressed = zlib.decompress(idat_data)
    
    # Calculate bytes per pixel
    # Color types: 2=RGB (3 bytes), 6=RGBA (4 bytes), 0=Grayscale (1 byte), 4=Grayscale+Alpha (2 bytes), 3=Indexed
    if color_type == 6:
        bpp = 4
    elif color_type == 2:
        bpp = 3
    elif color_type == 0:
        bpp = 1
    elif color_type == 4:
        bpp = 2
    else:
        # For simplicity, fallback or handle indexed
        bpp = 4
        
    stride = width * bpp + 1 # 1 byte for filter type per scanline
    
    # We want to check which pixels are non-transparent (Alpha > 0 or not empty)
    min_x, max_x = width, 0
    min_y, max_y = height, 0
    
    for y in range(height):
        row_offset = y * stride
        filter_type = decompressed[row_offset]
        # Skip filter decoding for a rough check or do simple reconstruction
        # Actually, let's decode properly if filter is 0 (None)
        # But if there are filters, we should reconstruct. Let's do a simple reconstruction for filtering
        # Since we just want to find where alpha is non-zero, let's write a proper scanline decoder.
    
    # Let's reconstruct the scanlines
    scanlines = []
    prev_row = bytearray(width * bpp)
    
    for y in range(height):
        row_offset = y * stride
        filter_type = decompressed[row_offset]
        current_row = bytearray(decompressed[row_offset + 1 : row_offset + stride])
        
        # Unfilter
        if filter_type == 0: # None
            pass
        elif filter_type == 1: # Sub
            for i in range(bpp, len(current_row)):
                current_row[i] = (current_row[i] + current_row[i - bpp]) & 0xFF
        elif filter_type == 2: # Up
            for i in range(len(current_row)):
                current_row[i] = (current_row[i] + prev_row[i]) & 0xFF
        elif filter_type == 3: # Average
            for i in range(len(current_row)):
                left = current_row[i - bpp] if i >= bpp else 0
                up = prev_row[i]
                current_row[i] = (current_row[i] + (left + up) // 2) & 0xFF
        elif filter_type == 4: # Paeth
            for i in range(len(current_row)):
                left = current_row[i - bpp] if i >= bpp else 0
                up = prev_row[i]
                up_left = prev_row[i - bpp] if i >= bpp else 0
                
                # Paeth predictor
                p = left + up - up_left
                pa = abs(p - left)
                pb = abs(p - up)
                pc = abs(p - up_left)
                if pa <= pb and pa <= pc:
                    pred = left
                elif pb <= pc:
                    pred = up
                else:
                    pred = up_left
                    
                current_row[i] = (current_row[i] + pred) & 0xFF
                
        prev_row = current_row
        
        # Check alpha channel
        if color_type == 6: # RGBA
            for x in range(width):
                a = current_row[x * bpp + 3]
                if a > 10: # not transparent
                    if x < min_x: min_x = x
                    if x > max_x: max_x = x
                    if y < min_y: min_y = y
                    if y > max_y: max_y = y
        elif color_type == 2: # RGB (no alpha)
            for x in range(width):
                r = current_row[x * bpp]
                g = current_row[x * bpp + 1]
                b = current_row[x * bpp + 2]
                if r < 250 or g < 250 or b < 250: # not pure white (assuming white is bg)
                    if x < min_x: min_x = x
                    if x > max_x: max_x = x
                    if y < min_y: min_y = y
                    if y > max_y: max_y = y
                    
    return {
        "width": width,
        "height": height,
        "bbox": (min_x, min_y, max_x, max_y),
        "content_width": max_x - min_x + 1 if max_x >= min_x else 0,
        "content_height": max_y - min_y + 1 if max_y >= min_y else 0
    }

try:
    print('proceed countdown background:', parse_png('public/images/proceed countdown background.png'))
    print('proceed countdown outer:', parse_png('public/images/proceed countdown outer.png'))
    print('proceed countdown inner:', parse_png('public/images/proceed countdown inner.png'))
except Exception as e:
    import traceback
    traceback.print_exc()
