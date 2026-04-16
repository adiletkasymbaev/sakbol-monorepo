# Реализованный функционал для тур-агентов

## 📋 Обзор

Реализована полная система управления туристическими группами для тур-агентов с возможностью:
- Создания групп и приглашения участников
- Управления геозонами для отслеживания
- Проведения туров с мониторингом местоположения
- Автоматических уведомлений о нарушениях зон

---

## 🎯 Что было реализовано

### 1. Модели данных (tour/models.py)

| Модель | Описание |
|--------|----------|
| **TourGroup** | Группа туристов с уникальным кодом приглашения |
| **TourGroupMember** | Участник группы со статусами (pending/active/left/removed) |
| **TourZone** | Геозона тура с полигональной формой |
| **TourSession** | Сессия тура с таймером и статусами |
| **ZoneViolation** | Нарушение зоны участником |

### 2. API Endpoints

#### Группы (Tour Groups)
- `GET /tour/groups/` - список групп
- `POST /tour/groups/` - создать группу
- `GET /tour/groups/{id}/` - детали группы
- `PUT/PATCH /tour/groups/{id}/` - обновить группу
- `DELETE /tour/groups/{id}/` - удалить группу
- `POST /tour/groups/{id}/dismiss/` - распустить группу
- `GET /tour/groups/{id}/stats/` - статистика группы

#### Участники (Tour Members)
- `GET /tour/members/?group={id}` - список участников
- `POST /tour/members/` - добавить участника
- `POST /tour/members/{id}/accept/` - принять участника
- `POST /tour/members/{id}/remove/` - удалить участника
- `POST /tour/members/{id}/leave/` - покинуть группу
- `POST /tour/members/join_by_code/` - вступить по коду

#### Зоны (Tour Zones)
- `GET /tour/zones/?group={id}` - список зон
- `POST /tour/zones/` - создать зону (полигон)
- `GET /tour/zones/{id}/` - детали зоны
- `PUT/PATCH /tour/zones/{id}/` - обновить зону
- `DELETE /tour/zones/{id}/` - удалить зону

#### Сессии (Tour Sessions)
- `GET /tour/sessions/?group={id}` - список сессий
- `POST /tour/sessions/` - создать сессию
- `GET /tour/sessions/{id}/` - детали сессии
- `POST /tour/sessions/{id}/start/` - начать тур
- `POST /tour/sessions/{id}/complete/` - завершить тур
- `POST /tour/sessions/{id}/cancel/` - отменить тур
- `GET /tour/sessions/{id}/violations/` - нарушения за сессию

#### Местоположение
- `POST /tour/location/update/` - обновить местоположение
  - Автоматическая проверка нарушения зон
  - Отправка уведомлений агенту

#### Приглашения
- `GET /tour/invite/{code}/` - информация о группе по коду

### 3. Сервис геозон (tour/geofence_service.py)

Функции:
- `is_point_inside_polygon()` - проверка точки в полигоне (Shapely)
- `check_member_location()` - проверка местоположения участника
- `send_violation_notification()` - отправка push-уведомления агенту
- `check_all_members_locations()` - массовая проверка всех участников

### 4. Permissions (tour/permissions.py)

- `IsTourAgent` - только для тур-агентов
- `IsTourMember` - для участников группы
- `IsGroupAgent` - только агент группы

### 5. Тесты (tour/tests.py)

30 тестов покрывают:
- ✅ Модели (создание, валидация, связи)
- ✅ API (CRUD операции, permissions)
- ✅ Геозоны (проверка местоположения)
- ✅ Нарушения (уведомления)
- ✅ Приглашения (коды, ссылки)

**Все тесты проходят:**
```
Ran 30 tests in 0.347s
OK
```

### 6. Swagger документация

Доступна по адресу: `http://127.0.0.1:8000/docs/swagger/`

Секции:
- **Tour Groups** - управление группами
- **Tour Members** - управление участниками  
- **Tour Zones** - управление зонами
- **Tour Sessions** - управление сессиями
- **Tour Location** - обновление местоположения
- **Tour Invite** - приглашения

---

## 🚀 Как использовать

### 1. Создание группы и приглашение

```bash
# Тур-агент создает группу
curl -X POST http://127.0.0.1:8000/tour/groups/ \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"name": "Группа в горы", "description": "Поход"}'

# Ответ:
{
  "id": "uuid",
  "invite_code": "ABC123",
  "invite_link": "http://localhost:5173/tour/join/ABC123"
}
```

### 2. Вступление в группу

```bash
# Турист вступает по коду
curl -X POST http://127.0.0.1:8000/tour/members/join_by_code/ \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"invite_code": "ABC123"}'
```

### 3. Создание зоны

```bash
# Агент создает зону
curl -X POST http://127.0.0.1:8000/tour/zones/ \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "group": "uuid",
    "name": "Безопасная зона",
    "polygon": [
      {"lat": 42.87, "lng": 74.57},
      {"lat": 42.88, "lng": 74.57},
      {"lat": 42.88, "lng": 74.58},
      {"lat": 42.87, "lng": 74.58}
    ],
    "center_lat": 42.875,
    "center_lng": 74.575
  }'
```

### 4. Начало тура

```bash
# Агент начинает тур
curl -X POST http://127.0.0.1:8000/tour/sessions/ \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"group": "uuid", "duration_minutes": 90}'

# Старт тура
curl -X POST http://127.0.0.1:8000/tour/sessions/{session_id}/start/ \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"duration_minutes": 90}'
```

### 5. Обновление местоположения

```bash
# Турист обновляет местоположение
curl -X POST http://127.0.0.1:8000/tour/location/update/ \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"latitude": 42.875, "longitude": 74.575}'

# Если вышел из зоны - агент получает уведомление
```

---

## 📁 Структура файлов

```
sakbol_backend/tour/
├── __init__.py
├── admin.py              # Админ-панель для моделей
├── apps.py               # Конфигурация приложения
├── geofence_service.py   # Сервис геозон и уведомлений
├── migrations/
│   └── 0001_initial.py   # Миграции моделей
├── models.py             # Модели данных
├── permissions.py        # Permissions классы
├── serializers.py        # DRF serializers
├── tests.py              # Тесты (30 тестов)
├── urls.py               # URL routing
├── views.py              # ViewSet'ы и API views
└── README.md             # Документация
```

---

## 🔧 Конфигурация

### settings.py
```python
INSTALLED_APPS = [
    # ...
    'tour',  # Добавлено
]
```

### urls.py
```python
urlpatterns = [
    # ...
    path('tour/', include('tour.urls')),  # Добавлено
]
```

---

## 📊 Статистика реализации

| Компонент | Количество |
|-----------|------------|
| Моделей | 5 |
| API Endpoints | 25+ |
| Тестов | 30 |
| Serializer'ов | 10 |
| ViewSet'ов | 4 |
| Permissions | 3 |

---

## ✅ Проверка работы

### Запуск тестов
```bash
cd sakbol_backend
venv\Scripts\activate
python manage.py test tour
```

**Результат:**
```
Ran 30 tests in 0.347s
OK
```

### Проверка Swagger
```bash
python manage.py runserver
```

Открыть: `http://127.0.0.1:8000/docs/swagger/`

---

## 🎯 Ключевые особенности

1. **Автоматические уведомления** - при выходе из зоны агент получает push
2. **Полигональные зоны** - сложная форма через Shapely
3. **Групповые туры** - несколько участников в одной группе
4. **Коды приглашений** - 6-значные уникальные коды
5. **Статусы участников** - pending/active/left/removed
6. **Таймер тура** - отслеживание времени с начала
7. **Нарушения** - история всех выходов из зон
8. **Permissions** - разделение прав для агентов и туристов

---

## 📝 Дополнительные файлы

- `tour/README.md` - полная API документация
- `tour/tests.py` - тесты с примерами
- `schema.yml` - OpenAPI схема (генерируется)

---

## 🚧 Возможные улучшения

1. **Фоновые задачи** - Celery для периодической проверки местоположений
2. **История местоположений** - сохранение трека перемещений
3. **Чат группы** - общение между участниками
4. **Маршруты** - планирование пути тура
5. **Аналитика** - статистика по нарушениям и времени
