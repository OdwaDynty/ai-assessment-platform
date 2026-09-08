# apps/doc-processor/Dockerfile
#
# Python/FastAPI OCR service needs the tesseract-ocr system binary
# installed (pytesseract is just a Python wrapper around it), which
# Render's plain Python buildpack has no way to install -- a Dockerfile
# gives us full control to apt-get install it before running the app.

FROM python:3.11-slim

# Install tesseract-ocr (the actual OCR engine binary that pytesseract
# calls out to) and its dependencies.
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Render injects the actual port to bind to via the PORT env var.
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]