'use client';

import { useEffect, useState } from 'react';
import { newsApi, bannersApi } from '@/lib/api';
import { News, Banner } from '@/lib/types';
import { MainNavigation } from '@/components/navigation/MainNavigation';
import { AccessibilityPanel } from '@/components/accessibility/AccessibilityPanel';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const [news, setNews] = useState<News[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch news with error handling
        let newsData = [];
        let bannersData = [];

        try {
          const newsResponse = await newsApi.getAll({ limit: 4, published: true });
          newsData = newsResponse.data?.news || [];
        } catch (newsError) {
          console.error('Error fetching news:', newsError);
          // Use mock data for news
          newsData = [
            {
              id: '1',
              titleRu: 'Запуск новой программы поддержки малого бизнеса',
              excerptRu: 'Департамент объявляет о запуске новой программы поддержки предпринимательства',
              views: 150,
              publishedAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              author: { name: 'Администратор' }
            }
          ];
        }

        try {
          const bannersResponse = await bannersApi.getAll();
          bannersData = bannersResponse.data || [];
        } catch (bannersError) {
          console.error('Error fetching banners:', bannersError);
          // Use mock data for banners
          bannersData = [
            {
              id: '1',
              titleRu: 'Поддержка малого бизнеса',
              descriptionRu: 'Узнайте о программах поддержки предпринимательства',
              link: '/small-business'
            }
          ];
        }
        
        setNews(newsData);
        setBanners(bannersData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip Link for Accessibility */}
      <a
        href="#main-content"
        className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50"
      >
        Перейти к основному содержанию
      </a>

      {/* Accessibility Panel */}
      <AccessibilityPanel />

      {/* Header */}
      <MainNavigation />

      {/* Hero Section */}
      <section className="bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-6 text-white">
              Экономическое развитие Брянской области
            </h1>
            <p className="text-lg mb-8 max-w-3xl mx-auto text-white opacity-90">
              Мы работаем над созданием благоприятных условий для развития экономики региона, 
              поддержки предпринимательства и привлечения инвестиций.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/appeals"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Подать обращение
              </Link>
              <Link
                href="/about"
                className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
              >
                О департаменте
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Latest News */}
            <section className="mb-12">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Последние новости</h2>
                <Link href="/news" className="text-blue-600 hover:text-blue-800">
                  Все новости →
                </Link>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {news.map((item) => (
                  <article key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    {item.featuredImage && (
                      <div className="h-48 bg-gray-200">
                        <Image
                          src={item.featuredImage}
                          alt={item.titleRu}
                          width={400}
                          height={200}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-base font-semibold text-gray-900 mb-2">
                        <Link href={`/news/${item.id}`} className="hover:text-blue-600">
                          {item.titleRu}
                        </Link>
                      </h3>
                      {item.excerptRu && (
                        <p className="text-gray-600 mb-4">{item.excerptRu}</p>
                      )}
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>{new Date(item.publishedAt || item.createdAt).toLocaleDateString('ru-RU')}</span>
                        <span>{item.views} просмотров</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* Quick Links */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Популярные разделы</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link href="/small-business" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Поддержка малого бизнеса</h3>
                  <p className="text-gray-600">Программы и меры поддержки предпринимательства</p>
                </Link>
                <Link href="/investments" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Инвестиции</h3>
                  <p className="text-gray-600">Инвестиционные возможности региона</p>
                </Link>
                <Link href="/national-projects" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Национальные проекты</h3>
                  <p className="text-gray-600">Реализация национальных проектов в регионе</p>
                </Link>
                <Link href="/strategic-planning" className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Стратегическое планирование</h3>
                  <p className="text-gray-600">Планы и стратегии развития экономики</p>
                </Link>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Banners */}
            {banners.length > 0 && (
              <section className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Важная информация</h2>
                <div className="space-y-4">
                  {banners.map((banner) => (
                    <div key={banner.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                      {banner.image && (
                        <div className="h-32 bg-gray-200">
                          <Image
                            src={banner.image}
                            alt={banner.titleRu}
                            width={300}
                            height={128}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {banner.link ? (
                            <Link href={banner.link} className="hover:text-blue-600">
                              {banner.titleRu}
                            </Link>
                          ) : (
                            banner.titleRu
                          )}
                        </h3>
                        {banner.descriptionRu && (
                          <p className="text-sm text-gray-600">{banner.descriptionRu}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Contact Info */}
            <section className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Контакты</h2>
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-gray-900">Адрес:</p>
                  <p className="text-gray-600">241050, г. Брянск, ул. Советская, д. 1</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Телефон:</p>
                  <p className="text-gray-600">+7 (4832) 123-456</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Email:</p>
                  <p className="text-gray-600">info@econom32.ru</p>
                </div>
              </div>
              <Link
                href="/contacts"
                className="inline-block mt-4 text-blue-600 hover:text-blue-800"
              >
                Подробная информация →
              </Link>
            </section>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-base font-semibold mb-4">Департамент экономического развития</h3>
              <p className="text-gray-300">
                Брянской области - орган исполнительной власти, осуществляющий функции 
                по выработке и реализации региональной политики в сфере экономического развития.
              </p>
            </div>
            <div>
              <h3 className="text-base font-semibold mb-4">Полезные ссылки</h3>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-gray-300 hover:text-white">О департаменте</Link></li>
                <li><Link href="/structure" className="text-gray-300 hover:text-white">Структура</Link></li>
                <li><Link href="/documents" className="text-gray-300 hover:text-white">Документы</Link></li>
                <li><Link href="/sitemap" className="text-gray-300 hover:text-white">Карта сайта</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-base font-semibold mb-4">Контакты</h3>
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