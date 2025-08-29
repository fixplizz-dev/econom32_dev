import { Department, Employee } from './types';

// Mock Departments Data
export const mockDepartments: Department[] = [
  {
    id: '1',
    nameRu: 'Департамент экономического развития Брянской области',
    nameEn: 'Department of Economic Development of Bryansk Region',
    descriptionRu: 'Орган исполнительной власти Брянской области, осуществляющий функции по выработке и реализации региональной политики в сфере экономического развития, инвестиционной деятельности, малого и среднего предпринимательства.',
    descriptionEn: 'Executive body of Bryansk Region implementing functions for development and implementation of regional policy in economic development, investment activities, small and medium business.',
    parentId: undefined,
    order: 1,
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    children: [],
    employees: [
      {
        id: '1',
        firstName: 'Александр',
        lastName: 'Петров',
        middleName: 'Иванович',
        positionRu: 'Директор департамента',
        positionEn: 'Department Director',
        photo: '/images/employees/petrov.jpg',
        email: 'a.petrov@econom32.ru',
        phone: '+7 (4832) 123-456',
        order: 1,
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        department: {
          id: '1',
          nameRu: 'Департамент экономического развития Брянской области',
          nameEn: 'Department of Economic Development of Bryansk Region'
        }
      }
    ],
    contacts: [
      {
        id: '1',
        type: 'ADDRESS',
        value: '241050, г. Брянск, ул. Советская, д. 1',
        label: 'Юридический адрес',
        order: 1,
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        type: 'PHONE',
        value: '+7 (4832) 123-456',
        label: 'Приемная',
        order: 2,
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '3',
        type: 'EMAIL',
        value: 'info@econom32.ru',
        label: 'Общие вопросы',
        order: 3,
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }
    ]
  },
  {
    id: '2',
    nameRu: 'Отдел стратегического планирования и макроэкономики',
    nameEn: 'Strategic Planning and Macroeconomics Department',
    descriptionRu: 'Осуществляет функции по разработке стратегических документов социально-экономического развития региона, анализу макроэкономических показателей.',
    descriptionEn: 'Implements functions for developing strategic documents of socio-economic development of the region, analysis of macroeconomic indicators.',
    parentId: '1',
    order: 1,
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    parent: {
      id: '1',
      nameRu: 'Департамент экономического развития Брянской области',
      nameEn: 'Department of Economic Development of Bryansk Region'
    },
    children: [],
    employees: [
      {
        id: '2',
        firstName: 'Елена',
        lastName: 'Сидорова',
        middleName: 'Александровна',
        positionRu: 'Начальник отдела',
        positionEn: 'Head of Department',
        photo: '/images/employees/sidorova.jpg',
        email: 'e.sidorova@econom32.ru',
        phone: '+7 (4832) 123-457',
        order: 1,
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        department: {
          id: '2',
          nameRu: 'Отдел стратегического планирования и макроэкономики',
          nameEn: 'Strategic Planning and Macroeconomics Department'
        }
      },
      {
        id: '3',
        firstName: 'Михаил',
        lastName: 'Козлов',
        middleName: 'Петрович',
        positionRu: 'Главный специалист',
        positionEn: 'Chief Specialist',
        email: 'm.kozlov@econom32.ru',
        phone: '+7 (4832) 123-458',
        order: 2,
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        department: {
          id: '2',
          nameRu: 'Отдел стратегического планирования и макроэкономики',
          nameEn: 'Strategic Planning and Macroeconomics Department'
        }
      }
    ],
    contacts: [
      {
        id: '4',
        type: 'PHONE',
        value: '+7 (4832) 123-457',
        label: 'Отдел стратегического планирования',
        order: 1,
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }
    ]
  },
  {
    id: '3',
    nameRu: 'Отдел развития малого и среднего предпринимательства',
    nameEn: 'Small and Medium Business Development Department',
    descriptionRu: 'Реализует государственную политику в сфере развития малого и среднего предпринимательства, координирует деятельность по поддержке субъектов МСП.',
    descriptionEn: 'Implements state policy in the field of small and medium business development, coordinates activities to support SME entities.',
    parentId: '1',
    order: 2,
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    parent: {
      id: '1',
      nameRu: 'Департамент экономического развития Брянской области',
      nameEn: 'Department of Economic Development of Bryansk Region'
    },
    children: [],
    employees: [
      {
        id: '4',
        firstName: 'Ольга',
        lastName: 'Морозова',
        middleName: 'Викторовна',
        positionRu: 'Начальник отдела',
        positionEn: 'Head of Department',
        photo: '/images/employees/morozova.jpg',
        email: 'o.morozova@econom32.ru',
        phone: '+7 (4832) 123-459',
        order: 1,
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        department: {
          id: '3',
          nameRu: 'Отдел развития малого и среднего предпринимательства',
          nameEn: 'Small and Medium Business Development Department'
        }
      },
      {
        id: '5',
        firstName: 'Дмитрий',
        lastName: 'Волков',
        middleName: 'Сергеевич',
        positionRu: 'Ведущий специалист',
        positionEn: 'Leading Specialist',
        email: 'd.volkov@econom32.ru',
        phone: '+7 (4832) 123-460',
        order: 2,
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        department: {
          id: '3',
          nameRu: 'Отдел развития малого и среднего предпринимательства',
          nameEn: 'Small and Medium Business Development Department'
        }
      }
    ],
    contacts: [
      {
        id: '5',
        type: 'PHONE',
        value: '+7 (4832) 123-459',
        label: 'Отдел МСП',
        order: 1,
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '6',
        type: 'EMAIL',
        value: 'msp@econom32.ru',
        label: 'Поддержка МСП',
        order: 2,
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }
    ]
  },
  {
    id: '4',
    nameRu: 'Отдел инвестиционной политики и внешнеэкономической деятельности',
    nameEn: 'Investment Policy and Foreign Economic Activity Department',
    descriptionRu: 'Осуществляет функции по формированию и реализации инвестиционной политики региона, развитию внешнеэкономических связей.',
    descriptionEn: 'Implements functions for formation and implementation of regional investment policy, development of foreign economic relations.',
    parentId: '1',
    order: 3,
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    parent: {
      id: '1',
      nameRu: 'Департамент экономического развития Брянской области',
      nameEn: 'Department of Economic Development of Bryansk Region'
    },
    children: [],
    employees: [
      {
        id: '6',
        firstName: 'Андрей',
        lastName: 'Новиков',
        middleName: 'Владимирович',
        positionRu: 'Начальник отдела',
        positionEn: 'Head of Department',
        photo: '/images/employees/novikov.jpg',
        email: 'a.novikov@econom32.ru',
        phone: '+7 (4832) 123-461',
        order: 1,
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        department: {
          id: '4',
          nameRu: 'Отдел инвестиционной политики и внешнеэкономической деятельности',
          nameEn: 'Investment Policy and Foreign Economic Activity Department'
        }
      },
      {
        id: '7',
        firstName: 'Татьяна',
        lastName: 'Белова',
        middleName: 'Николаевна',
        positionRu: 'Главный специалист',
        positionEn: 'Chief Specialist',
        email: 't.belova@econom32.ru',
        phone: '+7 (4832) 123-462',
        order: 2,
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        department: {
          id: '4',
          nameRu: 'Отдел инвестиционной политики и внешнеэкономической деятельности',
          nameEn: 'Investment Policy and Foreign Economic Activity Department'
        }
      }
    ],
    contacts: [
      {
        id: '7',
        type: 'PHONE',
        value: '+7 (4832) 123-461',
        label: 'Инвестиционная политика',
        order: 1,
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '8',
        type: 'EMAIL',
        value: 'invest@econom32.ru',
        label: 'Инвестиции',
        order: 2,
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }
    ]
  },
  {
    id: '5',
    nameRu: 'Отдел инноваций и цифровизации экономики',
    nameEn: 'Innovation and Economic Digitalization Department',
    descriptionRu: 'Координирует деятельность по развитию инновационной экономики, внедрению цифровых технологий в экономические процессы региона.',
    descriptionEn: 'Coordinates activities for innovative economy development, implementation of digital technologies in regional economic processes.',
    parentId: '1',
    order: 4,
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    parent: {
      id: '1',
      nameRu: 'Департамент экономического развития Брянской области',
      nameEn: 'Department of Economic Development of Bryansk Region'
    },
    children: [],
    employees: [
      {
        id: '8',
        firstName: 'Сергей',
        lastName: 'Федоров',
        middleName: 'Алексеевич',
        positionRu: 'Начальник отдела',
        positionEn: 'Head of Department',
        email: 's.fedorov@econom32.ru',
        phone: '+7 (4832) 123-463',
        order: 1,
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        department: {
          id: '5',
          nameRu: 'Отдел инноваций и цифровизации экономики',
          nameEn: 'Innovation and Economic Digitalization Department'
        }
      }
    ],
    contacts: [
      {
        id: '9',
        type: 'PHONE',
        value: '+7 (4832) 123-463',
        label: 'Инновации и цифровизация',
        order: 1,
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '10',
        type: 'EMAIL',
        value: 'innovation@econom32.ru',
        label: 'Инновации',
        order: 2,
        active: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }
    ]
  }
];

// Mock Employees Data (flattened for easier searching)
export const mockEmployees: Employee[] = [
  {
    id: '1',
    firstName: 'Александр',
    lastName: 'Петров',
    middleName: 'Иванович',
    positionRu: 'Директор департамента',
    positionEn: 'Department Director',
    photo: '/images/employees/petrov.jpg',
    email: 'a.petrov@econom32.ru',
    phone: '+7 (4832) 123-456',
    order: 1,
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    department: {
      id: '1',
      nameRu: 'Департамент экономического развития Брянской области',
      nameEn: 'Department of Economic Development of Bryansk Region'
    }
  },
  {
    id: '2',
    firstName: 'Елена',
    lastName: 'Сидорова',
    middleName: 'Александровна',
    positionRu: 'Начальник отдела стратегического планирования и макроэкономики',
    positionEn: 'Head of Strategic Planning and Macroeconomics Department',
    photo: '/images/employees/sidorova.jpg',
    email: 'e.sidorova@econom32.ru',
    phone: '+7 (4832) 123-457',
    order: 1,
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    department: {
      id: '2',
      nameRu: 'Отдел стратегического планирования и макроэкономики',
      nameEn: 'Strategic Planning and Macroeconomics Department'
    }
  },
  {
    id: '3',
    firstName: 'Михаил',
    lastName: 'Козлов',
    middleName: 'Петрович',
    positionRu: 'Главный специалист отдела стратегического планирования и макроэкономики',
    positionEn: 'Chief Specialist of Strategic Planning and Macroeconomics Department',
    email: 'm.kozlov@econom32.ru',
    phone: '+7 (4832) 123-458',
    order: 2,
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    department: {
      id: '2',
      nameRu: 'Отдел стратегического планирования и макроэкономики',
      nameEn: 'Strategic Planning and Macroeconomics Department'
    }
  },
  {
    id: '4',
    firstName: 'Ольга',
    lastName: 'Морозова',
    middleName: 'Викторовна',
    positionRu: 'Начальник отдела развития малого и среднего предпринимательства',
    positionEn: 'Head of Small and Medium Business Development Department',
    photo: '/images/employees/morozova.jpg',
    email: 'o.morozova@econom32.ru',
    phone: '+7 (4832) 123-459',
    order: 1,
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    department: {
      id: '3',
      nameRu: 'Отдел развития малого и среднего предпринимательства',
      nameEn: 'Small and Medium Business Development Department'
    }
  },
  {
    id: '5',
    firstName: 'Дмитрий',
    lastName: 'Волков',
    middleName: 'Сергеевич',
    positionRu: 'Ведущий специалист отдела развития малого и среднего предпринимательства',
    positionEn: 'Leading Specialist of Small and Medium Business Development Department',
    email: 'd.volkov@econom32.ru',
    phone: '+7 (4832) 123-460',
    order: 2,
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    department: {
      id: '3',
      nameRu: 'Отдел развития малого и среднего предпринимательства',
      nameEn: 'Small and Medium Business Development Department'
    }
  },
  {
    id: '6',
    firstName: 'Андрей',
    lastName: 'Новиков',
    middleName: 'Владимирович',
    positionRu: 'Начальник отдела инвестиционной политики и внешнеэкономической деятельности',
    positionEn: 'Head of Investment Policy and Foreign Economic Activity Department',
    photo: '/images/employees/novikov.jpg',
    email: 'a.novikov@econom32.ru',
    phone: '+7 (4832) 123-461',
    order: 1,
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    department: {
      id: '4',
      nameRu: 'Отдел инвестиционной политики и внешнеэкономической деятельности',
      nameEn: 'Investment Policy and Foreign Economic Activity Department'
    }
  },
  {
    id: '7',
    firstName: 'Татьяна',
    lastName: 'Белова',
    middleName: 'Николаевна',
    positionRu: 'Главный специалист отдела инвестиционной политики и внешнеэкономической деятельности',
    positionEn: 'Chief Specialist of Investment Policy and Foreign Economic Activity Department',
    email: 't.belova@econom32.ru',
    phone: '+7 (4832) 123-462',
    order: 2,
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    department: {
      id: '4',
      nameRu: 'Отдел инвестиционной политики и внешнеэкономической деятельности',
      nameEn: 'Investment Policy and Foreign Economic Activity Department'
    }
  },
  {
    id: '8',
    firstName: 'Сергей',
    lastName: 'Федоров',
    middleName: 'Алексеевич',
    positionRu: 'Начальник отдела инноваций и цифровизации экономики',
    positionEn: 'Head of Innovation and Economic Digitalization Department',
    email: 's.fedorov@econom32.ru',
    phone: '+7 (4832) 123-463',
    order: 1,
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    department: {
      id: '5',
      nameRu: 'Отдел инноваций и цифровизации экономики',
      nameEn: 'Innovation and Economic Digitalization Department'
    }
  },
  {
    id: '9',
    firstName: 'Анна',
    lastName: 'Кузнецова',
    middleName: 'Дмитриевна',
    positionRu: 'Специалист отдела стратегического планирования и макроэкономики',
    positionEn: 'Specialist of Strategic Planning and Macroeconomics Department',
    email: 'a.kuznetsova@econom32.ru',
    phone: '+7 (4832) 123-464',
    order: 3,
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    department: {
      id: '2',
      nameRu: 'Отдел стратегического планирования и макроэкономики',
      nameEn: 'Strategic Planning and Macroeconomics Department'
    }
  },
  {
    id: '10',
    firstName: 'Владимир',
    lastName: 'Соколов',
    middleName: 'Андреевич',
    positionRu: 'Специалист отдела развития малого и среднего предпринимательства',
    positionEn: 'Specialist of Small and Medium Business Development Department',
    email: 'v.sokolov@econom32.ru',
    phone: '+7 (4832) 123-465',
    order: 3,
    active: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    department: {
      id: '3',
      nameRu: 'Отдел развития малого и среднего предпринимательства',
      nameEn: 'Small and Medium Business Development Department'
    }
  }
];