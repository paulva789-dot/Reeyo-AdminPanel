// src/components/ImageUploadField.jsx
import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { apiClient, ApiError } from '../services/apiClient';

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Shared upload control for any image_url field (banners, popups, loyalty
// rewards, ...). Uploads through POST /uploads and reports the resulting
// URL back via onChange — callers just treat it like a text field.
const ImageUploadField = ({ value, onChange, label = 'Image' }) => {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file) => {
    if (!file) return;
    setError('');

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Only JPEG, PNG, or WebP images are allowed.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('Image must be under 5MB.');
      return;
    }

    setUploading(true);
    try {
      const res = await apiClient.upload(file);
      onChange(res.data.url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {label && <label className="block text-sm font-medium mb-2">{label}</label>}

      {value ? (
        <div className="relative mb-2">
          <img src={value} alt="" className="w-full h-32 object-cover rounded-lg border" />
        </div>
      ) : (
        <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-2 border border-dashed">
          <ImageIcon size={28} className="text-gray-400" />
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          {uploading ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
          {uploading ? 'Uploading...' : value ? 'Replace' : 'Upload Image'}
        </button>
        {value && (
          <button type="button" onClick={() => onChange('')} className="px-3 py-1.5 text-sm border rounded-lg text-red-600 hover:bg-red-50">
            Remove
          </button>
        )}
      </div>

      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
};

export default ImageUploadField;
