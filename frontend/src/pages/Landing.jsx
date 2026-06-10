import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Zap, Layers, Activity } from 'lucide-react';

export default function Landing() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      
      {/* 1. HERO SECTION */}
      <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 flex flex-col lg:flex-row items-center gap-12">
        
        {/* Left Column: Copy & CTAs */}
        <div className="flex-1 space-y-8">
          <div className="inline-flex items-center px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-semibold tracking-wide uppercase">
            <Activity className="w-3 h-3 mr-2" />
            Research Preview Online
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-tight">
            Medical images are noisy. <br />
            <span className="text-zinc-500">Noise costs diagnoses.</span>
          </h1>
          
          <p className="text-lg text-zinc-400 max-w-2xl leading-relaxed">
            Two models. Two philosophies. One pipeline. <br/>
            Evaluate state-of-the-art supervised and self-supervised deep learning architectures for radiographic noise reduction.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link 
              to="/inference" 
              className="inline-flex justify-center items-center px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
            >
              Try Live Inference
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
            <Link 
              to="/samples" 
              className="inline-flex justify-center items-center px-6 py-3 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white font-medium transition-colors"
            >
              View Sample Gallery
            </Link>
          </div>
        </div>

        {/* Right Column: The Clinical Visual */}
        <div className="flex-1 w-full relative">
          <div className="aspect-[4/3] rounded-2xl border border-zinc-800 bg-zinc-900 overflow-hidden flex relative shadow-2xl">
            {/* Split Screen Mockup - Assuming chest_1.png exists from our previous steps */}
            <div className="w-1/2 h-full relative border-r border-zinc-800 bg-black">
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-zinc-300 text-xs px-2 py-1 rounded uppercase tracking-wider font-medium z-10">Noisy Input</div>
              <img src="/samples/chest_1.png" alt="Noisy X-ray" className="w-[200%] max-w-none h-full object-cover object-left opacity-60 mix-blend-screen" style={{ filter: 'noise(20%)' }} />
            </div>
            <div className="w-1/2 h-full relative bg-black">
              <div className="absolute top-4 right-4 bg-blue-600/20 backdrop-blur-md text-blue-400 text-xs px-2 py-1 rounded border border-blue-500/30 uppercase tracking-wider font-medium z-10">Denoised</div>
              <img src="/samples/chest_1.png" alt="Clean X-ray" className="w-[200%] max-w-none h-full object-cover object-right translate-x-[-50%]" />
            </div>
          </div>
        </div>
      </section>

      {/* 2. STATS BAR */}
      <section className="border-y border-zinc-800 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-zinc-800">
            <div className="flex flex-col px-4">
              <span className="text-3xl font-bold text-white mb-1">2</span>
              <span className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Distinct Architectures</span>
            </div>
            <div className="flex flex-col px-4 pt-4 md:pt-0">
              <span className="text-3xl font-bold text-blue-400 mb-1">+12 dB</span>
              <span className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Peak PSNR Improvement</span>
            </div>
            <div className="flex flex-col px-4 pt-4 md:pt-0">
              <span className="text-3xl font-bold text-white mb-1">&lt; 1.5s</span>
              <span className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Inference Latency</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. THE ARCHITECTURES (Two-Column Section) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">The Engineering Contrast</h2>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            This project compares two fundamentally different approaches to image restoration, evaluating the trade-off between theoretical limits and clinical data constraints.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* NAFNet Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 hover:border-zinc-700 transition-colors">
            <Layers className="w-8 h-8 text-blue-500 mb-6" />
            <h3 className="text-xl font-bold text-white mb-2">NAFNet (2022)</h3>
            <p className="text-sm text-blue-400 font-medium mb-4">Supervised • Requires Clean Targets</p>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              A deliberately simplified architecture that achieves state-of-the-art results by entirely removing nonlinear activation functions (ReLU, GELU) in favor of simple channel splitting and multiplication gates. Represents the theoretical ceiling of performance when perfect ground-truth data is available.
            </p>
            <Link to="/about" className="text-sm text-white hover:text-blue-400 font-medium inline-flex items-center transition-colors">
              Read architectural deep dive <ArrowRight className="ml-1 w-3 h-3" />
            </Link>
          </div>

          {/* Noise2Noise Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 hover:border-zinc-700 transition-colors">
            <Shield className="w-8 h-8 text-purple-500 mb-6" />
            <h3 className="text-xl font-bold text-white mb-2">Noise2Noise (2018)</h3>
            <p className="text-sm text-purple-400 font-medium mb-4">Self-Supervised • Clinical Realism</p>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              Built on the statistical principle that neural networks learn the expected value of their targets. By training a ResUNet on pairs of independently noisy images, the model converges to the clean image without ever seeing one. The realistic choice for medical imaging where clean reference scans rarely exist.
            </p>
            <Link to="/about" className="text-sm text-white hover:text-purple-400 font-medium inline-flex items-center transition-colors">
              Read architectural deep dive <ArrowRight className="ml-1 w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}