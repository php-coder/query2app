FROM golang:1.14 AS builder
WORKDIR /opt
COPY go.mod ./
RUN go mod download
COPY *.go ./
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o app

FROM scratch
WORKDIR /opt/app
COPY --from=builder /opt/app .
CMD [ "/opt/app/app" ]
