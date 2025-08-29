-- Инициализация базы данных для нового сайта
-- Создание расширений для полнотекстового поиска и UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Создание пользователя для приложения
CREATE USER app_user WITH PASSWORD 'app_password';
GRANT ALL PRIVILEGES ON DATABASE econom32_new TO app_user;

-- Настройка для полнотекстового поиска на русском языке
CREATE TEXT SEARCH CONFIGURATION russian_unaccent (COPY = russian);
ALTER TEXT SEARCH CONFIGURATION russian_unaccent
    ALTER MAPPING FOR word, asciiword WITH unaccent, russian_stem;

-- Комментарий о миграции
COMMENT ON DATABASE econom32_new IS 'Новая база данных для модернизированного сайта econom32.ru (миграция с Parser 3)';