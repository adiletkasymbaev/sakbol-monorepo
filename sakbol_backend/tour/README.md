# Tour API Документация

## Обзор

Модуль для управления туристическими группами, зонами и сессиями. Тур-агенты могут создавать группы, приглашать туристов, определять геозоны и отслеживать участников во время тура.

## Модели

### TourGroup (Группа туристов)
- **agent** - тур-агент (владелец группы)
- **name** - название группы
- **description** - описание
- **invite_code** - 6-значный код для приглашения
- **is_active** - активна ли группа

### TourGroupMember (Участник группы)
- **group** - ссылка на группу
- **user** - пользователь (турист)
- **status** - pending/active/left/removed
- **joined_at** - дата вступления
- **left_at** - дата выхода

### TourZone (Зона тура)
- **group** - ссылка на группу
- **name** - название зоны
- **polygon** - массив точек [{lat, lng}, ...]
- **center_lat, center_lng** - координаты центра
- **is_active** - активна ли зона

### TourSession (Сессия тура)
- **group** - ссылка на группу
- **status** - draft/active/completed/cancelled
- **started_at** - время начала
- **ended_at** - время завершения
- **duration_minutes** - планируемая длительность

### ZoneViolation (Нарушение зоны)
- **session** - сессия тура
- **member** - участник
- **zone** - зона
- **latitude, longitude** - координаты нарушения
- **is_resolved** - решено ли

---

## API Endpoints

### Группы (Tour Groups)

#### `GET /tour/groups/`
Получить список групп
- **Tour-агент**: видит все свои группы
- **Турист**: видит группы, в которых состоит

#### `POST /tour/groups/`
Создать новую группу
```json
{
  "name": "Группа в горы",
  "description": "Поход в горы"
}
```
**Permissions**: Только TOUR_AGENCY

#### `GET /tour/groups/{id}/`
Получить детали группы с участниками и зонами

#### `PUT/PATCH /tour/groups/{id}/`
Обновить группу

#### `DELETE /tour/groups/{id}/`
Удалить группу

#### `POST /tour/groups/{id}/dismiss/`
Распустить группу
- Помечает группу как неактивную
- Все участники помечаются как "left"
- Активные сессии завершаются

#### `GET /tour/groups/{id}/stats/`
Статистика группы
```json
{
  "total_members": 10,
  "active_members": 8,
  "pending_members": 2,
  "total_zones": 3,
  "active_zones": 3,
  "total_sessions": 5,
  "active_sessions": 1,
  "total_violations": 2,
  "unresolved_violations": 1
}
```

---

### Участники (Tour Members)

#### `GET /tour/members/?group={group_id}`
Получить список участников группы

#### `POST /tour/members/`
Добавить участника (только агент)
```json
{
  "user_id": 123
}
```

#### `GET /tour/members/{id}/`
Получить детали участника

#### `POST /tour/members/{id}/accept/`
Принять участника в группу
**Permissions**: Только агент группы

#### `POST /tour/members/{id}/remove/`
Удалить участника из группы
**Permissions**: Агент группы или сам участник

#### `POST /tour/members/{id}/leave/`
Покинуть группу
**Permissions**: Только сам участник

#### `POST /tour/members/join_by_code/`
Вступить в группу по коду приглашения
```json
{
  "invite_code": "ABC123"
}
```
**Permissions**: Только TOURIST/USER

---

### Зоны (Tour Zones)

#### `GET /tour/zones/?group={group_id}`
Получить список зон группы

#### `POST /tour/zones/`
Создать новую зону
```json
{
  "group": "uuid-group-id",
  "name": "Безопасная зона",
  "description": "Зона вокруг отеля",
  "polygon": [
    {"lat": 42.87, "lng": 74.57},
    {"lat": 42.88, "lng": 74.57},
    {"lat": 42.88, "lng": 74.58},
    {"lat": 42.87, "lng": 74.58}
  ],
  "center_lat": 42.875,
  "center_lng": 74.575
}
```
**Permissions**: Только TOUR_AGENCY

**Валидация polygon**:
- Минимум 3 точки
- Каждая точка: `{"lat": number, "lng": number}`

#### `GET /tour/zones/{id}/`
Получить детали зоны

#### `PUT/PATCH /tour/zones/{id}/`
Обновить зону

#### `DELETE /tour/zones/{id}/`
Удалить зону

---

### Сессии (Tour Sessions)

#### `GET /tour/sessions/?group={group_id}`
Получить список сессий группы

#### `POST /tour/sessions/`
Создать сессию тура
```json
{
  "group": "uuid-group-id",
  "duration_minutes": 90
}
```
**Permissions**: Только TOUR_AGENCY

#### `GET /tour/sessions/{id}/`
Получить детали сессии с зонами и статистикой

#### `POST /tour/sessions/{id}/start/`
Начать тур
```json
{
  "duration_minutes": 90
}
```
После начала:
- Статус меняется на "active"
- Запускается отслеживание участников
- При выходе из зоны отправляются уведомления

#### `POST /tour/sessions/{id}/complete/`
Завершить тур
- Статус меняется на "completed"

#### `POST /tour/sessions/{id}/cancel/`
Отменить тур
- Статус меняется на "cancelled"

#### `GET /tour/sessions/{id}/violations/`
Получить все нарушения за сессию

---

### Местоположение (Location)

#### `POST /tour/location/update/`
Обновить местоположение участника
```json
{
  "latitude": 42.875,
  "longitude": 74.575
}
```

**Автоматическая проверка**:
- Проверяет, находится ли участник в активной зоне
- Если вышел за пределы - создается ZoneViolation
- Тур-агент получает push-уведомление

**Permissions**: Authenticated

---

### Приглашения (Invites)

#### `GET /tour/invite/{invite_code}/`
Получить информацию о группе по коду приглашения

**Permissions**: AllowAny (для неавторизованных тоже)

---

## Поток работы

### 1. Создание группы и приглашение участников

```
1. Тур-агент создает группу: POST /tour/groups/
2. Получает invite_code и invite_link
3. Отправляет ссылку туристам
4. Туристы вступают: POST /tour/members/join_by_code/
5. Агент принимает участников: POST /tour/members/{id}/accept/
```

### 2. Создание зон

```
1. Агент создает зоны: POST /tour/zones/
2. Указывает полигон (минимум 3 точки)
3. Зоны привязываются к группе
```

### 3. Начало тура

```
1. Агент начинает тур: POST /tour/sessions/{id}/start/
2. Статус меняется на "active"
3. Участники обновляют местоположение: POST /tour/location/update/
4. Система проверяет нарушение зон
5. При нарушении - уведомление агенту
```

### 4. Завершение

```
1. Агент завершает тур: POST /tour/sessions/{id}/complete/
2. Или распускает группу: POST /tour/groups/{id}/dismiss/
```

---

## Уведомления

### Push-уведомления при нарушении зоны

Отправляются тур-агенту когда:
- Участник выходит из активной зоны
- Во время активной сессии тура

**Данные уведомления**:
```json
{
  "type": "zone_violation",
  "session_id": "uuid",
  "member_id": "uuid",
  "zone_id": "uuid",
  "group_id": "uuid"
}
```

---

## Примеры использования

### Python (requests)

```python
import requests

BASE_URL = 'http://127.0.0.1:8000/tour'

# Авторизация
token = 'your-jwt-token'
headers = {'Authorization': f'Bearer {token}'}

# Создание группы
response = requests.post(
    f'{BASE_URL}/groups/',
    json={'name': 'Группа в горы'},
    headers=headers
)
group = response.json()

# Создание зоны
zone_data = {
    'group': group['id'],
    'name': 'Безопасная зона',
    'polygon': [
        {'lat': 42.87, 'lng': 74.57},
        {'lat': 42.88, 'lng': 74.57},
        {'lat': 42.88, 'lng': 74.58},
        {'lat': 42.87, 'lng': 74.58}
    ],
    'center_lat': 42.875,
    'center_lng': 74.575
}
response = requests.post(
    f'{BASE_URL}/zones/',
    json=zone_data,
    headers=headers
)

# Начало тура
session_data = {'group': group['id'], 'duration_minutes': 60}
response = requests.post(f'{BASE_URL}/sessions/', json=session_data, headers=headers)
session = response.json()

# Старт тура
requests.post(f"{BASE_URL}/sessions/{session['id']}/start/", headers=headers)

# Обновление местоположения (турист)
location_data = {'latitude': 42.875, 'longitude': 74.575}
requests.post(f'{BASE_URL}/location/update/', json=location_data, headers=tourist_headers)
```

---

## Swagger документация

Полная документация доступна по адресу:
- **Swagger UI**: `http://127.0.0.1:8000/docs/swagger/`
- **ReDoc**: `http://127.0.0.1:8000/docs/redoc/`

Ищите секции:
- **Tour Groups** - управление группами
- **Tour Members** - управление участниками
- **Tour Zones** - управление зонами
- **Tour Sessions** - управление сессиями
- **Tour Location** - обновление местоположения
