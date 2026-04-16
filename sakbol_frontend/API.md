GET
/tour/groups/
Список групп турагента


Получение списка всех групп, созданных текущим тур-агентом.

Parameters
Try it out
Name	Description
page
integer
(query)
A page number within the paginated result set.

page
Responses
Code	Description	Links
200	
Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "count": 123,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "agent": {
        "user": {
          "id": 0,
          "email": "user@example.com"
        },
        "first_name": "string",
        "last_name": "string",
        "identifier": "string",
        "avatar": "string"
      },
      "name": "string",
      "description": "string",
      "invite_code": "string",
      "invite_link": "string",
      "is_active": true,
      "created_at": "2026-04-09T00:24:38.485Z",
      "updated_at": "2026-04-09T00:24:38.485Z",
      "active_members_count": "string",
      "pending_members_count": "string",
      "zones_count": "string",
      "has_active_session": "string"
    }
  ]
}
No links

POST
/tour/groups/
Создать группу


Создание новой группы для туристов. Только для тур-агентов.

Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "name": "string",
  "description": "string"
}
Responses
Code	Description	Links
201	
Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "name": "string",
  "description": "string"
}
No links

GET
/tour/groups/{id}/
Детали группы


Получение подробной информации о группе.

Parameters
Try it out
Name	Description
id *
string
(path)
id
Responses
Code	Description	Links
200	
Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "agent": {
    "user": {
      "id": 0,
      "email": "user@example.com"
    },
    "first_name": "string",
    "last_name": "string",
    "identifier": "string",
    "avatar": "string"
  },
  "name": "string",
  "description": "string",
  "invite_code": "string",
  "invite_link": "string",
  "is_active": true,
  "created_at": "2026-04-09T00:24:38.488Z",
  "updated_at": "2026-04-09T00:24:38.488Z",
  "members": [
    {
      "id": 0,
      "user": {
        "user": {
          "id": 0,
          "email": "user@example.com"
        },
        "first_name": "string",
        "last_name": "string",
        "identifier": "string",
        "avatar": "string"
      },
      "status": "pending",
      "joined_at": "2026-04-09T00:24:38.488Z",
      "left_at": "2026-04-09T00:24:38.488Z"
    }
  ],
  "zones": [
    {
      "id": 0,
      "name": "string",
      "description": "string",
      "is_active": true,
      "created_at": "2026-04-09T00:24:38.488Z"
    }
  ],
  "active_session": {
    "id": 0,
    "group": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "group_name": "string",
    "status": "draft",
    "started_at": "2026-04-09T00:24:38.488Z",
    "ended_at": "2026-04-09T00:24:38.488Z",
    "duration_minutes": 9223372036854776000,
    "created_at": "2026-04-09T00:24:38.488Z",
    "elapsed_minutes": "string",
    "remaining_minutes": "string"
  }
}
No links

PUT
/tour/groups/{id}/
Обновить группу


Обновление информации о группе.

Parameters
Try it out
Name	Description
id *
string
(path)
id
Request body

application/json
Example Value
Schema
{
  "name": "string",
  "description": "string",
  "is_active": true
}
Responses
Code	Description	Links
200	
Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "agent": {
    "user": {
      "id": 0,
      "email": "user@example.com"
    },
    "first_name": "string",
    "last_name": "string",
    "identifier": "string",
    "avatar": "string"
  },
  "name": "string",
  "description": "string",
  "invite_code": "string",
  "invite_link": "string",
  "is_active": true,
  "created_at": "2026-04-09T00:24:38.491Z",
  "updated_at": "2026-04-09T00:24:38.491Z",
  "active_members_count": "string",
  "pending_members_count": "string",
  "zones_count": "string",
  "has_active_session": "string"
}
No links

PATCH
/tour/groups/{id}/
Частичное обновление группы


Частичное обновление информации о группе.

Parameters
Try it out
Name	Description
id *
string
(path)
id
Request body

application/json
Example Value
Schema
{
  "name": "string",
  "description": "string",
  "is_active": true
}
Responses
Code	Description	Links
200	
Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "agent": {
    "user": {
      "id": 0,
      "email": "user@example.com"
    },
    "first_name": "string",
    "last_name": "string",
    "identifier": "string",
    "avatar": "string"
  },
  "name": "string",
  "description": "string",
  "invite_code": "string",
  "invite_link": "string",
  "is_active": true,
  "created_at": "2026-04-09T00:24:38.493Z",
  "updated_at": "2026-04-09T00:24:38.493Z",
  "active_members_count": "string",
  "pending_members_count": "string",
  "zones_count": "string",
  "has_active_session": "string"
}
No links

DELETE
/tour/groups/{id}/
Удалить группу


Удаление группы (распускает группу).

Parameters
Try it out
Name	Description
id *
string
(path)
id
Responses
Code	Description	Links
204	
No response body

No links

POST
/tour/groups/{id}/dismiss/


Распустить группу

Parameters
Try it out
Name	Description
id *
string
(path)
id
Request body

application/json
Example Value
Schema
{
  "name": "string",
  "description": "string",
  "is_active": true
}
Responses
Code	Description	Links
200	
Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "agent": {
    "user": {
      "id": 0,
      "email": "user@example.com"
    },
    "first_name": "string",
    "last_name": "string",
    "identifier": "string",
    "avatar": "string"
  },
  "name": "string",
  "description": "string",
  "invite_code": "string",
  "invite_link": "string",
  "is_active": true,
  "created_at": "2026-04-09T00:24:38.496Z",
  "updated_at": "2026-04-09T00:24:38.496Z",
  "active_members_count": "string",
  "pending_members_count": "string",
  "zones_count": "string",
  "has_active_session": "string"
}
No links

GET
/tour/groups/{id}/members_locations/


Получить местоположения всех участников группы

Parameters
Try it out
Name	Description
id *
string
(path)
id
Responses
Code	Description	Links
200	
Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "agent": {
    "user": {
      "id": 0,
      "email": "user@example.com"
    },
    "first_name": "string",
    "last_name": "string",
    "identifier": "string",
    "avatar": "string"
  },
  "name": "string",
  "description": "string",
  "invite_code": "string",
  "invite_link": "string",
  "is_active": true,
  "created_at": "2026-04-09T00:24:38.498Z",
  "updated_at": "2026-04-09T00:24:38.498Z",
  "active_members_count": "string",
  "pending_members_count": "string",
  "zones_count": "string",
  "has_active_session": "string"
}
No links

GET
/tour/groups/{id}/stats/


Статистика группы

Parameters
Try it out
Name	Description
id *
string
(path)
id
Responses
Code	Description	Links
200	
Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "agent": {
    "user": {
      "id": 0,
      "email": "user@example.com"
    },
    "first_name": "string",
    "last_name": "string",
    "identifier": "string",
    "avatar": "string"
  },
  "name": "string",
  "description": "string",
  "invite_code": "string",
  "invite_link": "string",
  "is_active": true,
  "created_at": "2026-04-09T00:24:38.499Z",
  "updated_at": "2026-04-09T00:24:38.499Z",
  "active_members_count": "string",
  "pending_members_count": "string",
  "zones_count": "string",
  "has_active_session": "string"
}
No links

GET
/tour/invite/{invite_code}/
Информация о группе по коду


Получение информации о группе для вступления.

Parameters
Try it out
Name	Description
invite_code *
string
(path)
invite_code
Responses
Code	Description	Links
200	
Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "agent": {
    "user": {
      "id": 0,
      "email": "user@example.com"
    },
    "first_name": "string",
    "last_name": "string",
    "identifier": "string",
    "avatar": "string"
  },
  "name": "string",
  "description": "string",
  "invite_code": "string",
  "invite_link": "string",
  "is_active": true,
  "created_at": "2026-04-09T00:24:38.502Z",
  "updated_at": "2026-04-09T00:24:38.502Z",
  "members": [
    {
      "id": 0,
      "user": {
        "user": {
          "id": 0,
          "email": "user@example.com"
        },
        "first_name": "string",
        "last_name": "string",
        "identifier": "string",
        "avatar": "string"
      },
      "status": "pending",
      "joined_at": "2026-04-09T00:24:38.502Z",
      "left_at": "2026-04-09T00:24:38.502Z"
    }
  ],
  "zones": [
    {
      "id": 0,
      "name": "string",
      "description": "string",
      "is_active": true,
      "created_at": "2026-04-09T00:24:38.502Z"
    }
  ],
  "active_session": {
    "id": 0,
    "group": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "group_name": "string",
    "status": "draft",
    "started_at": "2026-04-09T00:24:38.502Z",
    "ended_at": "2026-04-09T00:24:38.502Z",
    "duration_minutes": 9223372036854776000,
    "created_at": "2026-04-09T00:24:38.502Z",
    "elapsed_minutes": "string",
    "remaining_minutes": "string"
  }
}
No links
404	
Media type

application/json
Example Value
Schema
{
  "detail": "string"
}
No links

POST
/tour/location/update/
Обновить местоположение


Обновление местоположения участника тура. Автоматически проверяет нарушение зон и отправляет уведомления.

Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "latitude": 0,
  "longitude": 0
}
Responses
Code	Description	Links
200	
Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "status": "string"
}
No links
400	
Media type

application/json
Example Value
Schema
{
  "detail": "string"
}
No links

GET
/tour/members/
Список участников


Получение списка участников группы.

Parameters
Try it out
Name	Description
page
integer
(query)
A page number within the paginated result set.

page
Responses
Code	Description	Links
200	
Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "count": 123,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    {
      "id": 0,
      "user": {
        "user": {
          "id": 0,
          "email": "user@example.com"
        },
        "first_name": "string",
        "last_name": "string",
        "identifier": "string",
        "avatar": "string"
      },
      "status": "pending",
      "joined_at": "2026-04-09T00:24:38.509Z",
      "left_at": "2026-04-09T00:24:38.509Z"
    }
  ]
}
No links

POST
/tour/members/
Добавить участника


Добавление участника в группу (только агент).

Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "user_id": 0,
  "status": "pending"
}
Responses
Code	Description	Links
201	
Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "id": 0,
  "user": {
    "user": {
      "id": 0,
      "email": "user@example.com"
    },
    "first_name": "string",
    "last_name": "string",
    "identifier": "string",
    "avatar": "string"
  },
  "group": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "pending",
  "joined_at": "2026-04-09T00:24:38.511Z",
  "left_at": "2026-04-09T00:24:38.511Z"
}
No links

GET
/tour/members/{id}/
Детали участника


Получение информации об участнике.

Parameters
Try it out
Name	Description
id *
string
(path)
id
Responses
Code	Description	Links
200	
Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "id": 0,
  "user": {
    "user": {
      "id": 0,
      "email": "user@example.com"
    },
    "first_name": "string",
    "last_name": "string",
    "identifier": "string",
    "avatar": "string"
  },
  "group": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "pending",
  "joined_at": "2026-04-09T00:24:38.512Z",
  "left_at": "2026-04-09T00:24:38.512Z"
}
No links

PUT
/tour/members/{id}/


CRUD для участников группы.

Parameters
Try it out
Name	Description
id *
string
(path)
id
Request body

application/json
Example Value
Schema
{
  "user_id": 0,
  "status": "pending"
}
Responses
Code	Description	Links
200	
Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "id": 0,
  "user": {
    "user": {
      "id": 0,
      "email": "user@example.com"
    },
    "first_name": "string",
    "last_name": "string",
    "identifier": "string",
    "avatar": "string"
  },
  "group": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "pending",
  "joined_at": "2026-04-09T00:24:38.513Z",
  "left_at": "2026-04-09T00:24:38.513Z"
}
No links

PATCH
/tour/members/{id}/


CRUD для участников группы.

Parameters
Try it out
Name	Description
id *
string
(path)
id
Request body

application/json
Example Value
Schema
{
  "user_id": 0,
  "status": "pending"
}
Responses
Code	Description	Links
200	
Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "id": 0,
  "user": {
    "user": {
      "id": 0,
      "email": "user@example.com"
    },
    "first_name": "string",
    "last_name": "string",
    "identifier": "string",
    "avatar": "string"
  },
  "group": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "pending",
  "joined_at": "2026-04-09T00:24:38.515Z",
  "left_at": "2026-04-09T00:24:38.515Z"
}
No links

DELETE
/tour/members/{id}/


CRUD для участников группы.

Parameters
Try it out
Name	Description
id *
string
(path)
id
Responses
Code	Description	Links
204	
No response body

No links

POST
/tour/members/{id}/accept/


Принять участника (только агент)

Parameters
Try it out
Name	Description
id *
string
(path)
id
Request body

application/json
Example Value
Schema
{
  "user_id": 0,
  "status": "pending"
}
Responses
Code	Description	Links
200	
Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "id": 0,
  "user": {
    "user": {
      "id": 0,
      "email": "user@example.com"
    },
    "first_name": "string",
    "last_name": "string",
    "identifier": "string",
    "avatar": "string"
  },
  "group": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "pending",
  "joined_at": "2026-04-09T00:24:38.517Z",
  "left_at": "2026-04-09T00:24:38.517Z"
}
No links

POST
/tour/members/{id}/leave/


Покинуть группу

Parameters
Try it out
Name	Description
id *
string
(path)
id
Request body

application/json
Example Value
Schema
{
  "user_id": 0,
  "status": "pending"
}
Responses
Code	Description	Links
200	
Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "id": 0,
  "user": {
    "user": {
      "id": 0,
      "email": "user@example.com"
    },
    "first_name": "string",
    "last_name": "string",
    "identifier": "string",
    "avatar": "string"
  },
  "group": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "pending",
  "joined_at": "2026-04-09T00:24:38.519Z",
  "left_at": "2026-04-09T00:24:38.519Z"
}
No links

POST
/tour/members/{id}/remove/


Удалить участника из группы

Parameters
Try it out
Name	Description
id *
string
(path)
id
Request body

application/json
Example Value
Schema
{
  "user_id": 0,
  "status": "pending"
}
Responses
Code	Description	Links
200	
Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "id": 0,
  "user": {
    "user": {
      "id": 0,
      "email": "user@example.com"
    },
    "first_name": "string",
    "last_name": "string",
    "identifier": "string",
    "avatar": "string"
  },
  "group": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "pending",
  "joined_at": "2026-04-09T00:24:38.520Z",
  "left_at": "2026-04-09T00:24:38.520Z"
}
No links

POST
/tour/members/join_by_code/


Вступить в группу по коду приглашения

Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "user_id": 0,
  "status": "pending"
}
Responses
Code	Description	Links
200	
Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "id": 0,
  "user": {
    "user": {
      "id": 0,
      "email": "user@example.com"
    },
    "first_name": "string",
    "last_name": "string",
    "identifier": "string",
    "avatar": "string"
  },
  "group": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "pending",
  "joined_at": "2026-04-09T00:24:38.522Z",
  "left_at": "2026-04-09T00:24:38.522Z"
}
No links

GET
/tour/sessions/
Список сессий


Получение списка сессий группы.

Parameters
Try it out
Name	Description
page
integer
(query)
A page number within the paginated result set.

page
Responses
Code	Description	Links
200	
Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "count": 123,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    {
      "id": 0,
      "group": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "group_name": "string",
      "status": "draft",
      "started_at": "2026-04-09T00:24:38.523Z",
      "ended_at": "2026-04-09T00:24:38.523Z",
      "duration_minutes": 9223372036854776000,
      "created_at": "2026-04-09T00:24:38.523Z",
      "elapsed_minutes": "string",
      "remaining_minutes": "string"
    }
  ]
}
No links

POST
/tour/sessions/
Создать сессию


Создание новой сессии тура. Только для тур-агента.

Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "group": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "draft",
  "duration_minutes": 9223372036854776000
}
Responses
Code	Description	Links
201	
Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "id": 0,
  "group": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "group_name": "string",
  "status": "draft",
  "started_at": "2026-04-09T00:24:38.525Z",
  "ended_at": "2026-04-09T00:24:38.525Z",
  "duration_minutes": 9223372036854776000,
  "created_at": "2026-04-09T00:24:38.525Z",
  "elapsed_minutes": "string",
  "remaining_minutes": "string"
}
No links

GET
/tour/sessions/{id}/
Детали сессии


Получение информации о сессии.

Parameters
Try it out
Name	Description
id *
string
(path)
id
Responses
Code	Description	Links
200	
Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "id": 0,
  "group": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "group_name": "string",
  "status": "draft",
  "started_at": "2026-04-09T00:24:38.526Z",
  "ended_at": "2026-04-09T00:24:38.526Z",
  "duration_minutes": 0,
  "created_at": "2026-04-09T00:24:38.526Z",
  "zones": [
    {
      "id": 0,
      "name": "string",
      "description": "string",
      "is_active": true,
      "created_at": "2026-04-09T00:24:38.526Z"
    }
  ],
  "members_count": "string",
  "violations_count": "string",
  "elapsed_minutes": "string",
  "remaining_minutes": "string"
}
No links

PUT
/tour/sessions/{id}/


CRUD для сессий тура.

Parameters
Try it out
Name	Description
id *
string
(path)
id
Request body

application/json
Example Value
Schema
{
  "group": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "draft",
  "duration_minutes": 9223372036854776000
}
Responses
Code	Description	Links
200	
Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "id": 0,
  "group": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "group_name": "string",
  "status": "draft",
  "started_at": "2026-04-09T00:24:38.528Z",
  "ended_at": "2026-04-09T00:24:38.528Z",
  "duration_minutes": 9223372036854776000,
  "created_at": "2026-04-09T00:24:38.528Z",
  "elapsed_minutes": "string",
  "remaining_minutes": "string"
}
No links

PATCH
/tour/sessions/{id}/


CRUD для сессий тура.

Parameters
Try it out
Name	Description
id *
string
(path)
id
Request body

application/json
Example Value
Schema
{
  "group": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "draft",
  "duration_minutes": 9223372036854776000
}
Responses
Code	Description	Links
200	
Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "id": 0,
  "group": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "group_name": "string",
  "status": "draft",
  "started_at": "2026-04-09T00:24:38.529Z",
  "ended_at": "2026-04-09T00:24:38.529Z",
  "duration_minutes": 9223372036854776000,
  "created_at": "2026-04-09T00:24:38.529Z",
  "elapsed_minutes": "string",
  "remaining_minutes": "string"
}
No links

DELETE
/tour/sessions/{id}/


CRUD для сессий тура.

Parameters
Try it out
Name	Description
id *
string
(path)
id
Responses
Code	Description	Links
204	
No response body

No links

POST
/tour/sessions/{id}/cancel/


Отменить тур

Parameters
Try it out
Name	Description
id *
string
(path)
id
Request body

application/json
Example Value
Schema
{
  "group": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "draft",
  "duration_minutes": 9223372036854776000
}
Responses
Code	Description	Links
200	
Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "id": 0,
  "group": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "group_name": "string",
  "status": "draft",
  "started_at": "2026-04-09T00:24:38.531Z",
  "ended_at": "2026-04-09T00:24:38.531Z",
  "duration_minutes": 9223372036854776000,
  "created_at": "2026-04-09T00:24:38.531Z",
  "elapsed_minutes": "string",
  "remaining_minutes": "string"
}
No links

POST
/tour/sessions/{id}/complete/


Завершить тур

Parameters
Try it out
Name	Description
id *
string
(path)
id
Request body

application/json
Example Value
Schema
{
  "group": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "draft",
  "duration_minutes": 9223372036854776000
}
Responses
Code	Description	Links
200	
Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "id": 0,
  "group": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "group_name": "string",
  "status": "draft",
  "started_at": "2026-04-09T00:24:38.533Z",
  "ended_at": "2026-04-09T00:24:38.533Z",
  "duration_minutes": 9223372036854776000,
  "created_at": "2026-04-09T00:24:38.533Z",
  "elapsed_minutes": "string",
  "remaining_minutes": "string"
}
No links

POST
/tour/sessions/{id}/start/


Начать тур

Parameters
Try it out
Name	Description
id *
string
(path)
id
Request body

application/json
Example Value
Schema
{
  "group": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "draft",
  "duration_minutes": 9223372036854776000
}
Responses
Code	Description	Links
200	
Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "id": 0,
  "group": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "group_name": "string",
  "status": "draft",
  "started_at": "2026-04-09T00:24:38.534Z",
  "ended_at": "2026-04-09T00:24:38.534Z",
  "duration_minutes": 9223372036854776000,
  "created_at": "2026-04-09T00:24:38.534Z",
  "elapsed_minutes": "string",
  "remaining_minutes": "string"
}
No links

GET
/tour/sessions/{id}/violations/


Получить нарушения за сессию

Parameters
Try it out
Name	Description
id *
string
(path)
id
Responses
Code	Description	Links
200	
Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "id": 0,
  "group": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "group_name": "string",
  "status": "draft",
  "started_at": "2026-04-09T00:24:38.535Z",
  "ended_at": "2026-04-09T00:24:38.535Z",
  "duration_minutes": 9223372036854776000,
  "created_at": "2026-04-09T00:24:38.535Z",
  "elapsed_minutes": "string",
  "remaining_minutes": "string"
}
No links

GET
/tour/zones/
Список зон


Получение списка зон группы.

Parameters
Try it out
Name	Description
page
integer
(query)
A page number within the paginated result set.

page
Responses
Code	Description	Links
200	
Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "count": 123,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    {
      "id": 0,
      "name": "string",
      "description": "string",
      "is_active": true,
      "created_at": "2026-04-09T00:24:38.537Z"
    }
  ]
}
No links

POST
/tour/zones/
Создать зону


Создание новой зоны для группы. Только для тур-агента.

Parameters
Try it out
No parameters

Request body

application/json
Example Value
Schema
{
  "name": "string",
  "description": "string",
  "polygon": "string",
  "center_lat": "-020.",
  "center_lng": "3.653",
  "is_active": true
}
Responses
Code	Description	Links
201	
Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "id": 0,
  "group": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "name": "string",
  "description": "string",
  "polygon": "string",
  "center_lat": "6",
  "center_lng": "1",
  "is_active": true,
  "created_at": "2026-04-09T00:24:38.538Z"
}
No links

GET
/tour/zones/{id}/
Детали зоны


Получение информации о зоне.

Parameters
Try it out
Name	Description
id *
string
(path)
id
Responses
Code	Description	Links
200	
Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "id": 0,
  "group": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "name": "string",
  "description": "string",
  "polygon": "string",
  "center_lat": "",
  "center_lng": "19.98",
  "is_active": true,
  "created_at": "2026-04-09T00:24:38.539Z"
}
No links

PUT
/tour/zones/{id}/
Обновить зону


Обновление зоны.

Parameters
Try it out
Name	Description
id *
string
(path)
id
Request body

application/json
Example Value
Schema
{
  "name": "string",
  "description": "string",
  "polygon": "string",
  "center_lat": "",
  "center_lng": "51",
  "is_active": true
}
Responses
Code	Description	Links
200	
Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "id": 0,
  "group": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "name": "string",
  "description": "string",
  "polygon": "string",
  "center_lat": "623.85152",
  "center_lng": "83",
  "is_active": true,
  "created_at": "2026-04-09T00:24:38.541Z"
}
No links

PATCH
/tour/zones/{id}/
Частичное обновление зоны


Частичное обновление зоны.

Parameters
Try it out
Name	Description
id *
string
(path)
id
Request body

application/json
Example Value
Schema
{
  "name": "string",
  "description": "string",
  "polygon": "string",
  "center_lat": "15",
  "center_lng": "344.",
  "is_active": true
}
Responses
Code	Description	Links
200	
Media type

application/json
Controls Accept header.
Example Value
Schema
{
  "id": 0,
  "group": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "name": "string",
  "description": "string",
  "polygon": "string",
  "center_lat": "-89.984864",
  "center_lng": "8.142763",
  "is_active": true,
  "created_at": "2026-04-09T00:24:38.543Z"
}
No links

DELETE
/tour/zones/{id}/
Удалить зону


Удаление зоны.

Parameters
Try it out
Name	Description
id *
string
(path)
id
Responses