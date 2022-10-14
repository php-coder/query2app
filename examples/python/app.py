from fastapi import FastAPI
from routes import router

from custom_routes import router as custom_route

app = FastAPI()

app.include_router(router)

app.include_router(custom_route)
