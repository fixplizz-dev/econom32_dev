'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { appealsApi } from '@/lib/api';
import { Appeal } from '@/lib/types';
import Link from 'next/link';

interface StatusFormData {
  ticketNumber: string;
}

export default function AppealStatusPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [appeal, setAppeal] = useState<Appeal | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StatusFormData>();

  const onSubmit = async (data: StatusFormData) => {
    setIsLoading(true);
    setError(null);
    setAppeal(null);

    try {
      const response = await appealsApi.getByTicket(data.ticketNumber.trim());
      setAppeal(response.data);
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(errorMessage || 'Обращение с указанным номером не найдено');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'Новое';
      case 'IN_PROGRESS':
        return 'В работе';
      case 'ANSWERED':
        return 'Отвечено';
      case 'CLOSED':
        return 'Закрыто';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800';
      case 'ANSWERED':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">
                  Департамент экономического развития
                </h1>
                <p className="text-sm text-gray-600">Брянской области</p>
              </Link>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="/about" className="text-gray-700 hover:text-blue-600">
                О департаменте
              </Link>
              <Link href="/news" className="text-gray-700 hover:text-blue-600">
                Новости
              </Link>
              <Link href="/structure" className="text-gray-700 hover:text-blue-600">
                Структура
              </Link>
              <Link href="/appeals" className="text-blue-600 font-semibold">
                Интернет-приемная
              </Link>
              <Link href="/contacts" className="text-gray-700 hover:text-blue-600">
                Контакты
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <Link href="/" className="text-gray-500 hover:text-gray-700">
                  Главная
                </Link>
              </li>
              <li>
                <span className="text-gray-400">/</span>
              </li>
              <li>
                <Link href="/appeals" className="text-gray-500 hover:text-gray-700">
                  Интернет-приемная
                </Link>
              </li>
              <li>
                <span className="text-gray-400">/</span>
              </li>
              <li>
                <span className="text-gray-900 font-medium">Проверить статус</span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Проверить статус обращения</h1>
          <p className="text-lg text-gray-600">
            Введите номер обращения для проверки текущего статуса рассмотрения
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="ticketNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Номер обращения *
              </label>
              <div className="flex space-x-4">
                <input
                  type="text"
                  id="ticketNumber"
                  {...register('ticketNumber', { 
                    required: 'Номер обращения обязателен',
                    pattern: {
                      value: /^\d{8}-\d{4}$/,
                      message: 'Неверный формат номера (должен быть YYYYMMDD-XXXX)'
                    }
                  })}
                  placeholder="20250124-1234"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Поиск...' : 'Проверить'}
                </button>
              </div>
              {errors.ticketNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.ticketNumber.message}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                Номер обращения указан в письме-подтверждении, отправленном на ваш email
              </p>
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Appeal Details */}
        {appeal && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="border-b border-gray-200 pb-4 mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Обращение #{appeal.ticketNumber}
                </h2>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appeal.status)}`}>
                  {getStatusText(appeal.status)}
                </span>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Тема обращения</h3>
                <p className="text-gray-700">{appeal.subject}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Дата подачи</h4>
                  <p className="text-gray-700">{formatDate(appeal.createdAt)}</p>
                </div>

                {appeal.respondedAt && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Дата ответа</h4>
                    <p className="text-gray-700">{formatDate(appeal.respondedAt)}</p>
                  </div>
                )}
              </div>

              {appeal.responder && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-1">Ответственный</h4>
                  <p className="text-gray-700">{appeal.responder.name}</p>
                </div>
              )}

              {appeal.response && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Ответ</h3>
                  <div className="bg-gray-50 rounded-md p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{appeal.response}</p>
                  </div>
                </div>
              )}

              {appeal.status === 'NEW' && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-800">
                        Ваше обращение получено и будет рассмотрено в течение 30 дней. 
                        Ответ будет направлен на указанный email адрес.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {appeal.status === 'IN_PROGRESS' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-800">
                        Ваше обращение находится в работе. Ответ будет предоставлен в ближайшее время.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <Link
                href="/appeals"
                className="inline-flex items-center text-blue-600 hover:text-blue-800"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Подать новое обращение
              </Link>
            </div>
          </div>
        )}

        {/* Help Information */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Справочная информация</h3>
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <h4 className="font-semibold text-gray-900">Статусы обращений:</h4>
              <ul className="mt-2 space-y-1">
                <li><span className="font-medium">Новое</span> - обращение получено и ожидает рассмотрения</li>
                <li><span className="font-medium">В работе</span> - обращение рассматривается специалистом</li>
                <li><span className="font-medium">Отвечено</span> - на обращение дан ответ</li>
                <li><span className="font-medium">Закрыто</span> - обращение закрыто</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Сроки рассмотрения:</h4>
              <p>Обращения граждан рассматриваются в течение 30 дней с момента поступления в соответствии с Федеральным законом №59-ФЗ.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Контакты для справок:</h4>
              <p>Телефон: +7 (4832) 123-456<br />Email: info@econom32.ru</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="text-lg font-semibold mb-4">Департамент экономического развития</h4>
              <p className="text-gray-300">
                Брянской области - орган исполнительной власти, осуществляющий функции 
                по выработке и реализации региональной политики в сфере экономического развития.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Полезные ссылки</h4>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-gray-300 hover:text-white">О департаменте</Link></li>
                <li><Link href="/structure" className="text-gray-300 hover:text-white">Структура</Link></li>
                <li><Link href="/documents" className="text-gray-300 hover:text-white">Документы</Link></li>
                <li><Link href="/sitemap" className="text-gray-300 hover:text-white">Карта сайта</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Контакты</h4>
              <div className="space-y-2 text-gray-300">
                <p>241050, г. Брянск, ул. Советская, д. 1</p>
                <p>Телефон: +7 (4832) 123-456</p>
                <p>Email: info@econom32.ru</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
            <p>&copy; 2025 Департамент экономического развития Брянской области. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}