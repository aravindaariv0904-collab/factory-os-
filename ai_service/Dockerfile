FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl gcc g++ libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY ai_service/requirements.txt /app/ai_service/requirements.txt
RUN pip install --no-cache-dir -r ai_service/requirements.txt

COPY ai_service /app/ai_service
COPY scripts /app/scripts
COPY models /app/models

ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

EXPOSE 8001

CMD ["uvicorn", "ai_service.app.main:app", "--host", "0.0.0.0", "--port", "8001"]
