'use client';

import { useEffect, useState } from 'react';
import { newsApi } from '@/lib/api';
import { News } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';

export default function NewsPage() {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const response = await newsApi.getAll({ 
          page: currentPage, 
          limit: 12, 
          published: true 
        });
        
        setNews(response.data?.news || []);
        setTotalPages(response.data?.pagination?.pages || 1);
      } catch (error) {
        console.error('Error fetching news:', error);
        // Fallback to mock data
        const { mockNews } = await import('@/lib/mockData');
        setNews(mockNews);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, [currentPage]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
              <Link href="/news" className="text-blue-600 font-semibold">
                Новости
              </Link>
              <Link href="/structure" className="text-gray-700 hover:text-blue-600">
                Структура
              </Link>
              <Link href="/appeals" className="text-gray-700 hover:text-blue-600">
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
                <span className="text-gray-900 font-medium">Новости</span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Новости</h1>
          <p className="text-lg text-gray-600">
            Актуальные новости и события Департамента экономического развития Брянской области
          </p>
        </div>

        {news.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Новости не найдены</p>
          </div>
        ) : (
          <>
            {/* News Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {news.map((item) => (
                <article key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
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
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <time dateTime={item.publishedAt || item.createdAt}>
                        {new Date(item.publishedAt || item.createdAt).toLocaleDateString('ru-RU', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </time>
                      <span className="mx-2">•</span>
                      <span>{item.views} просмотров</span>
                    </div>
                    
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">
                      <Link href={`/news/${item.id}`} className="hover:text-blue-600">
                        {item.titleRu}
                      </Link>
                    </h2>
                    
                    {item.excerptRu && (
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {item.excerptRu}
                      </p>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <Link
                        href={`/news/${item.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Читать далее →
                      </Link>
                      <span className="text-sm text-gray-500">
                        {item.author.name}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center">
                <nav className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Предыдущая
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Следующая
                  </button>
                </nav>
              </div>
            )}
          </>
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