import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Начинаем заполнение базы данных...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@econom32.ru' },
    update: {},
    create: {
      email: 'admin@econom32.ru',
      name: 'Администратор системы',
      password: adminPassword,
      role: 'ADMIN'
    }
  });
  console.log('✅ Создан администратор:', admin.email);

  // Create editor user
  const editorPassword = await bcrypt.hash('editor123', 12);
  const editor = await prisma.user.upsert({
    where: { email: 'editor@econom32.ru' },
    update: {},
    create: {
      email: 'editor@econom32.ru',
      name: 'Редактор контента',
      password: editorPassword,
      role: 'EDITOR'
    }
  });
  console.log('✅ Создан редактор:', editor.email);

  // Create main department
  const mainDepartment = await prisma.department.upsert({
    where: { id: 'main-dept' },
    update: {},
    create: {
      id: 'main-dept',
      nameRu: 'Департамент экономического развития Брянской области',
      nameEn: 'Department of Economic Development of Bryansk Region',
      descriptionRu: 'Основное подразделение, отвечающее за экономическое развитие региона',
      descriptionEn: 'Main department responsible for economic development of the region',
      order: 0
    }
  });
  console.log('✅ Создан главный департамент');

  // Create sub-departments
  const subDepartments = [
    {
      id: 'strategic-planning',
      nameRu: 'Отдел стратегического планирования',
      nameEn: 'Strategic Planning Department',
      descriptionRu: 'Разработка стратегий экономического развития',
      order: 1
    },
    {
      id: 'small-business',
      nameRu: 'Отдел поддержки малого бизнеса',
      nameEn: 'Small Business Support Department',
      descriptionRu: 'Поддержка и развитие малого и среднего предпринимательства',
      order: 2
    },
    {
      id: 'investment',
      nameRu: 'Отдел инвестиций',
      nameEn: 'Investment Department',
      descriptionRu: 'Привлечение инвестиций в экономику региона',
      order: 3
    }
  ];

  for (const dept of subDepartments) {
    await prisma.department.upsert({
      where: { id: dept.id },
      update: {},
      create: {
        ...dept,
        parentId: mainDepartment.id
      }
    });
  }
  console.log('✅ Созданы подразделения');

  // Create employees
  const employees = [
    {
      firstName: 'Иван',
      lastName: 'Петров',
      middleName: 'Сергеевич',
      positionRu: 'Начальник департамента',
      positionEn: 'Head of Department',
      email: 'petrov@econom32.ru',
      phone: '+7 (4832) 123-456',
      departmentId: mainDepartment.id,
      order: 0
    },
    {
      firstName: 'Мария',
      lastName: 'Сидорова',
      middleName: 'Александровна',
      positionRu: 'Заместитель начальника департамента',
      positionEn: 'Deputy Head of Department',
      email: 'sidorova@econom32.ru',
      phone: '+7 (4832) 123-457',
      departmentId: mainDepartment.id,
      order: 1
    },
    {
      firstName: 'Алексей',
      lastName: 'Козлов',
      middleName: 'Владимирович',
      positionRu: 'Начальник отдела стратегического планирования',
      positionEn: 'Head of Strategic Planning Department',
      email: 'kozlov@econom32.ru',
      phone: '+7 (4832) 123-458',
      departmentId: 'strategic-planning',
      order: 0
    }
  ];

  for (const emp of employees) {
    await prisma.employee.create({
      data: emp
    });
  }
  console.log('✅ Созданы сотрудники');

  // Create contacts
  const contacts = [
    {
      type: 'ADDRESS',
      value: '241050, г. Брянск, ул. Советская, д. 1',
      label: 'Адрес',
      departmentId: mainDepartment.id,
      order: 0
    },
    {
      type: 'PHONE',
      value: '+7 (4832) 123-456',
      label: 'Телефон приемной',
      departmentId: mainDepartment.id,
      order: 1
    },
    {
      type: 'EMAIL',
      value: 'info@econom32.ru',
      label: 'Электронная почта',
      departmentId: mainDepartment.id,
      order: 2
    }
  ];

  for (const contact of contacts) {
    await prisma.contact.create({
      data: contact as any
    });
  }
  console.log('✅ Созданы контакты');

  // Create sample pages
  const pages = [
    {
      slug: 'about',
      titleRu: 'О департаменте',
      titleEn: 'About Department',
      contentRu: '<h1>О департаменте экономического развития</h1><p>Департамент экономического развития Брянской области является исполнительным органом государственной власти Брянской области, осуществляющим функции по выработке и реализации региональной политики и нормативно-правовому регулированию в сфере экономического развития.</p>',
      contentEn: '<h1>About the Department of Economic Development</h1><p>The Department of Economic Development of Bryansk Region is an executive body of state power of Bryansk Region that performs functions of developing and implementing regional policy and regulatory framework in the field of economic development.</p>',
      published: true,
      publishedAt: new Date(),
      authorId: admin.id
    },
    {
      slug: 'contacts',
      titleRu: 'Контакты',
      titleEn: 'Contacts',
      contentRu: '<h1>Контактная информация</h1><p>Адрес: 241050, г. Брянск, ул. Советская, д. 1</p><p>Телефон: +7 (4832) 123-456</p><p>Email: info@econom32.ru</p>',
      contentEn: '<h1>Contact Information</h1><p>Address: 241050, Bryansk, Sovetskaya str., 1</p><p>Phone: +7 (4832) 123-456</p><p>Email: info@econom32.ru</p>',
      published: true,
      publishedAt: new Date(),
      authorId: admin.id
    }
  ];

  for (const page of pages) {
    await prisma.page.upsert({
      where: { slug: page.slug },
      update: {},
      create: page
    });
  }
  console.log('✅ Созданы страницы');

  // Create sample news
  const news = [
    {
      titleRu: 'Запуск новой программы поддержки малого бизнеса',
      titleEn: 'Launch of new small business support program',
      contentRu: '<p>Департамент экономического развития Брянской области объявляет о запуске новой программы поддержки малого и среднего предпринимательства. Программа предусматривает льготное кредитование и консультационную поддержку начинающих предпринимателей.</p>',
      contentEn: '<p>The Department of Economic Development of Bryansk Region announces the launch of a new small and medium business support program. The program provides preferential lending and consulting support for novice entrepreneurs.</p>',
      excerptRu: 'Новая программа поддержки малого бизнеса в Брянской области',
      excerptEn: 'New small business support program in Bryansk region',
      published: true,
      publishedAt: new Date(),
      authorId: editor.id
    },
    {
      titleRu: 'Итоги экономического развития за первое полугодие',
      titleEn: 'Economic development results for the first half of the year',
      contentRu: '<p>Подведены итоги экономического развития Брянской области за первое полугодие 2025 года. Отмечается положительная динамика в ключевых отраслях экономики региона.</p>',
      contentEn: '<p>The results of economic development of Bryansk region for the first half of 2025 have been summarized. Positive dynamics in key sectors of the regional economy are noted.</p>',
      excerptRu: 'Положительная динамика экономического развития региона',
      excerptEn: 'Positive dynamics of regional economic development',
      published: true,
      publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      authorId: editor.id
    }
  ];

  for (const newsItem of news) {
    await prisma.news.create({
      data: newsItem
    });
  }
  console.log('✅ Созданы новости');

  // Create sample banners
  const banners = [
    {
      titleRu: 'Поддержка малого бизнеса',
      titleEn: 'Small Business Support',
      descriptionRu: 'Узнайте о программах поддержки предпринимательства',
      descriptionEn: 'Learn about entrepreneurship support programs',
      link: '/small-business',
      position: 1,
      active: true
    },
    {
      titleRu: 'Инвестиционные возможности',
      titleEn: 'Investment Opportunities',
      descriptionRu: 'Инвестируйте в экономику Брянской области',
      descriptionEn: 'Invest in Bryansk region economy',
      link: '/investments',
      position: 2,
      active: true
    }
  ];

  for (const banner of banners) {
    await prisma.banner.create({
      data: banner
    });
  }
  console.log('✅ Созданы баннеры');

  console.log('🎉 Заполнение базы данных завершено!');
  console.log('');
  console.log('📋 Учетные данные для входа:');
  console.log('👤 Администратор: admin@econom32.ru / admin123');
  console.log('✏️  Редактор: editor@econom32.ru / editor123');
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при заполнении базы данных:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });