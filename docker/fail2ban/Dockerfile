FROM alpine:latest

# Установка fail2ban и зависимостей
RUN apk add --no-cache \
    fail2ban \
    iptables \
    whois \
    tzdata \
    && rm -rf /var/cache/apk/*

# Создание директорий
RUN mkdir -p /var/log/fail2ban \
    && mkdir -p /etc/fail2ban/jail.d

# Копирование конфигурации
COPY jail.local /etc/fail2ban/jail.local

# Создание скрипта запуска
RUN echo '#!/bin/sh' > /start.sh \
    && echo 'fail2ban-server -f -x -v start' >> /start.sh \
    && chmod +x /start.sh

# Настройка логирования
RUN touch /var/log/fail2ban/fail2ban.log

VOLUME ["/var/log"]

EXPOSE 22

CMD ["/start.sh"]