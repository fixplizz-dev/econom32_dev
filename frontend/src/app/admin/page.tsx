'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, newsApi, appealsApi } from '@/lib/api';
import { User, News, Appeal } from '@/lib/types';
import Link from 'next/link';
import NotificationCenter from '@/components/admin/NotificationCenter';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';
import SystemAlerts from '@/components/admin/SystemAlerts';

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState({
    totalNews: 0,
    totalAppeals: 0,
    newAppeals: 0
  });
  const [recentNews, setRecentNews] = useState<News[]>([]);
  const [recentAppeals, setRecentAppeals] = useState<Appeal[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      try {
        const userResponse = await authApi.getMe();
        setUser(userResponse.data.user);

        // Fetch dashboard data
        const [newsResponse, appealsResponse] = await Promise.all([
          newsApi.getAll({ limit: 5, published: false }),
          appealsApi.getAll({ limit: 5 })
        ]);

        setRecentNews(newsResponse.data.news || []);
        setRecentAppeals(appealsResponse.data.appeals || []);
        
        setStats({
          totalNews: newsResponse.data.pagination?.total || 0,
          totalAppeals: appealsResponse.data.pagination?.total || 0,
          newAppeals: (appealsResponse.data.appeals || []).filter((a: Appeal) => a.status === 'NEW').length
        });
      } catch (error) {
        console.error('Auth error:', error);
        localStorage.removeItem('auth_token');
        router.push('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Административная панель</h1>
              <p className="text-sm text-gray-600">Департамент экономического развития</p>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationCenter />
              <span className="text-sm text-gray-700">
                Добро пожаловать, {user.name}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <Link href="/admin" className="text-white bg-blue-700 px-3 py-4 text-sm font-medium">
              Главная
            </Link>
            <Link href="/admin/news" className="text-blue-100 hover:text-white px-3 py-4 text-sm font-medium">
              Новости
            </Link>
            <Link href="/admin/tags" className="text-blue-100 hover:text-white px-3 py-4 text-sm font-medium">
              Теги
            </Link>
            <Link href="/admin/categories" className="text-blue-100 hover:text-white px-3 py-4 text-sm font-medium">
              Категории
            </Link>
            <Link href="/admin/comments" className="text-blue-100 hover:text-white px-3 py-4 text-sm font-medium">
              Комментарии
            </Link>
            <Link href="/admin/appeals" className="text-blue-100 hover:text-white px-3 py-4 text-sm font-medium">
              Обращения
            </Link>
            <Link href="/admin/pages" className="text-blue-100 hover:text-white px-3 py-4 text-sm font-medium">
              Страницы
            </Link>
            <Link href="/admin/banners" className="text-blue-100 hover:text-white px-3 py-4 text-sm font-medium">
              Баннеры
            </Link>
            <Link href="/admin/structure" className="text-blue-100 hover:text-white px-3 py-4 text-sm font-medium">
              Структура
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* System Alerts */}
        <SystemAlerts className="mb-8" />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Всего новостей</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalNews}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Всего обращений</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalAppeals}</dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Новые обращения</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.newAppeals}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent News */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Последние новости</h3>
                <Link href="/admin/news" className="text-blue-600 hover:text-blue-800 text-sm">
                  Все новости →
                </Link>
              </div>
            </div>
            <div className="p-6">
              {recentNews.length === 0 ? (
                <p className="text-gray-500">Новостей пока нет</p>
              ) : (
                <div className="space-y-4">
                  {recentNews.map((news) => (
                    <div key={news.id} className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {news.titleRu}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(news.createdAt).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                        news.published 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {news.published ? 'Опубликовано' : 'Черновик'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Appeals */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Последние обращения</h3>
                <Link href="/admin/appeals" className="text-blue-600 hover:text-blue-800 text-sm">
                  Все обращения →
                </Link>
              </div>
            </div>
            <div className="p-6">
              {recentAppeals.length === 0 ? (
                <p className="text-gray-500">Обращений пока нет</p>
              ) : (
                <div className="space-y-4">
                  {recentAppeals.map((appeal) => (
                    <div key={appeal.id} className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {appeal.subject}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {appeal.firstName} {appeal.lastName} • {new Date(appeal.createdAt).toLocaleDateString('ru-RU')}
                        </p>
                      </div>
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                        appeal.status === 'NEW' ? 'bg-red-100 text-red-800' :
                        appeal.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                        appeal.status === 'ANSWERED' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {appeal.status === 'NEW' ? 'Новое' :
                         appeal.status === 'IN_PROGRESS' ? 'В работе' :
                         appeal.status === 'ANSWERED' ? 'Отвечено' : 'Закрыто'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Analytics Dashboard */}
        <AnalyticsDashboard className="mt-8" />

        {/* Quick Actions */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Быстрые действия</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link
              href="/admin/news/create"
              className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 text-center"
            >
              <div className="text-2xl mb-2">📝</div>
              <div className="font-medium">Создать новость</div>
            </Link>
            <Link
              href="/admin/tags"
              className="bg-indigo-600 text-white p-4 rounded-lg hover:bg-indigo-700 text-center"
            >
              <div className="text-2xl mb-2">🏷️</div>
              <div className="font-medium">Управление тегами</div>
            </Link>
            <Link
              href="/admin/categories"
              className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 text-center"
            >
              <div className="text-2xl mb-2">📂</div>
              <div className="font-medium">Управление категориями</div>
            </Link>
            <Link
              href="/admin/comments"
              className="bg-orange-600 text-white p-4 rounded-lg hover:bg-orange-700 text-center"
            >
              <div className="text-2xl mb-2">💬</div>
              <div className="font-medium">Модерация комментариев</div>
            </Link>
            <Link
              href="/admin/banners/create"
              className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 text-center"
            >
              <div className="text-2xl mb-2">🎯</div>
              <div className="font-medium">Создать баннер</div>
            </Link>
            <Link
              href="/admin/pages/create"
              className="bg-teal-600 text-white p-4 rounded-lg hover:bg-teal-700 text-center"
            >
              <div className="text-2xl mb-2">📄</div>
              <div className="font-medium">Создать страницу</div>
            </Link>
            <Link
              href="/api/rss/news"
              target="_blank"
              className="bg-yellow-600 text-white p-4 rounded-lg hover:bg-yellow-700 text-center"
            >
              <div className="text-2xl mb-2">📡</div>
              <div className="font-medium">RSS лента</div>
            </Link>
            <Link
              href="/"
              target="_blank"
              className="bg-gray-600 text-white p-4 rounded-lg hover:bg-gray-700 text-center"
            >
              <div className="text-2xl mb-2">🌐</div>
              <div className="font-medium">Посмотреть сайт</div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}