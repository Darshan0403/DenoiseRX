import uuid
from fastapi import APIRouter, Request, UploadFile, File, Form, BackgroundTasks, HTTPException
from utils.jobs import run_inference_task, run_compare_task
from utils.rate_limit import limiter
from utils.cache import check_cache
from utils.jobs import run_inference_task

router = APIRouter()

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
ALLOWED_TYPES = ["image/jpeg", "image/png"]

async def validate_and_read_file(file: UploadFile) -> bytes:
    """Helper function to validate file type and size before processing."""
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Invalid file type. Only PNG and JPG are accepted.")
    
    image_bytes = await file.read()
    if len(image_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB.")
    
    return image_bytes

@router.post("/nafnet")
@limiter.limit("5/minute")
async def denoise_nafnet(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    sigma: int = Form(25),
    add_noise: bool = Form(False)
):
    """
    Enqueues a NAFNet denoising job. 
    Returns a job ID immediately or a cached result if previously computed.
    """
    image_bytes = await validate_and_read_file(file)
    model_name = "nafnet"

    # 1. Check in-memory cache first
    cached_result = check_cache(request.app.state.results_cache, image_bytes, model_name, sigma)
    if cached_result:
        # Generate a dummy job ID for consistency, but return the completed result instantly
        job_id = str(uuid.uuid4())[:8]
        return {"job_id": job_id, "cache_hit": True, **cached_result}

    # 2. Generate new Job ID and register it in the global state
    job_id = str(uuid.uuid4())[:8]
    request.app.state.job_store[job_id] = {
        "status": "queued",
        "model": model_name,
        "cache_hit": False
    }

    # 3. Hand the heavy lifting off to the Starlette thread pool
    background_tasks.add_task(
        run_inference_task,
        job_id=job_id,
        image_bytes=image_bytes,
        model_name=model_name,
        sigma=sigma,
        add_noise=add_noise,
        job_store=request.app.state.job_store,
        cache_store=request.app.state.results_cache,
        models={"nafnet": request.app.state.nafnet}
    )

    # 4. Return instantly so the frontend UI doesn't freeze
    return {
        "job_id": job_id, 
        "status": "queued", 
        "model": model_name, 
        "cache_hit": False
    }

@router.post("/noise2noise")
@limiter.limit("5/minute")
async def denoise_noise2noise(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    sigma: int = Form(25),
    add_noise: bool = Form(False)
):
    """
    Enqueues a Noise2Noise denoising job.
    Identical pipeline to NAFNet, just targets the self-supervised model.
    """
    image_bytes = await validate_and_read_file(file)
    model_name = "noise2noise"

    cached_result = check_cache(request.app.state.results_cache, image_bytes, model_name, sigma)
    if cached_result:
        job_id = str(uuid.uuid4())[:8]
        return {"job_id": job_id, "cache_hit": True, **cached_result}

    job_id = str(uuid.uuid4())[:8]
    request.app.state.job_store[job_id] = {
        "status": "queued",
        "model": model_name,
        "cache_hit": False
    }

    background_tasks.add_task(
        run_inference_task,
        job_id=job_id,
        image_bytes=image_bytes,
        model_name=model_name,
        sigma=sigma,
        add_noise=add_noise,
        job_store=request.app.state.job_store,
        cache_store=request.app.state.results_cache,
        models={"noise2noise": request.app.state.n2n}
    )

    return {
        "job_id": job_id, 
        "status": "queued", 
        "model": model_name, 
        "cache_hit": False
    }

@router.post("/compare")
@limiter.limit("3/minute")
async def denoise_compare(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    sigma: int = Form(25),
    add_noise: bool = Form(False)
):
    """
    Enqueues a job to run BOTH models on the same image.
    Rate limit is stricter (3/min) due to double compute cost.
    """
    image_bytes = await validate_and_read_file(file)
    
    job_id = str(uuid.uuid4())[:8]
    request.app.state.job_store[job_id] = {
        "status": "queued",
        "model": "compare",
        "cache_hit": False
    }

    background_tasks.add_task(
        run_compare_task,
        job_id=job_id,
        image_bytes=image_bytes,
        sigma=sigma,
        add_noise=add_noise,
        job_store=request.app.state.job_store,
        models={
            "nafnet": request.app.state.nafnet, 
            "noise2noise": request.app.state.n2n
        }
    )

    return {
        "job_id": job_id, 
        "status": "queued", 
        "model": "compare", 
        "cache_hit": False
    }