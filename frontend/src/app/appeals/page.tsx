'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { appealsApi } from '@/lib/api';
import { AppealFormData } from '@/lib/types';
import Link from 'next/link';
import SimpleCaptcha from '@/components/ui/SimpleCaptcha';
import FileUpload from '@/components/ui/FileUpload';

export default function AppealsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
    ticketNumber?: string;
  } | null>(null);
  const [isCaptchaValid, setIsCaptchaValid] = useState(false);
  const [attachmentIds, setAttachmentIds] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<AppealFormData>();

  const onSubmit = async (data: AppealFormData) => {
    if (!isCaptchaValid) {
      setSubmitResult({
        success: false,
        message: 'Пожалуйста, решите задачу для защиты от спама'
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const response = await appealsApi.submit({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        subject: data.subject,
        message: data.message,
        attachments: attachmentIds
      });

      setSubmitResult({
        success: true,
        message: response.data.message,
        ticketNumber: response.data.ticketNumber
      });
      reset();
      setAttachmentIds([]);
      setIsCaptchaValid(false);
    } catch (error: unknown) {
      setSubmitResult({
        success: false,
        message: (error as { response?: { data?: { error?: string } } }).response?.data?.error || 'Произошла ошибка при отправке обращения'
      });
    } finally {
      setIsSubmitting(false);
    }
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
                <span className="text-gray-900 font-medium">Интернет-приемная</span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Интернет-приемная</h1>
          <p className="text-lg text-gray-600">
            Здесь вы можете задать вопрос, оставить предложение или жалобу. 
            Мы обязательно рассмотрим ваше обращение и дадим ответ в установленные сроки.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Appeal Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Форма обращения</h2>

              {submitResult && (
                <div className={`mb-6 p-4 rounded-md ${
                  submitResult.success 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className={`text-sm ${
                    submitResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {submitResult.message}
                    {submitResult.ticketNumber && (
                      <div className="mt-2 font-semibold">
                        Номер обращения: {submitResult.ticketNumber}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Фамилия *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      {...register('lastName', { 
                        required: 'Фамилия обязательна',
                        minLength: { value: 2, message: 'Минимум 2 символа' }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                      Имя *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      {...register('firstName', { 
                        required: 'Имя обязательно',
                        minLength: { value: 2, message: 'Минимум 2 символа' }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    {...register('email', { 
                      required: 'Email обязателен',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Неверный формат email'
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Телефон
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    {...register('phone', {
                      pattern: {
                        value: /^[\+]?[0-9\s\-\(\)]+$/,
                        message: 'Неверный формат телефона'
                      }
                    })}
                    placeholder="+7 (XXX) XXX-XX-XX"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Тема обращения *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    {...register('subject', { 
                      required: 'Тема обращения обязательна',
                      minLength: { value: 5, message: 'Минимум 5 символов' }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.subject && (
                    <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Текст обращения *
                  </label>
                  <textarea
                    id="message"
                    rows={6}
                    {...register('message', { 
                      required: 'Текст обращения обязателен',
                      minLength: { value: 10, message: 'Минимум 10 символов' }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Прикрепить файлы (необязательно)
                  </label>
                  <FileUpload
                    onFilesChange={setAttachmentIds}
                    maxFiles={5}
                    maxSizePerFile={10}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Защита от спама *
                  </label>
                  <SimpleCaptcha onVerify={setIsCaptchaValid} />
                </div>

                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="consent"
                      required
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="consent" className="ml-2 text-sm text-gray-700">
                      Я согласен(а) на обработку персональных данных в соответствии с{' '}
                      <Link href="/privacy-policy" className="text-blue-600 hover:text-blue-800">
                        Политикой конфиденциальности
                      </Link>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !isCaptchaValid}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Отправка...' : 'Отправить обращение'}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Appeal Status Check */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Проверить статус обращения</h3>
              <p className="text-sm text-gray-600 mb-4">
                Введите номер обращения для проверки статуса рассмотрения
              </p>
              <Link
                href="/appeals/status"
                className="inline-block w-full text-center bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
              >
                Проверить статус
              </Link>
            </div>

            {/* Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Информация</h3>
              <div className="space-y-4 text-sm text-gray-600">
                <div>
                  <h4 className="font-semibold text-gray-900">Сроки рассмотрения:</h4>
                  <p>Обращения рассматриваются в течение 30 дней с момента поступления</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Уведомления:</h4>
                  <p>Ответ будет направлен на указанный email адрес</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Требования:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Указывайте достоверные данные</li>
                    <li>Формулируйте вопрос четко и понятно</li>
                    <li>Прикрепляйте документы при необходимости</li>
                  </ul>
                </div>
              </div>
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