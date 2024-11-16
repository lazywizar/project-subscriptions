import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQueryClient } from 'react-query';
import { Upload } from 'lucide-react';
import toast from 'react-hot-toast';

interface UploadResponse {
  success: boolean;
  error?: string;
}

export function FileUpload() {
  const queryClient = useQueryClient();

  const uploadMutation = useMutation<UploadResponse, Error, File>(
    async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }
      
      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('subscriptions');
        queryClient.invalidateQueries('transactions');
        toast.success('CSV uploaded and processed successfully!');
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Failed to upload CSV file');
        console.error('Upload error:', error);
      },
    }
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        uploadMutation.mutate(file);
      }
    },
    [uploadMutation]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors
        ${
          isDragActive
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 hover:border-indigo-400'
        }`}
    >
      <input {...getInputProps()} />
      <Upload className="mx-auto h-12 w-12 text-gray-400" />
      <p className="mt-2 text-sm text-gray-600">
        {isDragActive
          ? 'Drop the CSV file here'
          : 'Drag and drop your CSV file here, or click to select'}
      </p>
      <p className="mt-1 text-xs text-gray-500">Only CSV files are accepted</p>
      {uploadMutation.isLoading && (
        <p className="mt-2 text-sm text-indigo-600">Uploading and processing...</p>
      )}
    </div>
  );
}