FROM python:3.7-bookworm
WORKDIR /opt/app
COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade -r requirements.txt
COPY *.py ./
CMD [ "uvicorn", "app:app", "--host", "0.0.0.0" ]
