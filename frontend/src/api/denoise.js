import axios from 'axios';

// Create an Axios instance with base configurations
const API = axios.create({
  baseURL: 'http://localhost:8000', // Points to our local FastAPI server
  timeout: 10000, // 10 second timeout
});

/**
 * 1. Health check / Pre-warming
 * Wakes up the server and checks if models are loaded.
 */
export const checkServerHealth = async () => {
  const response = await API.get('/health');
  return response.data;
};

/**
 * Helper to construct FormData for image uploads
 */
const createDenoiseFormData = (file, sigma, addNoise) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('sigma', sigma);
  formData.append('add_noise', addNoise);
  return formData;
};

/**
 * 2. PRIMARY INFERENCE PIPELINE: Submit Sequential Compare Job
 * Runs both NAFNet and Noise2Noise sequentially for the side-by-side UI.
 */
export const submitCompareJob = async (file, sigma = 25, addNoise = false) => {
  const formData = createDenoiseFormData(file, sigma, addNoise);
  const response = await API.post('/denoise/compare', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data; // Returns { job_id, status, model, cache_hit }
};

/**
 * 3. Poll Job Status
 * Fetches the current lifecycle state of a background worker task.
 */
export const getJobStatus = async (jobId) => {
  const response = await API.get(`/job/${jobId}`);
  return response.data; // Returns current job status and payload if complete
};

// ============================================================================
// LEGACY / INDIVIDUAL ENDPOINTS 
// (Kept for modularity in case you need to test single models later)
// ============================================================================

/**
 * Submit NAFNet Denoise Job (Single Model)
 */
export const submitNafnetJob = async (file, sigma = 25, addNoise = false) => {
  const formData = createDenoiseFormData(file, sigma, addNoise);
  const response = await API.post('/denoise/nafnet', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

/**
 * Submit Noise2Noise Denoise Job (Single Model)
 */
export const submitNoise2NoiseJob = async (file, sigma = 25, addNoise = false) => {
  const formData = createDenoiseFormData(file, sigma, addNoise);
  const response = await API.post('/denoise/noise2noise', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};