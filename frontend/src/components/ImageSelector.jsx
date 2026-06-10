import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';

// These paths map to the static files inside your public/samples folder
const PRELOADED_IMAGES = [
  { id: 'sample-1', src: '/samples/chest_1.png', label: 'Patient A - AP View' },
  { id: 'sample-2', src: '/samples/chest_2.png', label: 'Patient B - AP View' },
  { id: 'sample-3', src: '/samples/chest_3.png', label: 'Patient C - Lateral' },
  { id: 'sample-4', src: '/samples/chest_4.png', label: 'Patient D - High Noise' },
];

export default function ImageSelector({ onImageSelect }) {
  const [activeId, setActiveId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelect = async (img) => {
    setActiveId(img.id);
    setIsLoading(true);
    
    try {
      // The Magic Trick: Fetch the static image and convert it to a File object
      const response = await fetch(img.src);
      const blob = await response.blob();
      
      // Package it exactly how the UploadZone and Backend expect it
      const file = new File([blob], `${img.id}.png`, { type: blob.type });
      
      // Pass both the File object (for the API) and the src URL (for UI preview)
      onImageSelect(file, img.src); 
    } catch (error) {
      console.error("Failed to load sample image:", error);
      alert("Failed to load the sample image. Check if the files exist in public/samples/");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <h3 className="text-lg font-medium text-white mb-4">
        Select a sample radiograph
      </h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {PRELOADED_IMAGES.map((img) => {
          const isActive = activeId === img.id;
          
          return (
            <button
              key={img.id}
              onClick={() => handleSelect(img)}
              disabled={isLoading}
              className={`relative flex flex-col items-center p-2 rounded-xl border-2 text-left transition-all overflow-hidden ${
                isActive 
                  ? 'border-blue-500 bg-zinc-900 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                  : 'border-zinc-800 bg-black hover:border-zinc-600 hover:bg-zinc-900'
              }`}
            >
              {/* Image Thumbnail */}
              <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-zinc-800 mb-2">
                <img 
                  src={img.src} 
                  alt={img.label}
                  className={`w-full h-full object-cover transition-opacity ${isLoading && isActive ? 'opacity-50' : 'opacity-100'}`}
                />
                
                {/* Active Checkmark Overlay */}
                {isActive && (
                  <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-0.5 shadow-lg">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
              </div>
              
              {/* Label */}
              <span className={`text-xs font-medium truncate w-full text-center ${
                isActive ? 'text-blue-400' : 'text-zinc-400'
              }`}>
                {img.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}