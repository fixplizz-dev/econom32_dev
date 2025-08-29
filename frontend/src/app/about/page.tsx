'use client';

import { useEffect, useState } from 'react';
import { pagesApi } from '@/lib/api';
import { Page } from '@/lib/types';
import { MainNavigation } from '@/components/navigation/MainNavigation';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { AccessibilityPanel } from '@/components/accessibility/AccessibilityPanel';
import Link from 'next/link';

export default function AboutPage() {
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const response = await pagesApi.getBySlug('about');
        setPage(response.data);
      } catch (error) {
        console.error('Error fetching about page:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
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
          <Breadcrumbs items={[{ label: 'О департаменте' }]} />
        </div>
      </div>

      {/* Main Content */}
      <main id="main-content" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {page ? (
          <article>
            <header className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {page.titleRu}
              </h1>
              <div className="text-sm text-gray-500">
                Последнее обновление: {new Date(page.updatedAt).toLocaleDateString('ru-RU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </header>

            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: page.contentRu }}
            />

            {/* Additional Information Sections */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Основные направления</h2>
                <ul className="space-y-2 text-gray-600">
                  <li>• Стратегическое планирование экономического развития</li>
                  <li>• Поддержка малого и среднего предпринимательства</li>
                  <li>• Привлечение инвестиций в экономику региона</li>
                  <li>• Реализация национальных проектов</li>
                  <li>• Развитие внешнеэкономической деятельности</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Полезные ссылки</h2>
                <ul className="space-y-2">
                  <li>
                    <Link href="/structure" className="text-blue-600 hover:text-blue-800">
                      → Структура департамента
                    </Link>
                  </li>
                  <li>
                    <Link href="/about/leadership" className="text-blue-600 hover:text-blue-800">
                      → Руководство
                    </Link>
                  </li>
                  <li>
                    <Link href="/about/documents" className="text-blue-600 hover:text-blue-800">
                      → Нормативные документы
                    </Link>
                  </li>
                  <li>
                    <Link href="/contacts" className="text-blue-600 hover:text-blue-800">
                      → Контактная информация
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Mission and Vision */}
            <div className="mt-12 bg-blue-50 rounded-lg p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h2 className="text-xl font-semibold text-blue-900 mb-4">Наша миссия</h2>
                  <p className="text-blue-800">
                    Создание благоприятных условий для устойчивого экономического развития 
                    Брянской области, повышения конкурентоспособности региональной экономики 
                    и улучшения качества жизни населения.
                  </p>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-blue-900 mb-4">Наше видение</h2>
                  <p className="text-blue-800">
                    Брянская область - динамично развивающийся регион с диверсифицированной 
                    экономикой, высоким инвестиционным потенциалом и благоприятным 
                    предпринимательским климатом.
                  </p>
                </div>
              </div>
            </div>
          </article>
        ) : (
          <div className="text-center py-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">О департаменте</h1>
            <p className="text-gray-600 mb-8">
              Департамент экономического развития Брянской области является исполнительным 
              органом государственной власти Брянской области, осуществляющим функции по 
              выработке и реализации региональной политики и нормативно-правовому 
              регулированию в сфере экономического развития.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Основные направления</h2>
                <ul className="space-y-2 text-gray-600 text-left">
                  <li>• Стратегическое планирование экономического развития</li>
                  <li>• Поддержка малого и среднего предпринимательства</li>
                  <li>• Привлечение инвестиций в экономику региона</li>
                  <li>• Реализация национальных проектов</li>
                  <li>• Развитие внешнеэкономической деятельности</li>
                </ul>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Полезные ссылки</h2>
                <ul className="space-y-2 text-left">
                  <li>
                    <Link href="/structure" className="text-blue-600 hover:text-blue-800">
                      → Структура департамента
                    </Link>
                  </li>
                  <li>
                    <Link href="/news" className="text-blue-600 hover:text-blue-800">
                      → Новости и события
                    </Link>
                  </li>
                  <li>
                    <Link href="/appeals" className="text-blue-600 hover:text-blue-800">
                      → Интернет-приемная
                    </Link>
                  </li>
                  <li>
                    <Link href="/contacts" className="text-blue-600 hover:text-blue-800">
                      → Контактная информация
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
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