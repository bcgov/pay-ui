FROM python:3.12-slim AS build
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY receiver.py test_receiver.py ./
RUN python -m unittest test_receiver -v

FROM python:3.12-slim
WORKDIR /app
COPY --from=build /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY receiver.py .
EXPOSE 8090
CMD ["python", "receiver.py"]
