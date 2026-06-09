FROM python:3.13-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml README.md* /app/
COPY cli/ /app/cli/
COPY tradingagents/ /app/tradingagents/

RUN pip install --no-cache-dir -e /app

RUN playwright install chromium --with-deps

COPY trading-be/ /app/trading-be/

RUN pip install --no-cache-dir -e /app/trading-be

RUN chmod +x /app/trading-be/scripts/startup.sh

WORKDIR /app

EXPOSE 8000

CMD ["bash", "/app/trading-be/scripts/startup.sh"]
