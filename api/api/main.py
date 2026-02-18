import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers.devices import router as devices_router

app = FastAPI(title="NyanLook API", docs_url=None, redoc_url=None, openapi_url=None)

origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(devices_router)
