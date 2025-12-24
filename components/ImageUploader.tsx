
import React, { useRef } from 'react';

interface ImageUploaderProps {
  label: string;
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  description?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  label, 
  images, 
  onChange, 
  maxImages = 5,
  description 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fix: Use async/await and Promise.all to process files reliably and avoid TypeScript inference issues.
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;

    const files = Array.from(fileList);
    const remainingSlots = maxImages - images.length;
    const filesToProcess = files.slice(0, remainingSlots);

    try {
      const newBase64s = await Promise.all(
        filesToProcess.map((file: File) => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error("Failed to read file"));
            // file is a File object, which is a Blob. Casting to File ensures proper parameter type.
            reader.readAsDataURL(file);
          });
        })
      );

      if (newBase64s.length > 0) {
        // Update the state once with all new images to avoid stale closures.
        onChange([...images, ...newBase64s]);
      }
    } catch (error) {
      console.error("Error uploading files:", error);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onChange(newImages);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{label}</label>
        <span className="text-xs text-gray-500">{images.length}/{maxImages}</span>
      </div>
      {description && <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">{description}</p>}
      
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {images.map((img, idx) => (
          <div key={idx} className="relative aspect-square group rounded-xl overflow-hidden border-2 border-primary-100 dark:border-primary-900/30">
            <img src={img} className="w-full h-full object-cover" alt={`Upload ${idx}`} />
            <button 
              onClick={() => removeImage(idx)}
              className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
        
        {images.length < maxImages && (
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all text-gray-400 hover:text-primary-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-[10px] font-medium">UPLOAD</span>
          </button>
        )}
      </div>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        multiple 
        accept="image/*" 
        className="hidden" 
      />
    </div>
  );
};

export default ImageUploader;
