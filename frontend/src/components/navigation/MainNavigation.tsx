'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { clsx } from 'clsx';
import { SearchBox } from '@/components/search/SearchBox';

interface NavigationItem {
  label: string;
  href: string;
  children?: NavigationItem[];
}

const navigationItems: NavigationItem[] = [
  {
    label: 'О департаменте',
    href: '/about',
    children: [
      { label: 'Руководство', href: '/about/leadership' },
      { label: 'История', href: '/about/history' },
      { label: 'Документы', href: '/about/documents' }
    ]
  },
  {
    label: 'Направления работы',
    href: '/activity',
    children: [
      { label: 'Национальные проекты', href: '/activity/national-projects' },
      { label: 'Стратегическое планирование', href: '/activity/strategic-planning' },
      { label: 'Поддержка бизнеса', href: '/activity/small-business' },
      { label: 'Инвестиции', href: '/activity/investments' }
    ]
  },
  { label: 'Новости', href: '/news' },
  { label: 'Структура', href: '/structure' },
  { label: 'Обращения граждан', href: '/appeals' },
  { label: 'Контакты', href: '/contacts' }
];

export const MainNavigation: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const toggleDropdown = (label: string) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  return (
    <nav className="bg-white shadow-sm border-b mt-16 lg:mt-0 main-navigation" role="navigation" aria-label="Основная навигация">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center py-4">
            <Link href="/" className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded group">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-700 transition-colors">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="logo-container">
                  <h1 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">
                    Департамент экономического развития
                  </h1>
                  <p className="text-sm text-gray-600">Брянской области</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center nav-items">
            {navigationItems.map((item) => (
              <div key={item.label} className="relative">
                {item.children ? (
                  <div className="relative">
                    <button
                      onClick={() => toggleDropdown(item.label)}
                      className={clsx(
                        'flex items-center px-3 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                        isActive(item.href)
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                      )}
                      aria-expanded={openDropdown === item.label}
                      aria-haspopup="true"
                    >
                      {item.label}
                      <svg
                        className={clsx(
                          'ml-1 h-4 w-4 transition-transform',
                          openDropdown === item.label ? 'rotate-180' : ''
                        )}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {openDropdown === item.label && (
                      <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                        <div className="py-1" role="menu">
                          {item.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={clsx(
                                'block px-4 py-2 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500',
                                isActive(child.href)
                                  ? 'text-blue-600 bg-blue-50'
                                  : 'text-gray-700'
                              )}
                              role="menuitem"
                              onClick={() => setOpenDropdown(null)}
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={clsx(
                      'px-3 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                      isActive(item.href)
                        ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                    )}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
            
            {/* Search Box */}
            <div className="search-container">
              <SearchBox className="w-72" />
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-expanded={isMobileMenuOpen}
              aria-label="Открыть меню"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 py-4">
            {/* Mobile Search */}
            <div className="px-3 pb-4">
              <SearchBox className="w-full" placeholder="Поиск..." />
            </div>
            <div className="space-y-1">
              {navigationItems.map((item) => (
                <div key={item.label}>
                  {item.children ? (
                    <div>
                      <button
                        onClick={() => toggleDropdown(item.label)}
                        className={clsx(
                          'flex items-center justify-between w-full px-3 py-2 text-base font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                          isActive(item.href)
                            ? 'text-blue-600 bg-blue-50 border-l-4 border-blue-600'
                            : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                        )}
                        aria-expanded={openDropdown === item.label}
                      >
                        {item.label}
                        <svg
                          className={clsx(
                            'h-4 w-4 transition-transform',
                            openDropdown === item.label ? 'rotate-180' : ''
                          )}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {openDropdown === item.label && (
                        <div className="pl-4 space-y-1">
                          {item.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              className={clsx(
                                'block px-3 py-2 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                                isActive(child.href)
                                  ? 'text-blue-600 bg-blue-50 font-medium'
                                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                              )}
                              onClick={() => {
                                setIsMobileMenuOpen(false);
                                setOpenDropdown(null);
                              }}
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={clsx(
                        'block px-3 py-2 text-base font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                        isActive(item.href)
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                      )}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};