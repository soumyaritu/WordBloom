FROM python:3.12-slim

WORKDIR /app

# Copy dependency specifications and install
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code, multi-agent definitions, and skills
COPY backend ./backend

# Set python path so backend modules import seamlessly
ENV PYTHONPATH="/app/backend:${PYTHONPATH}"
ENV PORT=8080
EXPOSE 8080

CMD ["sh", "-c", "python -m uvicorn backend.main:app --host 0.0.0.0 --port ${PORT}"]
