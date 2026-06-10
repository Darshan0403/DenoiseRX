import React, { useState, useCallback } from 'react';
import { RefreshCcw } from 'lucide-react';

// API & Hooks
import { submitCompareJob } from '../api/denoise';
import useJobPoller from '../hooks/useJobPoller';

// UI Components
import NoiseSlider from '../components/NoiseSlider';
import ImageSelector from '../components/ImageSelector';
import UploadZone from '../components/UploadZone';
import LoadingState from '../components/LoadingState';
import InferenceResult from '../components/InferenceResult';

export default function Inference() {
  // Master State
  const [sigma, setSigma] = useState(25);
  const [addNoise, setAddNoise] = useState(false);
  
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  const [jobId, setJobId] = useState(null);
  const [resultPayload, setResultPayload] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Hook handles the polling loop automatically when jobId is set
  const currentStatus = useJobPoller(
    jobId,
    (data) => setResultPayload(data),
    (error) => setErrorMsg(error)
  );

  // Handlers
  const handleImageSelect = (file, url) => {
    setImageFile(file);
    setPreviewUrl(url);
    setErrorMsg(null);
  };

  const handleRunInference = async () => {
    if (!imageFile) return;
    setErrorMsg(null);
    setResultPayload(null);
    
    try {
      // We now strictly use the Comparison pipeline
      const data = await submitCompareJob(imageFile, sigma, addNoise);
      
      if (data.cache_hit) {
        setResultPayload(data); // Instantly show result
      } else {
        setJobId(data.job_id);  // Start the polling loop
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to connect to the inference API.");
    }
  };

  const handleReset = useCallback(() => {
    setImageFile(null);
    setPreviewUrl(null);
    setJobId(null);
    setResultPayload(null);
    setErrorMsg(null);
  }, []);

  // Determine what phase of the UI to show
  const isSetupPhase = !jobId && !resultPayload;
  const isProcessingPhase = jobId && !resultPayload && !errorMsg;
  const isCompletePhase = !!resultPayload;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Live Inference Engine</h1>
        <p className="text-zinc-400">Select a radiograph to run through both architectures sequentially.</p>
      </div>

      <div className="space-y-8">
        {/* Settings Panel */}
        {isSetupPhase && (
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
            <NoiseSlider addNoise={addNoise} setAddNoise={setAddNoise} sigma={sigma} setSigma={setSigma} />
          </div>
        )}

        {/* Errors */}
        {errorMsg && (
          <div className="p-4 bg-red-900/50 border border-red-500 rounded-xl text-red-200">
            <strong>Error:</strong> {errorMsg}
            <button onClick={handleReset} className="ml-4 underline hover:text-white">Start Over</button>
          </div>
        )}

        {/* Phase 1: Setup & Selection */}
        {isSetupPhase && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {!imageFile ? (
              <>
                <ImageSelector onImageSelect={handleImageSelect} />
                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-zinc-800" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-black px-4 text-sm text-zinc-500">or manual upload</span>
                  </div>
                </div>
                <UploadZone onFileSelect={handleImageSelect} />
              </>
            ) : (
              <div className="flex flex-col items-center space-y-6 p-8 border border-zinc-800 bg-zinc-900 rounded-2xl">
                <img src={previewUrl} alt="Selected" className="max-h-64 rounded-xl border border-zinc-700" />
                <div className="flex space-x-4">
                  <button 
                    onClick={handleReset}
                    className="px-6 py-2 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 rounded-xl transition"
                  >
                    Change Image
                  </button>
                  <button 
                    onClick={handleRunInference}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.5)] transition"
                  >
                    Run Comparison Pipeline
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Phase 2: Processing (Polling) */}
        {isProcessingPhase && (
          <LoadingState status={currentStatus} model="compare" />
        )}

        {/* Phase 3: Results */}
        {isCompletePhase && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <InferenceResult originalImgUrl={previewUrl} result={resultPayload} />
            <div className="flex justify-center pt-4">
              <button 
                onClick={handleReset}
                className="flex items-center px-6 py-2 border border-zinc-700 text-zinc-300 hover:bg-zinc-800 rounded-xl transition"
              >
                <RefreshCcw className="w-4 h-4 mr-2" />
                Run Another Scan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}