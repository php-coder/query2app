module.exports = class PyGenerator {

    usageExampleAsText() {
        return `Use
  pip install -r requirements.txt
to install its dependencies and
  export DB_NAME=db DB_USER=user DB_PASSWORD=secret
  uvicorn app:app --port 3000
afteward to run`
    }

}
