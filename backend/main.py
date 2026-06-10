from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
import torch.nn as nn

from utils.rate_limit import limiter
from routers import denoise, jobs

# ---------------------------------------------------------
# 1. Define DummyModel FIRST (so lifespan can see it)
# ---------------------------------------------------------
class DummyModel(nn.Module):
    """
    A fake model that mimics the I/O contract of NAFNet/Noise2Noise.
    Takes a [1, 1, H, W] tensor and returns a [1, 1, H, W] tensor.
    """
    def forward(self, x):
        return x * 0.9 

# ---------------------------------------------------------
# 2. Define Lifespan SECOND
# ---------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager: Handles startup and shutdown events.
    """
    # Initialize in-memory data structures
    app.state.job_store = {}
    app.state.results_cache = {}

    print("Initializing DenoiseRX models...")
    # Now it knows what DummyModel is!
    app.state.nafnet = DummyModel() 
    app.state.n2n = DummyModel()
    print("Models loaded successfully.")

    yield # Server is now running and handling requests

    # Cleanup on shutdown
    print("Shutting down DenoiseRX. Clearing memory...")
    app.state.job_store.clear()
    app.state.results_cache.clear()

# ---------------------------------------------------------
# 3. Initialize App and Attach Middleware LAST
# ---------------------------------------------------------
app = FastAPI(
    title="DenoiseRX API",
    description="Asynchronous X-Ray Denoising API via NAFNet & Noise2Noise",
    version="1.0.0",
    lifespan=lifespan
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(denoise.router, prefix="/denoise", tags=["Inference"])
app.include_router(jobs.router, prefix="/job", tags=["Job Queue"])

@app.get("/health", tags=["System"])
@limiter.limit("30/minute")
async def health_check(request: Request):
    """Health check endpoint for pre-warming."""
    models_ready = {
        "nafnet": app.state.nafnet is not None,
        "noise2noise": app.state.n2n is not None
    }
    
    active_jobs = sum(
        1 for job in app.state.job_store.values() 
        if job.get("status") in ["queued", "processing"]
    )

    return {
        "status": "ok",
        "models_loaded": models_ready,
        "cache_entries": len(app.state.results_cache),
        "active_jobs": active_jobs
    }