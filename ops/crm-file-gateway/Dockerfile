FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-venv && python3 -m venv /opt/extractor && /opt/extractor/bin/pip install --no-cache-dir pypdf==6.20.1 && rm -rf /var/lib/apt/lists/*
ENV CRM_EXTRACT_PYTHON=/opt/extractor/bin/python
ENTRYPOINT ["node", "/gateway/server.mjs"]
