'use client';

import { useState, useRef } from 'react';
import { filesApi } from '@/lib/api';

interface FileUploadProps {
  onFilesChange: (files: string[]) => void;
  maxFiles?: number;
  maxSizePerFile?: number; // in MB
  allowedTypes?: string[];
  className?: string;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: 'uploading' | 'scanning' | 'safe' | 'infected' | 'error';
  error?: string;
}

export default function FileUpload({
  onFilesChange,
  maxFiles = 5,
  maxSizePerFile = 10,
  allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif'
  ],
  className = ''
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > maxSizePerFile * 1024 * 1024) {
      return `Файл слишком большой. Максимальный размер: ${maxSizePerFile} МБ`;
    }
    
    if (!allowedTypes.includes(file.type)) {
      return 'Неподдерживаемый тип файла';
    }
    
    return null;
  };

  const uploadFile = async (file: File) => {
    const fileId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    const newFile: UploadedFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      status: 'uploading'
    };

    setUploadedFiles(prev => [...prev, newFile]);

    try {
      // Upload file
      const uploadResponse = await filesApi.upload(file);
      const uploadedFileId = uploadResponse.data.id;

      // Update status to scanning
      setUploadedFiles(prev => 
        prev.map(f => f.id === fileId ? { ...f, status: 'scanning' } : f)
      );

      // Poll for scan results
      let scanComplete = false;
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds max

      while (!scanComplete && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        
        try {
          const infoResponse = await filesApi.getInfo(uploadedFileId);
          const fileInfo = infoResponse.data;
          
          if (fileInfo.scanned) {
            scanComplete = true;
            
            if (fileInfo.safe) {
              setUploadedFiles(prev => 
                prev.map(f => f.id === fileId ? { ...f, status: 'safe', id: uploadedFileId } : f)
              );
              
              // Update parent component
              const safeFiles = uploadedFiles
                .filter(f => f.status === 'safe')
                .map(f => f.id);
              safeFiles.push(uploadedFileId);
              onFilesChange(safeFiles);
            } else {
              setUploadedFiles(prev => 
                prev.map(f => f.id === fileId ? { 
                  ...f, 
                  status: 'infected', 
                  error: 'Файл содержит вирус и был удален' 
                } : f)
              );
            }
          }
        } catch (error) {
          console.error('Error checking file status:', error);
        }
        
        attempts++;
      }

      if (!scanComplete) {
        setUploadedFiles(prev => 
          prev.map(f => f.id === fileId ? { 
            ...f, 
            status: 'error', 
            error: 'Превышено время ожидания проверки файла' 
          } : f)
        );
      }

    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: string } } }).response?.data?.error;
      setUploadedFiles(prev => 
        prev.map(f => f.id === fileId ? { 
          ...f, 
          status: 'error', 
          error: errorMessage || 'Ошибка загрузки файла' 
        } : f)
      );
    }
  };

  const handleFileSelect = (files: FileList) => {
    const fileArray = Array.from(files);
    
    // Check total files limit
    if (uploadedFiles.length + fileArray.length > maxFiles) {
      alert(`Максимальное количество файлов: ${maxFiles}`);
      return;
    }

    // Validate and upload each file
    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        alert(`${file.name}: ${error}`);
        return;
      }
      
      uploadFile(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    
    // Update parent component
    const safeFiles = uploadedFiles
      .filter(f => f.status === 'safe' && f.id !== fileId)
      .map(f => f.id);
    onFilesChange(safeFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
        return (
          <svg className="animate-spin h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
      case 'scanning':
        return (
          <svg className="animate-pulse h-4 w-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'safe':
        return (
          <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'infected':
        return (
          <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'error':
        return (
          <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'uploading':
        return 'Загрузка...';
      case 'scanning':
        return 'Проверка на вирусы...';
      case 'safe':
        return 'Файл безопасен';
      case 'infected':
        return 'Обнаружен вирус';
      case 'error':
        return 'Ошибка';
      default:
        return '';
    }
  };

  return (
    <div className={className}>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragOver
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div className="mt-4">
          <p className="text-sm text-gray-600">
            Перетащите файлы сюда или{' '}
            <button
              type="button"
              className="text-blue-600 hover:text-blue-800 underline"
              onClick={() => fileInputRef.current?.click()}
            >
              выберите файлы
            </button>
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Максимум {maxFiles} файлов, до {maxSizePerFile} МБ каждый
          </p>
          <p className="text-xs text-gray-500">
            Поддерживаемые форматы: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        accept={allowedTypes.join(',')}
        onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
      />

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Загруженные файлы:</h4>
          {uploadedFiles.map((file) => (
            <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(file.status)}
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)} • {getStatusText(file.status)}
                  </p>
                  {file.error && (
                    <p className="text-xs text-red-600">{file.error}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(file.id)}
                className="text-gray-400 hover:text-red-500"
                title="Удалить файл"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Security Notice */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-800">
              Все загружаемые файлы автоматически проверяются антивирусом для обеспечения безопасности.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}