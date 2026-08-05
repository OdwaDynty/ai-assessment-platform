import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import io


def extract_text_ocr(pdf_bytes: bytes) -> str:
    """
    Extracts text from a PDF using OCR (Tesseract), for scanned/image-based PDFs.
    Renders each page as an image, then runs OCR on it.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")

    text_parts = []
    for page in doc:
        # Render page to an image at a reasonable resolution for OCR accuracy
        pix = page.get_pixmap(dpi=200)
        img_bytes = pix.tobytes("png")
        image = Image.open(io.BytesIO(img_bytes))

        page_text = pytesseract.image_to_string(image)
        text_parts.append(page_text)

    doc.close()

    return "\n\n".join(text_parts)