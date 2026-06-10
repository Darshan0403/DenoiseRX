from fastapi import APIRouter, Request, HTTPException
from utils.rate_limit import limiter

router = APIRouter()

@router.get("/{job_id}")
@limiter.limit("60/minute")
async def get_job_status(request: Request, job_id: str):
    """
    Polls the in-memory job store for inference status.
    Lifecycle: queued -> processing -> complete (or failed)
    """
    job = request.app.state.job_store.get(job_id)
    
    if not job:
        raise HTTPException(
            status_code=404, 
            detail="Job ID not found. It may have expired or never existed."
        )
    
    # Return the dictionary contents. If it's complete, this will automatically 
    # include the denoised_image, psnr, and inference_time_ms.
    return {"job_id": job_id, **job}