import time
import torch
import traceback
from typing import Dict, Any

from utils.preprocessing import (
    process_upload_to_tensor, 
    pad_to_multiple, 
    crop_to_original, 
    tensor_to_base64_png
)
from utils.metrics import calculate_psnr, calculate_ssim
from utils.cache import write_to_cache

def add_synthetic_noise(tensor: torch.Tensor, sigma: int) -> torch.Tensor:
    """
    Applies Additive White Gaussian Noise (AWGN) to a normalized [0,1] tensor.
    """
    # Convert sigma from a [0, 255] scale down to a [0, 1] scale
    sigma_scaled = sigma / 255.0
    noise = torch.randn_like(tensor) * sigma_scaled
    noisy_tensor = torch.clamp(tensor + noise, 0.0, 1.0)
    return noisy_tensor

def run_inference_task(
    job_id: str, 
    image_bytes: bytes, 
    model_name: str, 
    sigma: int, 
    add_noise: bool, 
    job_store: dict, 
    cache_store: dict, 
    models: dict
) -> None:
    """
    Synchronous worker executed in a Starlette thread pool.
    Handles the entire pipeline: preprocessing -> inference -> metrics -> caching.
    """
    try:
        # 1. Update status to processing
        job_store[job_id]["status"] = "processing"
        start_time = time.time()

        # 2. Select the correct model
        model = models.get(model_name)
        if not model:
            raise ValueError(f"Model '{model_name}' is not currently loaded in memory.")

        # 3. Preprocess the raw upload
        clean_tensor = process_upload_to_tensor(image_bytes)
        _, _, h, w = clean_tensor.shape
        
        # 4. Apply noise if requested (Demo mode)
        if add_noise:
            input_tensor = add_synthetic_noise(clean_tensor, sigma)
        else:
            input_tensor = clean_tensor

        # 5. Handle arbitrary resolutions via padding
        padded_input, original_hw = pad_to_multiple(input_tensor, multiple=8)

        # 6. Execute Forward Pass (No Gradients)
        with torch.no_grad():
            padded_output = model(padded_input)

        # 7. Crop back to original dimensions
        output_tensor = crop_to_original(padded_output, original_hw)

        # 8. Calculate Metrics (Only valid if we synthetically added noise to a clean image)
        psnr_val, ssim_val = None, None
        if add_noise:
            psnr_val = calculate_psnr(clean_tensor, output_tensor)
            ssim_val = calculate_ssim(clean_tensor, output_tensor)

        # 9. Format output for the frontend
        denoised_b64 = tensor_to_base64_png(output_tensor)
        inference_time_ms = int((time.time() - start_time) * 1000)

        # 10. Construct the final result payload
        result_payload = {
            "status": "complete",
            "model": model_name,
            "denoised_image": denoised_b64,
            "psnr": psnr_val,
            "ssim": ssim_val,
            "inference_time_ms": inference_time_ms,
            "image_shape": [h, w]
        }

        # 11. Write to Cache and Job Store
        write_to_cache(cache_store, image_bytes, model_name, sigma, result_payload)
        
        # We merge the existing job_id tracking info with the new result payload
        job_store[job_id].update(result_payload)

    except Exception as e:
        # Catch any OOM or tensor errors and pass them safely back to the frontend poller
        error_msg = str(e)
        print(f"[JOB {job_id} FAILED] {error_msg}")
        traceback.print_exc()
        job_store[job_id] = {
            "status": "failed",
            "error": "Internal inference error. Check server logs."
        }


def run_compare_task(
    job_id: str, 
    image_bytes: bytes, 
    sigma: int, 
    add_noise: bool, 
    job_store: dict, 
    models: dict
) -> None:
    """
    Runs an image through both NAFNet and Noise2Noise sequentially.
    Used by the /compare endpoint.
    """
    try:
        job_store[job_id]["status"] = "processing"
        
        # 1. Preprocess image once
        clean_tensor = process_upload_to_tensor(image_bytes)
        _, _, h, w = clean_tensor.shape
        
        input_tensor = add_synthetic_noise(clean_tensor, sigma) if add_noise else clean_tensor
        padded_input, original_hw = pad_to_multiple(input_tensor, multiple=8)

        results = {}
        
        # Run both models
        for model_name in ["nafnet", "noise2noise"]:
            start_time = time.time()
            model = models.get(model_name)
            
            if not model:
                raise ValueError(f"Model '{model_name}' is not loaded.")

            with torch.no_grad():
                padded_output = model(padded_input)

            output_tensor = crop_to_original(padded_output, original_hw)
            
            # UPDATE: For the sake of the demo, we will always calculate PSNR/SSIM 
            # against the clean_tensor, even if synthetic noise wasn't explicitly added.
            psnr_val = calculate_psnr(clean_tensor, output_tensor)
            ssim_val = calculate_ssim(clean_tensor, output_tensor)

            results[model_name] = {
                "denoised_image": tensor_to_base64_png(output_tensor),
                "psnr": psnr_val,
                "ssim": ssim_val,
                "inference_time_ms": int((time.time() - start_time) * 1000)
            }

        # Format combined response exactly as spec requested
        combined_payload = {
            "status": "complete",
            "model": "compare",
            "nafnet": results["nafnet"],
            "noise2noise": results["noise2noise"],
            "image_shape": [h, w]
        }
        
        job_store[job_id].update(combined_payload)

    except Exception as e:
        print(f"[COMPARE JOB {job_id} FAILED] {str(e)}")
        traceback.print_exc()
        job_store[job_id] = {
            "status": "failed",
            "error": "Internal comparison error. Check server logs."
        }