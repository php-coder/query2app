from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from routes import router

from custom_routes import router as custom_router

app = FastAPI()

@app.exception_handler(Exception)
async def exception_handler(request: Request, ex: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"error": "Internal Server Error"}
    )

app.include_router(router)

app.include_router(custom_router)
