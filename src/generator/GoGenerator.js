module.exports = class GoGenerator {

    usageExampleAsText() {
        return `Use
  export DB_NAME=db DB_USER=user DB_PASSWORD=secret
  go run *.go
or
  go build -o app
  export DB_NAME=db DB_USER=user DB_PASSWORD=secret
  ./app
to build and run it`
    }

}
