'use client';

import { useState, useEffect } from 'react';
import { analyticsApi } from '@/lib/api';
import { DashboardAnalytics } from '@/lib/types';

interface AnalyticsDashboardProps {
  className?: string;
}

export default function AnalyticsDashboard({ className = '' }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
    // Refresh analytics every 5 minutes
    const interval = setInterval(fetchAnalytics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchAnalytics = async () => {
    try {
      setError(null);
      const response = await analyticsApi.getDashboard();
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Ошибка загрузки аналитики');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button
            onClick={fetchAnalytics}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ru-RU').format(num);
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return '↗️';
    if (growth < 0) return '↘️';
    return '➡️';
  };

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Аналитика посещений</h3>
          <div className="text-sm text-gray-500">
            Обновлено: {new Date().toLocaleTimeString('ru-RU')}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Main Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Сегодня</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatNumber(analytics.today.totalVisits)}
                </p>
              </div>
              <div className="text-2xl">📊</div>
            </div>
            <div className={`text-sm mt-1 ${getGrowthColor(analytics.growth.daily)}`}>
              {getGrowthIcon(analytics.growth.daily)} {Math.abs(analytics.growth.daily).toFixed(1)}%
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">За неделю</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatNumber(analytics.week.totalVisits)}
                </p>
              </div>
              <div className="text-2xl">📈</div>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Уникальных: {formatNumber(analytics.week.uniqueVisitors)}
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">За месяц</p>
                <p className="text-2xl font-bold text-purple-900">
                  {formatNumber(analytics.month.totalVisits)}
                </p>
              </div>
              <div className="text-2xl">📅</div>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Уникальных: {formatNumber(analytics.month.uniqueVisitors)}
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Сейчас онлайн</p>
                <p className="text-2xl font-bold text-orange-900">
                  {formatNumber(analytics.realTime.visitsLastHour)}
                </p>
              </div>
              <div className="text-2xl">🔴</div>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              За последний час
            </div>
          </div>
        </div>

        {/* Top Pages */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-3">Популярные страницы (месяц)</h4>
            <div className="space-y-2">
              {analytics.month.topPages.slice(0, 5).map((page, index) => (
                <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <span className="text-sm text-gray-900 truncate">
                      {page.page === '/' ? 'Главная страница' : page.page}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-blue-600">
                    {formatNumber(page.views)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-3">Активные страницы (сейчас)</h4>
            <div className="space-y-2">
              {analytics.realTime.activePages.length === 0 ? (
                <div className="text-sm text-gray-500 py-4 text-center">
                  Нет активности в данный момент
                </div>
              ) : (
                analytics.realTime.activePages.map((page, index) => (
                  <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span className="text-sm text-gray-900 truncate">
                        {page.page === '/' ? 'Главная страница' : page.page}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-green-600">
                      {formatNumber(page.visits)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Device Types */}
        <div className="mt-6">
          <h4 className="text-md font-semibold text-gray-900 mb-3">Типы устройств (месяц)</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {analytics.month.deviceTypes.map((device, index) => (
              <div key={index} className="text-center p-3 bg-gray-50 rounded">
                <div className="text-2xl mb-1">
                  {device.type === 'desktop' ? '🖥️' : 
                   device.type === 'mobile' ? '📱' : 
                   device.type === 'tablet' ? '📱' : '🤖'}
                </div>
                <div className="text-sm font-medium text-gray-900 capitalize">
                  {device.type === 'desktop' ? 'Компьютер' :
                   device.type === 'mobile' ? 'Мобильный' :
                   device.type === 'tablet' ? 'Планшет' : 'Боты'}
                </div>
                <div className="text-lg font-bold text-blue-600">
                  {formatNumber(device.count)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly Activity */}
        <div className="mt-6">
          <h4 className="text-md font-semibold text-gray-900 mb-3">Активность по часам (сегодня)</h4>
          <div className="flex items-end space-x-1 h-20">
            {analytics.today.visitsByHour.map((hour, index) => {
              const maxVisits = Math.max(...analytics.today.visitsByHour.map(h => h.visits));
              const height = maxVisits > 0 ? (hour.visits / maxVisits) * 100 : 0;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-blue-500 rounded-t"
                    style={{ height: `${height}%`, minHeight: height > 0 ? '2px' : '0' }}
                    title={`${hour.hour}:00 - ${hour.visits} посещений`}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {hour.hour}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}