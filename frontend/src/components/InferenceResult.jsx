import React from 'react';
import { Download, ActivitySquare } from 'lucide-react';

export default function InferenceResult({ originalImgUrl, result }) {
  if (!result || result.model !== 'compare') return null;

  const nafnetSrc = `data:image/png;base64,${result.nafnet.denoised_image}`;
  const n2nSrc = `data:image/png;base64,${result.noise2noise.denoised_image}`;

  return (
    <div className="w-full space-y-6">
      {/* 3-Column Image Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Input */}
        <div className="flex flex-col">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Noisy Input</span>
          <div className="bg-black border border-zinc-800 rounded-xl overflow-hidden aspect-square">
            <img src={originalImgUrl} alt="Original" className="w-full h-full object-contain" />
          </div>
        </div>

        {/* NAFNet Output */}
        <div className="flex flex-col">
          <span className="text-xs font-medium pl-1 text-blue-400 uppercase tracking-wider mb-2">
            NAFNet (Supervised)
          </span>
          <div className="bg-black border border-blue-900/50 rounded-xl overflow-hidden aspect-square relative group">
            <img src={nafnetSrc} alt="NAFNet Denoised" className="w-full h-full object-contain" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <a href={nafnetSrc} download="denoised_nafnet.png" className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors">
                <Download className="w-4 h-4 mr-2" /> Download
              </a>
            </div>
          </div>
        </div>

        {/* Noise2Noise Output */}
        <div className="flex flex-col">
          <span className="text-xs font-medium pl-1 text-purple-400 uppercase tracking-wider mb-2">
            Noise2Noise (Self-Supervised)
          </span>
          <div className="bg-black border border-purple-900/50 rounded-xl overflow-hidden aspect-square relative group">
            <img src={n2nSrc} alt="Noise2Noise Denoised" className="w-full h-full object-contain" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <a href={n2nSrc} download="denoised_n2n.png" className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors">
                <Download className="w-4 h-4 mr-2" /> Download
              </a>
            </div>
          </div>
        </div>

      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* NAFNet Metrics */}
        <div className="flex justify-around items-center bg-zinc-900 border border-blue-900/30 rounded-xl p-4">
           <div className="flex flex-col items-center">
             <span className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">PSNR</span>
             <span className="text-lg font-mono text-blue-400">{result.nafnet.psnr ? `${result.nafnet.psnr} dB` : 'N/A'}</span>
           </div>
           <div className="flex flex-col items-center">
             <span className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">SSIM</span>
             <span className="text-lg font-mono text-blue-400">{result.nafnet.ssim ? result.nafnet.ssim : 'N/A'}</span>
           </div>
           <div className="flex flex-col items-center">
             <span className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Time</span>
             <span className="text-sm font-mono text-zinc-400">{result.nafnet.inference_time_ms} ms</span>
           </div>
        </div>

        {/* Noise2Noise Metrics */}
        <div className="flex justify-around items-center bg-zinc-900 border border-purple-900/30 rounded-xl p-4">
           <div className="flex flex-col items-center">
             <span className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">PSNR</span>
             <span className="text-lg font-mono text-purple-400">{result.noise2noise.psnr ? `${result.noise2noise.psnr} dB` : 'N/A'}</span>
           </div>
           <div className="flex flex-col items-center">
             <span className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">SSIM</span>
             <span className="text-lg font-mono text-purple-400">{result.noise2noise.ssim ? result.noise2noise.ssim : 'N/A'}</span>
           </div>
           <div className="flex flex-col items-center">
             <span className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Time</span>
             <span className="text-sm font-mono text-zinc-400">{result.noise2noise.inference_time_ms} ms</span>
           </div>
        </div>

      </div>
    </div>
  );
}