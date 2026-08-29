FROM python:3.11.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY jarvis_agent.py .

CMD ["python", "-m", "livekit.agents", "start", "--room", "jarvis-room", "jarvis_agent:entrypoint"]
