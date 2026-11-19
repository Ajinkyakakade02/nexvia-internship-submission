import React, { useRef, useState } from 'react';
import { UploadCloud, X, Loader2 } from 'lucide-react';
import { uploadService } from '@/services/uploadService';
import toast from 'react-hot-toast';

export interface FileUploadProps {
  onUploadSuccess: (url: string) => void;
  onRemove?: (url: string) => void;
  existingUrls?: string[];
  maxFiles?: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUploadSuccess,
  onRemove,
  existingUrls = [],
  maxFiles = 5,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (existingUrls.length >= maxFiles) {
      toast.error(`Maximum ${maxFiles} images allowed`);
      return;
    }

    const file = files[0];
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadService.uploadFile(file);
      if (url) {
        onUploadSuccess(url);
        toast.success('Image uploaded successfully');
      } else {
        // Fallback for simulation / mock image url
        const mockUrl = URL.createObjectURL(file);
        onUploadSuccess(mockUrl);
        toast.success('Image preview attached');
      }
    } catch {
      toast.error('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Box */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-slate-300 hover:border-primary-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-slate-50/50 transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={isUploading || existingUrls.length >= maxFiles}
        />
        {isUploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-2" />
            <p className="text-sm text-slate-600">Uploading image...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center">
            <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
            <p className="text-sm font-medium text-slate-700">
              Click to upload product image
            </p>
            <p className="text-xs text-slate-400 mt-1">PNG, JPG or WEBP up to 5MB</p>
          </div>
        )}
      </div>

      {/* Preview list */}
      {existingUrls.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
          {existingUrls.map((url, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg border border-slate-200 overflow-hidden group bg-slate-100"
            >
              <img src={url} alt={`Upload ${index}`} className="w-full h-full object-cover" />
              {onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(url)}
                  className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
