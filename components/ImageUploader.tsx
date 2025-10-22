
import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons';

interface ImageUploaderProps {
  onImageUpload: (file: File) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };
  
  const handleDragEvents = useCallback((e: React.DragEvent<HTMLLabelElement>, dragging: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(dragging);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    handleDragEvents(e, false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
       onImageUpload(e.dataTransfer.files[0]);
    }
  }, [handleDragEvents, onImageUpload]);

  return (
    <label
      onDragEnter={(e) => handleDragEvents(e, true)}
      onDragLeave={(e) => handleDragEvents(e, false)}
      onDragOver={(e) => handleDragEvents(e, true)}
      onDrop={handleDrop}
      className={`w-full cursor-pointer rounded-xl border-4 ${isDragging ? 'border-purple-500 bg-gray-700' : 'border-dashed border-gray-600 bg-gray-800'} p-12 text-center transition-all duration-300 ease-in-out hover:border-purple-400 hover:bg-gray-700`}
    >
      <div className="flex flex-col items-center justify-center space-y-4 text-gray-400">
        <UploadIcon />
        <p className="text-lg font-semibold">
          <span className="text-purple-400">Click to upload</span> or drag and drop
        </p>
        <p className="text-sm">PNG, JPG, or WEBP</p>
      </div>
      <input
        type="file"
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </label>
  );
};

export default ImageUploader;
