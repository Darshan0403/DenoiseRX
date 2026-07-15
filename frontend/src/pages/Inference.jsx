import React, { useState, useCallback } from 'react';
import { RefreshCcw, Image as ImageIcon, UploadCloud, AlertCircle } from 'lucide-react';

// API & Hooks
import { submitProcessJob } from '../api/denoise';
import useJobPoller from '../hooks/useJobPoller';
import { resizeImageFile } from '../utils/imageProcessor';

// UI Components
import NoiseSlider from '../components/NoiseSlider';
import ImageSelector from '../components/ImageSelector';
import UploadZone from '../components/UploadZone';
import LoadingState from '../components/LoadingState';
import InferenceResult from '../components/InferenceResult';

export default function Inference() {
  // Tab State
  const [activeTab, setActiveTab] = useState('demo'); // 'demo' | 'upload'

  // Master State
  const [sigma, setSigma] = useState(25);
  const [addNoise, setAddNoise] = useState(true); // Default true for demo
  
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  
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
  const handleReset = useCallback(() => {
    setImageFile(null);
    setPreviewUrl(null);
    setJobId(null);
    setResultPayload(null);
    setErrorMsg(null);
    setIsResizing(false);
  }, []);

  const handleTabChange = (tab) => {
    handleReset();
    setActiveTab(tab);
    setAddNoise(tab === 'demo');
  };

  // Handles fast static selection from the Demo gallery
  const handleDemoImageSelect = (file, url) => {
    setImageFile(file);
    setPreviewUrl(url);
    setErrorMsg(null);
  };

  // Handles raw user uploads and safely resizes them client-side
  const handleCustomUpload = async (file) => {
    setErrorMsg(null);
    setIsResizing(true);
    try {
      // Safely clamp the image to 1024px max before it ever touches the backend
      const { file: resizedFile, url: resizedUrl } = await resizeImageFile(file, 1024);
      setImageFile(resizedFile);
      setPreviewUrl(resizedUrl);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to process the uploaded image. Please try a standard JPG or PNG.");
    } finally {
      setIsResizing(false);
    }
  };

  const handleRunInference = async () => {
    if (!imageFile) return;
    setErrorMsg(null);
    setResultPayload(null);
    
    try {
      // In Demo mode, we pass the slider's sigma and addNoise flags.
      // In Upload mode, we assume it's already noisy, so addNoise is false.
      const payloadSigma = activeTab === 'demo' ? sigma : 0;
      const payloadAddNoise = activeTab === 'demo';

      const data = await submitProcessJob(imageFile, payloadSigma, payloadAddNoise);
      
      if (data.cache_hit) {
        setResultPayload(data); 
      } else {
        setJobId(data.job_id);  
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to connect to the inference API. Check server status.");
    }
  };

  // Determine what phase of the UI to show
  const isSetupPhase = !jobId && !resultPayload;
  const isProcessingPhase = jobId && !resultPayload && !errorMsg;
  const isCompletePhase = !!resultPayload;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Live Inference Engine</h1>
        <p className="text-zinc-400">Evaluate the NAFNet pipeline on curated clinical samples or custom datasets.</p>
      </div>

      <div className="space-y-8">
        
        {/* The Dual-Tab Controller (Only visible during setup) */}
        {isSetupPhase && (
          <div className="flex p-1 bg-black border border-zinc-800 rounded-xl w-full max-w-md mx-auto">
            <button
              onClick={() => handleTabChange('demo')}
              className={`flex-1 flex items-center justify-center py-2.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'demo' 
                  ? 'bg-zinc-900 text-white shadow-sm border border-zinc-700' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Demo Mode
            </button>
            <button
              onClick={() => handleTabChange('upload')}
              className={`flex-1 flex items-center justify-center py-2.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'upload' 
                  ? 'bg-zinc-900 text-white shadow-sm border border-zinc-700' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <UploadCloud className="w-4 h-4 mr-2" />
              Custom Upload
            </button>
          </div>
        )}

        {/* Errors */}
        {errorMsg && (
          <div className="p-4 bg-red-900/30 border border-red-900/50 rounded-xl text-red-200 flex items-center">
            <AlertCircle className="w-5 h-5 mr-3 text-red-500" />
            <span className="flex-1 text-sm">{errorMsg}</span>
            <button onClick={handleReset} className="ml-4 text-sm font-medium underline hover:text-white">Clear</button>
          </div>
        )}

        {/* Phase 1: Setup & Selection */}
        {isSetupPhase && (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
            
            {/* The Image Selection UI (Changes based on active tab) */}
            {!imageFile ? (
              <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl">
                {activeTab === 'demo' ? (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-medium text-white">Select a Clinical Case</h3>
                      <p className="text-sm text-zinc-400">These 1024x1024 scans guarantee optimal inference speeds.</p>
                    </div>
                    <ImageSelector onImageSelect={handleDemoImageSelect} />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-medium text-white">Upload Custom Radiograph</h3>
                      <p className="text-sm text-zinc-400">Large files will be automatically scaled to 1024px to prevent memory overflow.</p>
                    </div>
                    {isResizing ? (
                      <div className="py-12 flex flex-col items-center justify-center text-zinc-500 border-2 border-dashed border-zinc-800 rounded-xl">
                        <RefreshCcw className="w-8 h-8 animate-spin mb-4" />
                        <p>Optimizing Image for Inference...</p>
                      </div>
                    ) : (
                      <UploadZone onFileSelect={handleCustomUpload} />
                    )}
                  </div>
                )}
              </div>
            ) : (
              
              /* The Ready State (Image is selected, ready to run) */
              <div className="flex flex-col items-center space-y-8">
                
                {/* The Configurator (Only show noise slider in Demo Mode) */}
                {activeTab === 'demo' && (
                  <div className="w-full bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                    <NoiseSlider addNoise={addNoise} setAddNoise={setAddNoise} sigma={sigma} setSigma={setSigma} />
                  </div>
                )}

                <div className="flex flex-col items-center space-y-6 p-8 border border-zinc-800 bg-zinc-900/80 backdrop-blur-sm rounded-2xl w-full max-w-2xl shadow-2xl">
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Target Image</span>
                  <img src={previewUrl} alt="Selected" className="max-h-64 rounded-xl border border-zinc-700 shadow-lg" />
                  
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
                    <button 
                      onClick={handleReset}
                      className="px-6 py-3 text-sm font-medium border border-zinc-700 text-zinc-300 hover:bg-zinc-800 rounded-xl transition"
                    >
                      Change Source
                    </button>
                    <button 
                      onClick={handleRunInference}
                      className="px-8 py-3 text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] transition-all flex items-center justify-center"
                    >
                      Execute NAFNet Pipeline
                      <RefreshCcw className="w-4 h-4 ml-2" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Phase 2: Processing (Polling) */}
        {isProcessingPhase && (
          <LoadingState status={currentStatus} model="nafnet" />
        )}

        {/* Phase 3: Results */}
        {isCompletePhase && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <InferenceResult originalImgUrl={previewUrl} result={resultPayload} />
            <div className="flex justify-center pt-8 border-t border-zinc-800 mt-8">
              <button 
                onClick={handleReset}
                className="flex items-center px-6 py-3 text-sm font-medium border border-zinc-700 text-zinc-300 hover:bg-zinc-800 rounded-xl transition"
              >
                <RefreshCcw className="w-4 h-4 mr-2" />
                Initialize New Job
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}