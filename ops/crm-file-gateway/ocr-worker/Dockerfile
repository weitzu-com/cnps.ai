FROM python:3.11-slim-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends tesseract-ocr tesseract-ocr-chi-sim tesseract-ocr-eng poppler-utils libreoffice-writer libreoffice-impress fonts-noto-cjk && pip install --no-cache-dir pypdf==6.20.1 Pillow==12.3.0 olefile==0.47 && rm -rf /var/lib/apt/lists/*
WORKDIR /worker
USER 65534:65534
CMD ["python", "/worker/server.py"]
