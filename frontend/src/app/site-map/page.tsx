'use client';

import { MainNavigation } from '@/components/navigation/MainNavigation';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import Link from 'next/link';

interface SitemapSection {
  title: string;
  links: {
    label: string;
    href: string;
    description?: string;
  }[];
}

const sitemapData: SitemapSection[] = [
  {
    title: 'О департаменте',
    links: [
      { label: 'Общая информация', href: '/about', description: 'Основные сведения о департаменте' },
      { label: 'Руководство', href: '/about/leadership', description: 'Руководящий состав департамента' },
      { label: 'История', href: '/about/history', description: 'История создания и развития' },
      { label: 'Документы', href: '/about/documents', description: 'Нормативные документы и положения' }
    ]
  },
  {
    title: 'Направления работы',
    links: [
      { label: 'Национальные проекты', href: '/activity/national-projects', description: 'Реализация национальных проектов в регионе' },
      { label: 'Стратегическое планирование', href: '/activity/strategic-planning', description: 'Планы и стратегии развития экономики' },
      { label: 'Поддержка бизнеса', href: '/activity/small-business', description: 'Программы поддержки предпринимательства' },
      { label: 'Инвестиции', href: '/activity/investments', description: 'Инвестиционные возможности региона' }
    ]
  },
  {
    title: 'Информация и услуги',
    links: [
      { label: 'Новости', href: '/news', description: 'Актуальные новости и события' },
      { label: 'Структура', href: '/structure', description: 'Организационная структура департамента' },
      { label: 'Обращения граждан', href: '/appeals', description: 'Интернет-приемная для обращений' },
      { label: 'Контакты', href: '/contacts', description: 'Контактная информация и реквизиты' }
    ]
  },
  {
    title: 'Дополнительно',
    links: [
      { label: 'Карта сайта', href: '/site-map', description: 'Структура и навигация по сайту' },
      { label: 'Версия для слабовидящих', href: '/?accessibility=true', description: 'Специальная версия сайта' }
    ]
  }
];

export default function SitemapPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavigation />

      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumbs items={[{ label: 'Карта сайта' }]} />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Карта сайта
          </h1>
          <p className="text-lg text-gray-600">
            Полная структура сайта Департамента экономического развития Брянской области
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {sitemapData.map((section) => (
            <div key={section.title} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                {section.title}
              </h2>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="block group hover:bg-blue-50 rounded-md p-3 transition-colors"
                    >
                      <div className="flex items-start">
                        <svg className="w-4 h-4 text-blue-600 mt-1 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <div>
                          <h3 className="text-base font-medium text-gray-900 group-hover:text-blue-600">
                            {link.label}
                          </h3>
                          {link.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {link.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Статистика сайта
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {sitemapData.reduce((total, section) => total + section.links.length, 0)}
              </div>
              <div className="text-sm text-gray-600">Страниц</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {sitemapData.length}
              </div>
              <div className="text-sm text-gray-600">Разделов</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">100%</div>
              <div className="text-sm text-gray-600">Доступность</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">WCAG 2.1</div>
              <div className="text-sm text-gray-600">Стандарт</div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Не нашли нужную информацию?
          </h2>
          <p className="text-gray-600 mb-4">
            Обратитесь к нам через интернет-приемную или по контактным данным
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/appeals"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors text-center"
            >
              Подать обращение
            </Link>
            <Link
              href="/contacts"
              className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors text-center"
            >
              Контакты
            </Link>
          </div>
        </div>
      </main>

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
                <li><Link href="/news" className="text-gray-300 hover:text-white">Новости</Link></li>
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