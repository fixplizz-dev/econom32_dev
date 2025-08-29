'use client';

import { useState, useEffect } from 'react';
import { notificationsApi } from '@/lib/api';
import { Notification } from '@/lib/types';

interface SystemAlertsProps {
  className?: string;
}

export default function SystemAlerts({ className = '' }: SystemAlertsProps) {
  const [alerts, setAlerts] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSystemAlerts();
    // Refresh alerts every 2 minutes
    const interval = setInterval(fetchSystemAlerts, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchSystemAlerts = async () => {
    try {
      const response = await notificationsApi.getAll();
      // Filter for system alerts and security alerts
      const systemAlerts = response.data.notifications.filter((n: Notification) => 
        ['SYSTEM_ALERT', 'SECURITY_ALERT', 'BACKUP_FAILED'].includes(n.type) && !n.read
      );
      setAlerts(systemAlerts);
    } catch (error) {
      console.error('Error fetching system alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setAlerts(prev => prev.filter(alert => alert.id !== id));
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };

  const getAlertStyle = (priority: string, type: string) => {
    if (type === 'SECURITY_ALERT' || priority === 'CRITICAL') {
      return 'bg-red-50 border-red-200 text-red-800';
    }
    if (priority === 'HIGH') {
      return 'bg-orange-50 border-orange-200 text-orange-800';
    }
    return 'bg-yellow-50 border-yellow-200 text-yellow-800';
  };

  const getAlertIcon = (type: string, priority: string) => {
    if (type === 'SECURITY_ALERT') return '🔒';
    if (type === 'BACKUP_FAILED') return '💾';
    if (priority === 'CRITICAL') return '🚨';
    if (priority === 'HIGH') return '⚠️';
    return 'ℹ️';
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <span className="text-green-600 text-lg mr-2">✅</span>
          <div>
            <h3 className="text-sm font-medium text-green-800">Система работает нормально</h3>
            <p className="text-sm text-green-600">Нет активных системных предупреждений</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900">Системные уведомления</h3>
      
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`border rounded-lg p-4 ${getAlertStyle(alert.priority, alert.type)}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <span className="text-lg flex-shrink-0">
                {getAlertIcon(alert.type, alert.priority)}
              </span>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium">{alert.title}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                    alert.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                    alert.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                    alert.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {alert.priority}
                  </span>
                </div>
                <p className="text-sm mt-1">{alert.message}</p>
                <p className="text-xs mt-2 opacity-75">
                  {new Date(alert.createdAt).toLocaleString('ru-RU')}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleDismiss(alert.id)}
              className="text-gray-400 hover:text-gray-600 ml-4"
              title="Закрыть уведомление"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}