'use client';

import { useState } from 'react';
import { Button } from '../ui/Button';

interface ImageInfo {
  file: {
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
  };
  imageInfo: {
    width: number;
    height: number;
    format: string;
    size: number;
    hasAlpha: boolean;
  };
}

interface OptimizedResult {
  webp: string | null;
  avif: string | null;
  thumbnail: string | null;
  metadata: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
}

interface ImageOptimizerProps {
  fileId: string;
  onOptimized?: (result: OptimizedResult) => void;
}

export function ImageOptimizer({ fileId, onOptimized }: ImageOptimizerProps) {
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [optimizedResult, setOptimizedResult] = useState<OptimizedResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  const loadImageInfo = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/files/${fileId}/image-info`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setImageInfo(data);
      } else {
        const error = await response.json();
        alert(`Ошибка получения информации об изображении: ${error.error}`);
      }
    } catch (error) {
      console.error('Error loading image info:', error);
      alert('Ошибка загрузки информации об изображении');
    } finally {
      setLoading(false);
    }
  };

  const optimizeImage = async () => {
    try {
      setOptimizing(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/files/${fileId}/optimize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOptimizedResult(data.optimized);
        onOptimized?.(data.optimized);
        alert('Изображение успешно оптимизировано!');
      } else {
        const error = await response.json();
        alert(`Ошибка оптимизации: ${error.error}`);
      }
    } catch (error) {
      console.error('Error optimizing image:', error);
      alert('Ошибка оптимизации изображения');
    } finally {
      setOptimizing(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // const calculateSavings = (originalSize: number, optimizedSize: number): string => {
  //   const savings = ((originalSize - optimizedSize) / originalSize) * 100;
  //   return savings > 0 ? `${savings.toFixed(1)}%` : '0%';
  // };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Оптимизация изображения</h3>
        <div className="space-x-2">
          <Button
            onClick={loadImageInfo}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            {loading ? 'Загрузка...' : 'Получить информацию'}
          </Button>
          <Button
            onClick={optimizeImage}
            disabled={optimizing || !imageInfo}
            className="bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            {optimizing ? 'Оптимизация...' : 'Оптимизировать'}
          </Button>
        </div>
      </div>

      {imageInfo && (
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-900 mb-3">Информация об изображении</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm font-medium text-gray-600">Размеры</div>
              <div className="text-lg font-bold text-gray-900">
                {imageInfo.imageInfo.width} × {imageInfo.imageInfo.height}
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm font-medium text-gray-600">Формат</div>
              <div className="text-lg font-bold text-gray-900 uppercase">
                {imageInfo.imageInfo.format}
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm font-medium text-gray-600">Размер файла</div>
              <div className="text-lg font-bold text-gray-900">
                {formatBytes(imageInfo.imageInfo.size)}
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm font-medium text-gray-600">Прозрачность</div>
              <div className="text-lg font-bold text-gray-900">
                {imageInfo.imageInfo.hasAlpha ? 'Да' : 'Нет'}
              </div>
            </div>
          </div>
        </div>
      )}

      {optimizedResult && (
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-3">Результаты оптимизации</h4>
          <div className="space-y-4">
            {optimizedResult.webp && (
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <div className="font-medium text-green-900">WebP версия</div>
                  <div className="text-sm text-green-700">
                    Современный формат с отличным сжатием
                  </div>
                </div>
                <div className="text-right">
                  <a
                    href={optimizedResult.webp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Просмотреть
                  </a>
                </div>
              </div>
            )}

            {optimizedResult.avif && (
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div>
                  <div className="font-medium text-blue-900">AVIF версия</div>
                  <div className="text-sm text-blue-700">
                    Новейший формат с максимальным сжатием
                  </div>
                </div>
                <div className="text-right">
                  <a
                    href={optimizedResult.avif}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Просмотреть
                  </a>
                </div>
              </div>
            )}

            {optimizedResult.thumbnail && (
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div>
                  <div className="font-medium text-purple-900">Миниатюра</div>
                  <div className="text-sm text-purple-700">
                    Уменьшенная версия для предварительного просмотра
                  </div>
                </div>
                <div className="text-right">
                  <a
                    href={optimizedResult.thumbnail}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Просмотреть
                  </a>
                </div>
              </div>
            )}

            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h5 className="font-medium text-gray-900 mb-2">Рекомендации по использованию</h5>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Используйте AVIF для современных браузеров (лучшее сжатие)</li>
                <li>• WebP как fallback для старых браузеров</li>
                <li>• Миниатюры для списков и предварительного просмотра</li>
                <li>• Оригинал как последний fallback</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {!imageInfo && !loading && (
        <div className="text-center py-8 text-gray-500">
          Нажмите &quot;Получить информацию&quot; для анализа изображения
        </div>
      )}
    </div>
  );
}