import base64
import io

import qrcode


def qr_data_uri(data):
    img = qrcode.make(data, box_size=4, border=1)
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    encoded = base64.b64encode(buffer.getvalue()).decode("ascii")
    return f"data:image/png;base64,{encoded}"
