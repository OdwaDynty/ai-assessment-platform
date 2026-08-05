from fastapi import FastAPI, UploadFile, File, HTTPException

from extraction.pdf_extractor import extract_text_pymupdf
from extraction.ocr_extractor import extract_text_ocr

app = FastAPI(title="Document Processor")

MIN_TEXT_LENGTH_THRESHOLD = 50  # below this, assume the PDF is scanned/image-based


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/extract")
async def extract_text(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    pdf_bytes = await file.read()

    try:
        text, page_count = extract_text_pymupdf(pdf_bytes)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to open PDF: {str(e)}")

    ocr_used = False

    # If direct extraction yielded little/no text, this is likely a scanned PDF — fall back to OCR
    if len(text.strip()) < MIN_TEXT_LENGTH_THRESHOLD:
        try:
            text = extract_text_ocr(pdf_bytes)
            ocr_used = True
        except Exception as e:
            raise HTTPException(status_code=422, detail=f"OCR extraction failed: {str(e)}")

    return {
        "text": text,
        "pageCount": page_count,
        "ocrUsed": ocr_used,
        "characterCount": len(text),
    }