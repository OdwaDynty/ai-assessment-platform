import fitz  # PyMuPDF


def extract_text_pymupdf(pdf_bytes: bytes) -> tuple[str, int]:
    """
    Attempts direct text extraction from a PDF using PyMuPDF.
    Returns (extracted_text, page_count).
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    page_count = doc.page_count

    text_parts = []
    for page in doc:
        text_parts.append(page.get_text())

    doc.close()

    full_text = "\n\n".join(text_parts)
    return full_text, page_count