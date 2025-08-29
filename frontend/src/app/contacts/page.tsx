'use client';

import { useEffect, useState } from 'react';
import { departmentsApi } from '@/lib/api';
import { Department } from '@/lib/types';
import { MainNavigation } from '@/components/navigation/MainNavigation';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { AccessibilityPanel } from '@/components/accessibility/AccessibilityPanel';
import Link from 'next/link';

export default function ContactsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await departmentsApi.getAll();
        setDepartments(response.data || []);
      } catch (error) {
        console.error('Error fetching departments:', error);
        // Fallback to mock data
        const { mockDepartments } = await import('@/lib/mockData');
        setDepartments(mockDepartments);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AccessibilityPanel />
        <MainNavigation />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const mainDepartment = departments.find(d => !d.parentId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip Link */}
      <a
        href="#main-content"
        className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50"
      >
        Перейти к основному содержанию
      </a>

      <AccessibilityPanel />
      <MainNavigation />

      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumbs items={[{ label: 'Контакты' }]} />
        </div>
      </div>

      {/* Main Content */}
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Контактная информация</h1>
          <p className="text-lg text-gray-600">
            Контакты Департамента экономического развития Брянской области
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Main Contacts */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              Департамент экономического развития Брянской области
            </h2>

            {mainDepartment?.contacts.length ? (
              <div className="space-y-4">
                {mainDepartment.contacts.map((contact) => (
                  <div key={contact.id} className="flex items-start">
                    <div className="flex-shrink-0 mr-4">
                      {contact.type === 'ADDRESS' && (
                        <svg className="w-6 h-6 text-blue-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                      {contact.type === 'PHONE' && (
                        <svg className="w-6 h-6 text-blue-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      )}
                      {contact.type === 'EMAIL' && (
                        <svg className="w-6 h-6 text-blue-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      )}
                      {contact.type === 'FAX' && (
                        <svg className="w-6 h-6 text-blue-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2M7 4h10M7 4l-2 14h14l-2-14M11 9h2M9 13h6M10 17h4" />
                        </svg>
                      )}
                    </div>
                    <div>
                      {contact.label && (
                        <p className="font-semibold text-gray-900">{contact.label}</p>
                      )}
                      <p className="text-gray-700">
                        {contact.type === 'EMAIL' ? (
                          <a href={`mailto:${contact.value}`} className="text-blue-600 hover:text-blue-800">
                            {contact.value}
                          </a>
                        ) : contact.type === 'PHONE' ? (
                          <a href={`tel:${contact.value}`} className="text-blue-600 hover:text-blue-800">
                            {contact.value}
                          </a>
                        ) : (
                          contact.value
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start">
                  <svg className="w-6 h-6 text-blue-600 mt-1 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900">Адрес</p>
                    <p className="text-gray-700">241050, г. Брянск, ул. Советская, д. 1</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <svg className="w-6 h-6 text-blue-600 mt-1 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900">Телефон приемной</p>
                    <p className="text-gray-700">
                      <a href="tel:+74832123456" className="text-blue-600 hover:text-blue-800">
                        +7 (4832) 123-456
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <svg className="w-6 h-6 text-blue-600 mt-1 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-900">Электронная почта</p>
                    <p className="text-gray-700">
                      <a href="mailto:info@econom32.ru" className="text-blue-600 hover:text-blue-800">
                        info@econom32.ru
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Working Hours */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Режим работы</h3>
              <div className="space-y-2 text-gray-700">
                <p><span className="font-medium">Понедельник - Четверг:</span> 9:00 - 18:00</p>
                <p><span className="font-medium">Пятница:</span> 9:00 - 17:00</p>
                <p><span className="font-medium">Обеденный перерыв:</span> 13:00 - 14:00</p>
                <p><span className="font-medium">Выходные:</span> Суббота, Воскресенье</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            {/* Internet Reception */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-blue-900 mb-4">Интернет-приемная</h3>
              <p className="text-blue-800 mb-4">
                Подайте обращение онлайн и получите ответ в установленные сроки
              </p>
              <Link
                href="/appeals"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Подать обращение
              </Link>
            </div>

            {/* Map Placeholder */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Как нас найти</h3>
              <div className="bg-gray-200 h-64 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p>Интерактивная карта</p>
                  <p className="text-sm">г. Брянск, ул. Советская, д. 1</p>
                </div>
              </div>
            </div>

            {/* Additional Links */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Полезные ссылки</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/structure" className="text-blue-600 hover:text-blue-800 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Структура департамента
                  </Link>
                </li>
                <li>
                  <Link href="/about" className="text-blue-600 hover:text-blue-800 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    О департаменте
                  </Link>
                </li>
                <li>
                  <Link href="/news" className="text-blue-600 hover:text-blue-800 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    Новости и события
                  </Link>
                </li>
                <li>
                  <a href="mailto:info@econom32.ru" className="text-blue-600 hover:text-blue-800 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Написать письмо
                  </a>
                </li>
              </ul>
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