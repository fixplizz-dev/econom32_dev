'use client';

import { useEffect, useState, useMemo } from 'react';
import { departmentsApi, employeesApi } from '@/lib/api';
import { Department, Employee } from '@/lib/types';
import { MainNavigation } from '@/components/navigation/MainNavigation';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';

export default function StructurePage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'departments' | 'employees'>('all');
  const [activityFilter, setActivityFilter] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [departmentsResponse, employeesResponse] = await Promise.all([
          departmentsApi.getAll(),
          employeesApi.getAll()
        ]);
        setDepartments(departmentsResponse.data || []);
        setAllEmployees(employeesResponse.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        // Fallback to mock data
        const { mockDepartments, mockEmployees } = await import('@/lib/mockData');
        setDepartments(mockDepartments);
        setAllEmployees(mockEmployees);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Define activity areas for filtering
  const activityAreas = [
    'Стратегическое планирование',
    'Малый и средний бизнес',
    'Инвестиционная политика',
    'Внешнеэкономическая деятельность',
    'Инновации и цифровизация',
    'Макроэкономика',
    'Национальные проекты'
  ];

  // Filter and search logic
  const filteredData = useMemo(() => {
    let filteredDepartments = departments;
    let filteredEmployees = allEmployees;

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();

      filteredDepartments = departments.filter(dept =>
        dept.nameRu.toLowerCase().includes(query) ||
        (dept.descriptionRu && dept.descriptionRu.toLowerCase().includes(query))
      );

      filteredEmployees = allEmployees.filter(emp =>
        `${emp.firstName} ${emp.lastName} ${emp.middleName || ''}`.toLowerCase().includes(query) ||
        emp.positionRu.toLowerCase().includes(query) ||
        (emp.email && emp.email.toLowerCase().includes(query))
      );
    }

    // Apply activity filter
    if (activityFilter) {
      filteredDepartments = filteredDepartments.filter(dept =>
        dept.nameRu.includes(activityFilter) ||
        (dept.descriptionRu && dept.descriptionRu.includes(activityFilter))
      );

      filteredEmployees = filteredEmployees.filter(emp =>
        emp.positionRu.includes(activityFilter) ||
        emp.department.nameRu.includes(activityFilter)
      );
    }

    return { departments: filteredDepartments, employees: filteredEmployees };
  }, [departments, allEmployees, searchQuery, activityFilter]);

  const mainDepartment = departments.find(d => !d.parentId);
  const subDepartments = departments.filter(d => d.parentId);

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

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavigation />

      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumbs items={[{ label: 'Структура департамента' }]} />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Структура департамента
          </h1>
          <p className="text-lg text-gray-600">
            Организационная структура Департамента экономического развития Брянской области
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Search Input */}
            <div className="lg:col-span-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Поиск по сотрудникам и подразделениям
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Введите имя, должность или подразделение..."
                />
              </div>
            </div>

            {/* Content Type Filter */}
            <div className="lg:col-span-1">
              <label htmlFor="content-filter" className="block text-sm font-medium text-gray-700 mb-2">
                Тип контента
              </label>
              <select
                id="content-filter"
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value as 'all' | 'departments' | 'employees')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Все</option>
                <option value="departments">Только подразделения</option>
                <option value="employees">Только сотрудники</option>
              </select>
            </div>

            {/* Activity Area Filter */}
            <div className="lg:col-span-1">
              <label htmlFor="activity-filter" className="block text-sm font-medium text-gray-700 mb-2">
                Сфера деятельности
              </label>
              <select
                id="activity-filter"
                value={activityFilter}
                onChange={(e) => setActivityFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Все сферы</option>
                {activityAreas.map((area) => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          {(searchQuery || activityFilter || selectedFilter !== 'all') && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Найдено: {filteredData.departments.length} подразделений, {filteredData.employees.length} сотрудников
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActivityFilter('');
                  setSelectedFilter('all');
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Очистить фильтры
              </button>
            </div>
          )}
        </div>

        {/* Filtered Results or Default View */}
        {(searchQuery || activityFilter || selectedFilter !== 'all') ? (
          <div>
            {/* Filtered Departments */}
            {(selectedFilter === 'all' || selectedFilter === 'departments') && filteredData.departments.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Подразделения ({filteredData.departments.length})
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredData.departments.map((department) => (
                    <Link
                      key={department.id}
                      href={`/structure/${department.id}`}
                      className="block bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                    >
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {department.nameRu}
                      </h3>
                      {department.descriptionRu && (
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {department.descriptionRu}
                        </p>
                      )}
                      <div className="flex items-center text-sm text-blue-600">
                        <span>Подробнее</span>
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Filtered Employees */}
            {(selectedFilter === 'all' || selectedFilter === 'employees') && filteredData.employees.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Сотрудники ({filteredData.employees.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredData.employees.map((employee) => (
                    <div key={employee.id} className="bg-white rounded-lg shadow-md p-6">
                      <div className="flex items-center mb-4">
                        <div className="flex-shrink-0 mr-4">
                          {employee.photo ? (
                            <Image
                              src={employee.photo}
                              alt={`${employee.firstName} ${employee.lastName}`}
                              width={64}
                              height={64}
                              className="w-16 h-16 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {employee.firstName} {employee.lastName}
                            {employee.middleName && ` ${employee.middleName}`}
                          </h3>
                          <p className="text-blue-600 font-medium text-sm">
                            {employee.positionRu}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Подразделение:</span>{' '}
                          <Link
                            href={`/structure/${employee.department.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {employee.department.nameRu}
                          </Link>
                        </p>
                        {employee.email && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Email:</span>{' '}
                            <a href={`mailto:${employee.email}`} className="text-blue-600 hover:underline">
                              {employee.email}
                            </a>
                          </p>
                        )}
                        {employee.phone && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Телефон:</span>{' '}
                            <a href={`tel:${employee.phone}`} className="text-blue-600 hover:underline">
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

            {/* No Results */}
            {filteredData.departments.length === 0 && filteredData.employees.length === 0 && (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Ничего не найдено</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Попробуйте изменить параметры поиска или очистить фильтры.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Default View - Main Department */}
            {mainDepartment && (
              <div className="bg-white rounded-lg shadow-md p-8 mb-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    {mainDepartment.nameRu}
                  </h2>
                  {mainDepartment.descriptionRu && (
                    <p className="text-gray-600 max-w-3xl mx-auto">
                      {mainDepartment.descriptionRu}
                    </p>
                  )}
                </div>

                {/* Main Department Leadership */}
                {mainDepartment.employees.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Руководство</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {mainDepartment.employees.map((employee) => (
                        <div key={employee.id} className="text-center">
                          <div className="mb-4">
                            {employee.photo ? (
                              <Image
                                src={employee.photo}
                                alt={`${employee.firstName} ${employee.lastName}`}
                                width={150}
                                height={150}
                                className="w-32 h-32 rounded-full mx-auto object-cover"
                              />
                            ) : (
                              <div className="w-32 h-32 rounded-full mx-auto bg-gray-200 flex items-center justify-center">
                                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-1">
                            {employee.firstName} {employee.lastName}
                            {employee.middleName && ` ${employee.middleName}`}
                          </h4>
                          <p className="text-blue-600 font-medium mb-2">
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

                {/* Main Department Contacts */}
                {mainDepartment.contacts.length > 0 && (
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Контактная информация</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {mainDepartment.contacts.map((contact) => (
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
                          </div>
                          <div>
                            {contact.label && (
                              <p className="text-sm font-medium text-gray-900">{contact.label}</p>
                            )}
                            <p className="text-sm text-gray-600">{contact.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sub Departments */}
            {subDepartments.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Подразделения</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {subDepartments.map((department) => (
                    <Link
                      key={department.id}
                      href={`/structure/${department.id}`}
                      className="block bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                    >
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        {department.nameRu}
                      </h3>

                      {department.descriptionRu && (
                        <p className="text-gray-600 mb-4">
                          {department.descriptionRu}
                        </p>
                      )}

                      {/* Department Employee Count */}
                      {department.employees.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-500">
                            Сотрудников: {department.employees.length}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center text-sm text-blue-600">
                        <span>Подробнее</span>
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {departments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Информация о структуре департамента пока не доступна</p>
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