'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { departmentsApi } from '@/lib/api';
import { Department } from '@/lib/types';
import { MainNavigation } from '@/components/navigation/MainNavigation';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';

export default function DepartmentDetailPage() {
  const params = useParams();
  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDepartment = async () => {
      try {
        const response = await departmentsApi.getById(params.id as string);
        setDepartment(response.data);
      } catch (error) {
        console.error('Error fetching department:', error);
        setError('Подразделение не найдено');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchDepartment();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MainNavigation />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error || !department) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MainNavigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Подразделение не найдено</h1>
            <p className="text-gray-600 mb-8">Запрашиваемое подразделение не существует или было удалено.</p>
            <Link 
              href="/structure" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Вернуться к структуре
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'Структура департамента', href: '/structure' },
    { label: department.nameRu }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavigation />

      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumbs items={breadcrumbItems} />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Department Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {department.nameRu}
            </h1>
            {department.descriptionRu && (
              <p className="text-lg text-gray-600">
                {department.descriptionRu}
              </p>
            )}
          </div>

          {/* Parent Department Link */}
          {department.parent && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Входит в состав:{' '}
                <Link 
                  href={`/structure/${department.parent.id}`}
                  className="font-medium hover:underline"
                >
                  {department.parent.nameRu}
                </Link>
              </p>
            </div>
          )}

          {/* Sub-departments */}
          {department.children.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Подразделения</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {department.children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/structure/${child.id}`}
                    className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <h3 className="font-medium text-gray-900">{child.nameRu}</h3>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Department Contacts */}
          {department.contacts.length > 0 && (
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Контактная информация</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {department.contacts.map((contact) => (
                  <div key={contact.id} className="flex items-start">
                    <div className="flex-shrink-0 mr-3">
                      {contact.type === 'PHONE' && (
                        <svg className="w-5 h-5 text-blue-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      )}
                      {contact.type === 'EMAIL' && (
                        <svg className="w-5 h-5 text-blue-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      )}
                      {contact.type === 'ADDRESS' && (
                        <svg className="w-5 h-5 text-blue-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                      {contact.type === 'WEBSITE' && (
                        <svg className="w-5 h-5 text-blue-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      )}
                      {contact.type === 'FAX' && (
                        <svg className="w-5 h-5 text-blue-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2" />
                        </svg>
                      )}
                    </div>
                    <div>
                      {contact.label && (
                        <p className="text-sm font-medium text-gray-900">{contact.label}</p>
                      )}
                      <p className="text-sm text-gray-600">
                        {contact.type === 'EMAIL' ? (
                          <a href={`mailto:${contact.value}`} className="hover:text-blue-600">
                            {contact.value}
                          </a>
                        ) : contact.type === 'PHONE' ? (
                          <a href={`tel:${contact.value}`} className="hover:text-blue-600">
                            {contact.value}
                          </a>
                        ) : contact.type === 'WEBSITE' ? (
                          <a href={contact.value} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
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
            </div>
          )}
        </div>

        {/* Department Employees */}
        {department.employees.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Сотрудники</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {department.employees.map((employee) => (
                <div key={employee.id} className="text-center p-6 bg-gray-50 rounded-lg">
                  <div className="mb-4">
                    {employee.photo ? (
                      <Image
                        src={employee.photo}
                        alt={`${employee.firstName} ${employee.lastName}`}
                        width={120}
                        height={120}
                        className="w-24 h-24 rounded-full mx-auto object-cover"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full mx-auto bg-gray-200 flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {employee.firstName} {employee.lastName}
                    {employee.middleName && ` ${employee.middleName}`}
                  </h3>
                  <p className="text-blue-600 font-medium mb-3">
                    {employee.positionRu}
                  </p>
                  <div className="text-sm text-gray-600 space-y-1">
                    {employee.email && (
                      <p>
                        <a href={`mailto:${employee.email}`} className="hover:text-blue-600">
                          {employee.email}
                        </a>
                      </p>
                    )}
                    {employee.phone && (
                      <p>
                        <a href={`tel:${employee.phone}`} className="hover:text-blue-600">
                          {employee.phone}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Back to Structure */}
        <div className="mt-8 text-center">
          <Link 
            href="/structure" 
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Вернуться к структуре департамента
          </Link>
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