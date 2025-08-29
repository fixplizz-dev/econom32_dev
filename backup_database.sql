--
-- PostgreSQL database dump
--

\restrict sLP2Kxz80dc6FDT0EXPYuVIlFhhR3TuMQj14B1ds3OJx3DqM7kom38ncw5WZ1Yk

-- Dumped from database version 15.14
-- Dumped by pg_dump version 15.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: econom32_user
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO econom32_user;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: econom32_user
--

COMMENT ON SCHEMA public IS '';


--
-- Name: AppealStatus; Type: TYPE; Schema: public; Owner: econom32_user
--

CREATE TYPE public."AppealStatus" AS ENUM (
    'NEW',
    'IN_PROGRESS',
    'ANSWERED',
    'CLOSED'
);


ALTER TYPE public."AppealStatus" OWNER TO econom32_user;

--
-- Name: ContactType; Type: TYPE; Schema: public; Owner: econom32_user
--

CREATE TYPE public."ContactType" AS ENUM (
    'PHONE',
    'EMAIL',
    'ADDRESS',
    'WEBSITE',
    'FAX'
);


ALTER TYPE public."ContactType" OWNER TO econom32_user;

--
-- Name: NotificationPriority; Type: TYPE; Schema: public; Owner: econom32_user
--

CREATE TYPE public."NotificationPriority" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);


ALTER TYPE public."NotificationPriority" OWNER TO econom32_user;

--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: econom32_user
--

CREATE TYPE public."NotificationType" AS ENUM (
    'NEW_APPEAL',
    'APPEAL_UPDATED',
    'NEW_COMMENT',
    'SYSTEM_ALERT',
    'BACKUP_SUCCESS',
    'BACKUP_FAILED',
    'SECURITY_ALERT',
    'NEWS_PUBLISHED'
);


ALTER TYPE public."NotificationType" OWNER TO econom32_user;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: econom32_user
--

CREATE TYPE public."Role" AS ENUM (
    'ADMIN',
    'EDITOR',
    'MODERATOR'
);


ALTER TYPE public."Role" OWNER TO econom32_user;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: econom32_user
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO econom32_user;

--
-- Name: appeals; Type: TABLE; Schema: public; Owner: econom32_user
--

CREATE TABLE public.appeals (
    id text NOT NULL,
    "ticketNumber" text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    email text NOT NULL,
    phone text,
    subject text NOT NULL,
    message text NOT NULL,
    attachments text[] DEFAULT ARRAY[]::text[],
    status public."AppealStatus" DEFAULT 'NEW'::public."AppealStatus" NOT NULL,
    response text,
    "respondedAt" timestamp(3) without time zone,
    "respondedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.appeals OWNER TO econom32_user;

--
-- Name: banners; Type: TABLE; Schema: public; Owner: econom32_user
--

CREATE TABLE public.banners (
    id text NOT NULL,
    "titleRu" text NOT NULL,
    "titleEn" text,
    "descriptionRu" text,
    "descriptionEn" text,
    image text,
    link text,
    "position" integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    "startDate" timestamp(3) without time zone,
    "endDate" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.banners OWNER TO econom32_user;

--
-- Name: contacts; Type: TABLE; Schema: public; Owner: econom32_user
--

CREATE TABLE public.contacts (
    id text NOT NULL,
    type public."ContactType" NOT NULL,
    value text NOT NULL,
    label text,
    "order" integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "departmentId" text NOT NULL
);


ALTER TABLE public.contacts OWNER TO econom32_user;

--
-- Name: departments; Type: TABLE; Schema: public; Owner: econom32_user
--

CREATE TABLE public.departments (
    id text NOT NULL,
    "nameRu" text NOT NULL,
    "nameEn" text,
    "descriptionRu" text,
    "descriptionEn" text,
    "parentId" text,
    "order" integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.departments OWNER TO econom32_user;

--
-- Name: employees; Type: TABLE; Schema: public; Owner: econom32_user
--

CREATE TABLE public.employees (
    id text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    "middleName" text,
    "positionRu" text NOT NULL,
    "positionEn" text,
    photo text,
    email text,
    phone text,
    "order" integer DEFAULT 0 NOT NULL,
    active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "departmentId" text NOT NULL
);


ALTER TABLE public.employees OWNER TO econom32_user;

--
-- Name: files; Type: TABLE; Schema: public; Owner: econom32_user
--

CREATE TABLE public.files (
    id text NOT NULL,
    filename text NOT NULL,
    "originalName" text NOT NULL,
    "mimeType" text NOT NULL,
    size integer NOT NULL,
    path text NOT NULL,
    bucket text DEFAULT 'econom32-files'::text NOT NULL,
    scanned boolean DEFAULT false NOT NULL,
    safe boolean DEFAULT false NOT NULL,
    "scanResult" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.files OWNER TO econom32_user;

--
-- Name: login_attempts; Type: TABLE; Schema: public; Owner: econom32_user
--

CREATE TABLE public.login_attempts (
    id text NOT NULL,
    "userId" text,
    email text NOT NULL,
    ip text NOT NULL,
    "userAgent" text NOT NULL,
    success boolean NOT NULL,
    reason text,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.login_attempts OWNER TO econom32_user;

--
-- Name: news; Type: TABLE; Schema: public; Owner: econom32_user
--

CREATE TABLE public.news (
    id text NOT NULL,
    "titleRu" text NOT NULL,
    "titleEn" text,
    "contentRu" text NOT NULL,
    "contentEn" text,
    "excerptRu" text,
    "excerptEn" text,
    "featuredImage" text,
    published boolean DEFAULT false NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    views integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "authorId" text NOT NULL
);


ALTER TABLE public.news OWNER TO econom32_user;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: econom32_user
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    "userId" text NOT NULL,
    type public."NotificationType" NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    data text,
    priority public."NotificationPriority" DEFAULT 'MEDIUM'::public."NotificationPriority" NOT NULL,
    read boolean DEFAULT false NOT NULL,
    "readAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.notifications OWNER TO econom32_user;

--
-- Name: pages; Type: TABLE; Schema: public; Owner: econom32_user
--

CREATE TABLE public.pages (
    id text NOT NULL,
    slug text NOT NULL,
    "titleRu" text NOT NULL,
    "titleEn" text,
    "contentRu" text NOT NULL,
    "contentEn" text,
    "metaTitleRu" text,
    "metaTitleEn" text,
    "metaDescriptionRu" text,
    "metaDescriptionEn" text,
    published boolean DEFAULT false NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "authorId" text NOT NULL
);


ALTER TABLE public.pages OWNER TO econom32_user;

--
-- Name: users; Type: TABLE; Schema: public; Owner: econom32_user
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    password text NOT NULL,
    role public."Role" DEFAULT 'EDITOR'::public."Role" NOT NULL,
    active boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "backupCodes" text[] DEFAULT ARRAY[]::text[],
    "failedLoginAttempts" integer DEFAULT 0 NOT NULL,
    "lastLoginAt" timestamp(3) without time zone,
    "lastLoginIp" text,
    "lockedUntil" timestamp(3) without time zone,
    "twoFactorEnabled" boolean DEFAULT false NOT NULL,
    "twoFactorSecret" text
);


ALTER TABLE public.users OWNER TO econom32_user;

--
-- Name: visits; Type: TABLE; Schema: public; Owner: econom32_user
--

CREATE TABLE public.visits (
    id text NOT NULL,
    ip text NOT NULL,
    "userAgent" text NOT NULL,
    page text NOT NULL,
    referrer text,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.visits OWNER TO econom32_user;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: econom32_user
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
79311a11-0e8d-4cf7-9127-2098bac1fc5a	9093f11caf5be20e994bec51df05df0429ecf3c246a63ba811c860beb294fb51	2025-08-26 14:12:10.643192+00	20250825063025_init	\N	\N	2025-08-26 14:12:10.454827+00	1
f6bed1c4-f8f1-4c8d-b544-9dd8973bec57	a41eef9a455a34736ef7e9591e1fe2860d207f86546a40b2209e982c7746e77f	2025-08-26 14:12:16.624247+00	20250826141216_add_2fa_security	\N	\N	2025-08-26 14:12:16.523262+00	1
\.


--
-- Data for Name: appeals; Type: TABLE DATA; Schema: public; Owner: econom32_user
--

COPY public.appeals (id, "ticketNumber", "firstName", "lastName", email, phone, subject, message, attachments, status, response, "respondedAt", "respondedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: banners; Type: TABLE DATA; Schema: public; Owner: econom32_user
--

COPY public.banners (id, "titleRu", "titleEn", "descriptionRu", "descriptionEn", image, link, "position", active, "startDate", "endDate", "createdAt", "updatedAt") FROM stdin;
cmesmktcg000mas8cmq8odzrb	Поддержка малого бизнеса	Small Business Support	Узнайте о программах поддержки предпринимательства	Learn about entrepreneurship support programs	\N	/small-business	1	t	\N	\N	2025-08-26 14:12:18.449	2025-08-26 14:12:18.449
cmesmktco000nas8c19uihirt	Инвестиционные возможности	Investment Opportunities	Инвестируйте в экономику Брянской области	Invest in Bryansk region economy	\N	/investments	2	t	\N	\N	2025-08-26 14:12:18.456	2025-08-26 14:12:18.456
\.


--
-- Data for Name: contacts; Type: TABLE DATA; Schema: public; Owner: econom32_user
--

COPY public.contacts (id, type, value, label, "order", active, "createdAt", "updatedAt", "departmentId") FROM stdin;
cmesmktbc0009as8cf81d9qor	ADDRESS	241050, г. Брянск, ул. Советская, д. 1	Адрес	0	t	2025-08-26 14:12:18.408	2025-08-26 14:12:18.408	main-dept
cmesmktbj000bas8c2o67ln7x	PHONE	+7 (4832) 123-456	Телефон приемной	1	t	2025-08-26 14:12:18.415	2025-08-26 14:12:18.415	main-dept
cmesmktbl000das8c0g42t175	EMAIL	info@econom32.ru	Электронная почта	2	t	2025-08-26 14:12:18.418	2025-08-26 14:12:18.418	main-dept
\.


--
-- Data for Name: departments; Type: TABLE DATA; Schema: public; Owner: econom32_user
--

COPY public.departments (id, "nameRu", "nameEn", "descriptionRu", "descriptionEn", "parentId", "order", active, "createdAt", "updatedAt") FROM stdin;
main-dept	Департамент экономического развития Брянской области	Department of Economic Development of Bryansk Region	Основное подразделение, отвечающее за экономическое развитие региона	Main department responsible for economic development of the region	\N	0	t	2025-08-26 14:12:18.306	2025-08-26 14:12:18.306
strategic-planning	Отдел стратегического планирования	Strategic Planning Department	Разработка стратегий экономического развития	\N	main-dept	1	t	2025-08-26 14:12:18.321	2025-08-26 14:12:18.321
small-business	Отдел поддержки малого бизнеса	Small Business Support Department	Поддержка и развитие малого и среднего предпринимательства	\N	main-dept	2	t	2025-08-26 14:12:18.373	2025-08-26 14:12:18.373
investment	Отдел инвестиций	Investment Department	Привлечение инвестиций в экономику региона	\N	main-dept	3	t	2025-08-26 14:12:18.385	2025-08-26 14:12:18.385
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: econom32_user
--

COPY public.employees (id, "firstName", "lastName", "middleName", "positionRu", "positionEn", photo, email, phone, "order", active, "createdAt", "updatedAt", "departmentId") FROM stdin;
cmesmktav0003as8cyqv6czcd	Иван	Петров	Сергеевич	Начальник департамента	Head of Department	\N	petrov@econom32.ru	+7 (4832) 123-456	0	t	2025-08-26 14:12:18.391	2025-08-26 14:12:18.391	main-dept
cmesmktb40005as8cnnsaa0rk	Мария	Сидорова	Александровна	Заместитель начальника департамента	Deputy Head of Department	\N	sidorova@econom32.ru	+7 (4832) 123-457	1	t	2025-08-26 14:12:18.4	2025-08-26 14:12:18.4	main-dept
cmesmktb70007as8crdgor2tc	Алексей	Козлов	Владимирович	Начальник отдела стратегического планирования	Head of Strategic Planning Department	\N	kozlov@econom32.ru	+7 (4832) 123-458	0	t	2025-08-26 14:12:18.404	2025-08-26 14:12:18.404	strategic-planning
\.


--
-- Data for Name: files; Type: TABLE DATA; Schema: public; Owner: econom32_user
--

COPY public.files (id, filename, "originalName", "mimeType", size, path, bucket, scanned, safe, "scanResult", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: login_attempts; Type: TABLE DATA; Schema: public; Owner: econom32_user
--

COPY public.login_attempts (id, "userId", email, ip, "userAgent", success, reason, "timestamp") FROM stdin;
\.


--
-- Data for Name: news; Type: TABLE DATA; Schema: public; Owner: econom32_user
--

COPY public.news (id, "titleRu", "titleEn", "contentRu", "contentEn", "excerptRu", "excerptEn", "featuredImage", published, "publishedAt", views, "createdAt", "updatedAt", "authorId") FROM stdin;
cmesmktc7000jas8ccojeoiq4	Запуск новой программы поддержки малого бизнеса	Launch of new small business support program	<p>Департамент экономического развития Брянской области объявляет о запуске новой программы поддержки малого и среднего предпринимательства. Программа предусматривает льготное кредитование и консультационную поддержку начинающих предпринимателей.</p>	<p>The Department of Economic Development of Bryansk Region announces the launch of a new small and medium business support program. The program provides preferential lending and consulting support for novice entrepreneurs.</p>	Новая программа поддержки малого бизнеса в Брянской области	New small business support program in Bryansk region	\N	t	2025-08-26 14:12:18.438	0	2025-08-26 14:12:18.439	2025-08-26 14:12:18.439	cmesmkt8a0001as8czkoi2oni
cmesmktcd000las8cdpe789or	Итоги экономического развития за первое полугодие	Economic development results for the first half of the year	<p>Подведены итоги экономического развития Брянской области за первое полугодие 2025 года. Отмечается положительная динамика в ключевых отраслях экономики региона.</p>	<p>The results of economic development of Bryansk region for the first half of 2025 have been summarized. Positive dynamics in key sectors of the regional economy are noted.</p>	Положительная динамика экономического развития региона	Positive dynamics of regional economic development	\N	t	2025-08-25 14:12:18.438	0	2025-08-26 14:12:18.445	2025-08-26 14:12:18.445	cmesmkt8a0001as8czkoi2oni
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: econom32_user
--

COPY public.notifications (id, "userId", type, title, message, data, priority, read, "readAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: pages; Type: TABLE DATA; Schema: public; Owner: econom32_user
--

COPY public.pages (id, slug, "titleRu", "titleEn", "contentRu", "contentEn", "metaTitleRu", "metaTitleEn", "metaDescriptionRu", "metaDescriptionEn", published, "publishedAt", "createdAt", "updatedAt", "authorId") FROM stdin;
cmesmktbp000fas8cq1ogv9f9	about	О департаменте	About Department	<h1>О департаменте экономического развития</h1><p>Департамент экономического развития Брянской области является исполнительным органом государственной власти Брянской области, осуществляющим функции по выработке и реализации региональной политики и нормативно-правовому регулированию в сфере экономического развития.</p>	<h1>About the Department of Economic Development</h1><p>The Department of Economic Development of Bryansk Region is an executive body of state power of Bryansk Region that performs functions of developing and implementing regional policy and regulatory framework in the field of economic development.</p>	\N	\N	\N	\N	t	2025-08-26 14:12:18.419	2025-08-26 14:12:18.421	2025-08-26 14:12:18.421	cmesmkt020000as8cjjf7jyi1
cmesmktc1000has8c4iw4xpw0	contacts	Контакты	Contacts	<h1>Контактная информация</h1><p>Адрес: 241050, г. Брянск, ул. Советская, д. 1</p><p>Телефон: +7 (4832) 123-456</p><p>Email: info@econom32.ru</p>	<h1>Contact Information</h1><p>Address: 241050, Bryansk, Sovetskaya str., 1</p><p>Phone: +7 (4832) 123-456</p><p>Email: info@econom32.ru</p>	\N	\N	\N	\N	t	2025-08-26 14:12:18.419	2025-08-26 14:12:18.433	2025-08-26 14:12:18.433	cmesmkt020000as8cjjf7jyi1
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: econom32_user
--

COPY public.users (id, email, name, password, role, active, "createdAt", "updatedAt", "backupCodes", "failedLoginAttempts", "lastLoginAt", "lastLoginIp", "lockedUntil", "twoFactorEnabled", "twoFactorSecret") FROM stdin;
cmesmkt020000as8cjjf7jyi1	admin@econom32.ru	Администратор системы	$2a$12$aFqRBERbYEaJXA1buA3BT.AymSYl7XDY/QvM2IJIhDIttli6/EnR2	ADMIN	t	2025-08-26 14:12:18.002	2025-08-26 14:12:18.002	{}	0	\N	\N	\N	f	\N
cmesmkt8a0001as8czkoi2oni	editor@econom32.ru	Редактор контента	$2a$12$/KvafagqxJJ191NyGfZ1ced3A4uAYzP3DhP5bT7KsX/Tzx4fOT3Oq	EDITOR	t	2025-08-26 14:12:18.299	2025-08-26 14:12:18.299	{}	0	\N	\N	\N	f	\N
\.


--
-- Data for Name: visits; Type: TABLE DATA; Schema: public; Owner: econom32_user
--

COPY public.visits (id, ip, "userAgent", page, referrer, "timestamp") FROM stdin;
cmesmqz4n0000cg91s4ywxvgx	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	/	\N	2025-08-26 14:17:05.845
cmesmw2p700007gvfxmuhpvj9	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	/	\N	2025-08-26 14:21:03.75
cmesnhj7w000014m6kq7x1oli	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	/	\N	2025-08-26 14:37:44.932
cmesty2ab00009jj5791t32mn	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	/	\N	2025-08-26 17:38:33.834
cmesty82j00019jj58zog8u51	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	/contacts	\N	2025-08-26 17:38:41.37
cmesu65vn000010vyjhsz0d78	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	/	\N	2025-08-26 17:44:51.718
cmesu7hsd000110vy2w7z3ywv	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	/	\N	2025-08-26 17:45:53.867
cmesuer20000210vyv2ezt36e	::1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36	/structure	http://localhost:3001/structure	2025-08-26 17:51:32.421
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: econom32_user
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: appeals appeals_pkey; Type: CONSTRAINT; Schema: public; Owner: econom32_user
--

ALTER TABLE ONLY public.appeals
    ADD CONSTRAINT appeals_pkey PRIMARY KEY (id);


--
-- Name: banners banners_pkey; Type: CONSTRAINT; Schema: public; Owner: econom32_user
--

ALTER TABLE ONLY public.banners
    ADD CONSTRAINT banners_pkey PRIMARY KEY (id);


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: econom32_user
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: econom32_user
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: econom32_user
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: files files_pkey; Type: CONSTRAINT; Schema: public; Owner: econom32_user
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_pkey PRIMARY KEY (id);


--
-- Name: login_attempts login_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: econom32_user
--

ALTER TABLE ONLY public.login_attempts
    ADD CONSTRAINT login_attempts_pkey PRIMARY KEY (id);


--
-- Name: news news_pkey; Type: CONSTRAINT; Schema: public; Owner: econom32_user
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT news_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: econom32_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: pages pages_pkey; Type: CONSTRAINT; Schema: public; Owner: econom32_user
--

ALTER TABLE ONLY public.pages
    ADD CONSTRAINT pages_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: econom32_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: visits visits_pkey; Type: CONSTRAINT; Schema: public; Owner: econom32_user
--

ALTER TABLE ONLY public.visits
    ADD CONSTRAINT visits_pkey PRIMARY KEY (id);


--
-- Name: appeals_ticketNumber_key; Type: INDEX; Schema: public; Owner: econom32_user
--

CREATE UNIQUE INDEX "appeals_ticketNumber_key" ON public.appeals USING btree ("ticketNumber");


--
-- Name: login_attempts_email_timestamp_idx; Type: INDEX; Schema: public; Owner: econom32_user
--

CREATE INDEX login_attempts_email_timestamp_idx ON public.login_attempts USING btree (email, "timestamp");


--
-- Name: login_attempts_ip_timestamp_idx; Type: INDEX; Schema: public; Owner: econom32_user
--

CREATE INDEX login_attempts_ip_timestamp_idx ON public.login_attempts USING btree (ip, "timestamp");


--
-- Name: pages_slug_key; Type: INDEX; Schema: public; Owner: econom32_user
--

CREATE UNIQUE INDEX pages_slug_key ON public.pages USING btree (slug);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: econom32_user
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: visits_ip_idx; Type: INDEX; Schema: public; Owner: econom32_user
--

CREATE INDEX visits_ip_idx ON public.visits USING btree (ip);


--
-- Name: visits_page_idx; Type: INDEX; Schema: public; Owner: econom32_user
--

CREATE INDEX visits_page_idx ON public.visits USING btree (page);


--
-- Name: visits_timestamp_idx; Type: INDEX; Schema: public; Owner: econom32_user
--

CREATE INDEX visits_timestamp_idx ON public.visits USING btree ("timestamp");


--
-- Name: appeals appeals_respondedBy_fkey; Type: FK CONSTRAINT; Schema: public; Owner: econom32_user
--

ALTER TABLE ONLY public.appeals
    ADD CONSTRAINT "appeals_respondedBy_fkey" FOREIGN KEY ("respondedBy") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: contacts contacts_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: econom32_user
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT "contacts_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: departments departments_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: econom32_user
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT "departments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: employees employees_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: econom32_user
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT "employees_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: login_attempts login_attempts_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: econom32_user
--

ALTER TABLE ONLY public.login_attempts
    ADD CONSTRAINT "login_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: news news_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: econom32_user
--

ALTER TABLE ONLY public.news
    ADD CONSTRAINT "news_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: notifications notifications_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: econom32_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pages pages_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: econom32_user
--

ALTER TABLE ONLY public.pages
    ADD CONSTRAINT "pages_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: econom32_user
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict sLP2Kxz80dc6FDT0EXPYuVIlFhhR3TuMQj14B1ds3OJx3DqM7kom38ncw5WZ1Yk

