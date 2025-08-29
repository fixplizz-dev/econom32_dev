'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/Button';

interface Backup {
  name: string;
  path: string;
  timestamp: string;
  filesCount: number;
  totalSize: number;
  duration: number;
}

interface BackupStats {
  totalBackups: number;
  totalSize: number;
  oldestBackup?: string;
  newestBackup?: string;
}

export function BackupManager() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/files/backups', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBackups(data.backups);
        setStats(data.stats);
      } else {
        console.error('Failed to load backups');
      }
    } catch (error) {
      console.error('Error loading backups:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    try {
      setCreating(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/files/backup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Резервная копия создана успешно!\nФайлов: ${data.backup.filesCount}\nРазмер: ${formatBytes(data.backup.totalSize)}\nВремя: ${data.backup.duration}мс`);
        loadBackups(); // Refresh the list
      } else {
        const error = await response.json();
        alert(`Ошибка создания резервной копии: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      alert('Ошибка создания резервной копии');
    } finally {
      setCreating(false);
    }
  };

  const restoreBackup = async (backupName: string) => {
    if (!confirm(`Вы уверены, что хотите восстановить резервную копию "${backupName}"? Это может перезаписать существующие файлы.`)) {
      return;
    }

    try {
      setRestoring(backupName);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/files/restore/${backupName}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Восстановление завершено успешно!\nВосстановлено файлов: ${data.restoredFiles}`);
      } else {
        const error = await response.json();
        alert(`Ошибка восстановления: ${error.error}`);
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
      alert('Ошибка восстановления резервной копии');
    } finally {
      setRestoring(null);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('ru-RU');
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}мс`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}с`;
    return `${(ms / 60000).toFixed(1)}мин`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Управление резервными копиями</h2>
          <Button
            onClick={createBackup}
            disabled={creating}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {creating ? 'Создание...' : 'Создать резервную копию'}
          </Button>
        </div>

        {stats && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-blue-600">Всего копий</div>
              <div className="text-2xl font-bold text-blue-900">{stats.totalBackups}</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-green-600">Общий размер</div>
              <div className="text-2xl font-bold text-green-900">{formatBytes(stats.totalSize)}</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-purple-600">Последняя копия</div>
              <div className="text-sm font-bold text-purple-900">
                {stats.newestBackup ? formatDate(stats.newestBackup) : 'Нет'}
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-sm font-medium text-orange-600">Самая старая</div>
              <div className="text-sm font-bold text-orange-900">
                {stats.oldestBackup ? formatDate(stats.oldestBackup) : 'Нет'}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6">
        {backups.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-4">Резервные копии не найдены</div>
            <Button
              onClick={createBackup}
              disabled={creating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Создать первую резервную копию
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Дата создания
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Файлов
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Размер
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Время создания
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {backups.map((backup) => (
                  <tr key={backup.name} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(backup.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {backup.filesCount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatBytes(backup.totalSize)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDuration(backup.duration)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button
                        onClick={() => restoreBackup(backup.name)}
                        disabled={restoring === backup.name}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-xs"
                      >
                        {restoring === backup.name ? 'Восстановление...' : 'Восстановить'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}