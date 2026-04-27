from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.utils import timezone

from .models import TourGroup, TourGroupMember, TourZone, TourSession, ZoneViolation, MemberStatus, TourStatus
from sos.models import Location

User = get_user_model()


class TourGroupModelTest(TestCase):
    """Тесты для модели TourGroup"""

    def setUp(self):
        self.agent = User.objects.create(
            email='agent@test.com',
            role='tour_agency'
        )
        self.group = TourGroup.objects.create(
            agent=self.agent,
            name='Test Group'
        )

    def test_create_group(self):
        """Создание группы"""
        self.assertEqual(self.group.name, 'Test Group')
        self.assertIsNotNone(self.group.invite_code)
        self.assertEqual(len(self.group.invite_code), 6)
        self.assertTrue(self.group.is_active)

    def test_invite_code_unique(self):
        """Уникальность кода приглашения"""
        group2 = TourGroup.objects.create(
            agent=self.agent,
            name='Another Group'
        )
        self.assertNotEqual(self.group.invite_code, group2.invite_code)

    def test_invite_link_generation(self):
        """Генерация ссылки приглашения"""
        link = self.group.get_invite_link()
        self.assertIn(self.group.invite_code, link)


class TourGroupMemberModelTest(TestCase):
    """Тесты для модели TourGroupMember"""

    def setUp(self):
        self.agent = User.objects.create(
            email='agent@test.com',
            role='tour_agency'
        )
        self.tourist = User.objects.create(
            email='tourist@test.com',
            role='tourist'
        )
        self.group = TourGroup.objects.create(
            agent=self.agent,
            name='Test Group'
        )

    def test_join_group(self):
        """Вступление в группу"""
        member = TourGroupMember.objects.create(
            group=self.group,
            user=self.tourist,
            status=MemberStatus.PENDING
        )
        self.assertEqual(member.status, MemberStatus.PENDING)
        self.assertEqual(member.group, self.group)
        self.assertEqual(member.user, self.tourist)

    def test_accept_membership(self):
        """Принятие в группу"""
        member = TourGroupMember.objects.create(
            group=self.group,
            user=self.tourist,
            status=MemberStatus.PENDING
        )
        member.accept_membership()
        self.assertEqual(member.status, MemberStatus.ACTIVE)

    def test_leave_group(self):
        """Выход из группы"""
        member = TourGroupMember.objects.create(
            group=self.group,
            user=self.tourist,
            status=MemberStatus.ACTIVE
        )
        member.leave_group()
        self.assertEqual(member.status, MemberStatus.LEFT)
        self.assertIsNotNone(member.left_at)

    def test_unique_membership(self):
        """Уникальность членства"""
        TourGroupMember.objects.create(
            group=self.group,
            user=self.tourist,
            status=MemberStatus.PENDING
        )
        with self.assertRaises(Exception):
            TourGroupMember.objects.create(
                group=self.group,
                user=self.tourist,
                status=MemberStatus.PENDING
            )


class TourZoneModelTest(TestCase):
    """Тесты для модели TourZone"""

    def setUp(self):
        self.agent = User.objects.create(
            email='agent@test.com',
            role='tour_agency'
        )
        self.group = TourGroup.objects.create(
            agent=self.agent,
            name='Test Group'
        )
        self.zone = TourZone.objects.create(
            group=self.group,
            name='Test Zone',
            polygon=[
                {'lat': 42.87, 'lng': 74.57},
                {'lat': 42.88, 'lng': 74.57},
                {'lat': 42.88, 'lng': 74.58},
                {'lat': 42.87, 'lng': 74.58},
            ],
            center_lat=42.875,
            center_lng=74.575
        )

    def test_create_zone(self):
        """Создание зоны"""
        self.assertEqual(self.zone.name, 'Test Zone')
        self.assertEqual(self.zone.group, self.group)
        self.assertTrue(self.zone.is_active)
        self.assertEqual(len(self.zone.polygon), 4)


class TourSessionModelTest(TestCase):
    """Тесты для модели TourSession"""

    def setUp(self):
        self.agent = User.objects.create(
            email='agent@test.com',
            role='tour_agency'
        )
        self.group = TourGroup.objects.create(
            agent=self.agent,
            name='Test Group'
        )
        self.session = TourSession.objects.create(
            group=self.group,
            status=TourStatus.DRAFT,
            duration_minutes=60
        )

    def test_start_tour(self):
        """Начало тура"""
        self.session.start_tour()
        self.assertEqual(self.session.status, TourStatus.ACTIVE)
        self.assertIsNotNone(self.session.started_at)

    def test_complete_tour(self):
        """Завершение тура"""
        self.session.start_tour()
        self.session.complete_tour()
        self.assertEqual(self.session.status, TourStatus.COMPLETED)
        self.assertIsNotNone(self.session.ended_at)

    def test_cancel_tour(self):
        """Отмена тура"""
        self.session.cancel_tour()
        self.assertEqual(self.session.status, TourStatus.CANCELLED)
        self.assertIsNotNone(self.session.ended_at)

    def test_elapsed_minutes(self):
        """Подсчет прошедшего времени"""
        self.session.start_tour()
        elapsed = self.session.get_elapsed_minutes()
        self.assertGreaterEqual(elapsed, 0)

    def test_remaining_minutes(self):
        """Подсчет оставшегося времени"""
        self.session.start_tour()
        remaining = self.session.get_remaining_minutes()
        self.assertLessEqual(remaining, 60)


class TourGroupAPITest(APITestCase):
    """API тесты для TourGroup"""

    def setUp(self):
        self.client = APIClient()
        self.agent = User.objects.create(
            email='agent@test.com',
            role='tour_agency'
        )
        self.tourist = User.objects.create(
            email='tourist@test.com',
            role='tourist'
        )
        self.group = TourGroup.objects.create(
            agent=self.agent,
            name='Test Group'
        )

    def test_list_groups_as_agent(self):
        """Список групп для агента"""
        self.client.force_authenticate(user=self.agent)
        response = self.client.get('/tour/groups/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Количество может быть больше из-за других тестов
        self.assertGreaterEqual(len(response.data), 1)

    def test_create_group(self):
        """Создание группы"""
        agent2 = User.objects.create(email='agent2@test.com', role='tour_agency')
        self.client.force_authenticate(user=agent2)
        data = {'name': 'New Group', 'description': 'Test'}
        response = self.client.post('/tour/groups/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(TourGroup.objects.count(), 2)

    def test_create_group_as_tourist(self):
        """Турист не может создать группу"""
        self.client.force_authenticate(user=self.tourist)
        data = {'name': 'New Group'}
        response = self.client.post('/tour/groups/', data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_retrieve_group(self):
        """Получение деталей группы"""
        self.client.force_authenticate(user=self.agent)
        response = self.client.get(f'/tour/groups/{self.group.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Test Group')

    def test_dismiss_group(self):
        """Роспуск группы"""
        self.client.force_authenticate(user=self.agent)
        response = self.client.post(f'/tour/groups/{self.group.id}/dismiss/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.group.refresh_from_db()
        self.assertFalse(self.group.is_active)


class TourGroupMemberAPITest(APITestCase):
    """API тесты для TourGroupMember"""

    def setUp(self):
        self.client = APIClient()
        self.agent = User.objects.create(
            email='agent@test.com',
            role='tour_agency'
        )
        self.tourist = User.objects.create(
            email='tourist@test.com',
            role='tourist'
        )
        self.group = TourGroup.objects.create(
            agent=self.agent,
            name='Test Group'
        )

    def test_join_by_code(self):
        """Вступление по коду"""
        self.client.force_authenticate(user=self.tourist)
        data = {'invite_code': self.group.invite_code}
        response = self.client.post('/tour/members/join_by_code/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], 'pending')

    def test_accept_member(self):
        """Принятие участника"""
        member = TourGroupMember.objects.create(
            group=self.group,
            user=self.tourist,
            status=MemberStatus.PENDING
        )
        self.client.force_authenticate(user=self.agent)
        response = self.client.post(f'/tour/members/{member.id}/accept/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        member.refresh_from_db()
        self.assertEqual(member.status, MemberStatus.ACTIVE)

    def test_leave_group(self):
        """Выход из группы"""
        member = TourGroupMember.objects.create(
            group=self.group,
            user=self.tourist,
            status=MemberStatus.ACTIVE
        )
        self.client.force_authenticate(user=self.tourist)
        response = self.client.post(f'/tour/members/{member.id}/leave/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        member.refresh_from_db()
        self.assertEqual(member.status, MemberStatus.LEFT)


class TourZoneAPITest(APITestCase):
    """API тесты для TourZone"""

    def setUp(self):
        self.client = APIClient()
        self.agent = User.objects.create(
            email='agent@test.com',
            role='tour_agency'
        )
        self.group = TourGroup.objects.create(
            agent=self.agent,
            name='Test Group'
        )

    def test_create_zone(self):
        """Создание зоны"""
        self.client.force_authenticate(user=self.agent)
        data = {
            'group': str(self.group.id),
            'name': 'Test Zone',
            'polygon': [
                {'lat': 42.87, 'lng': 74.57},
                {'lat': 42.88, 'lng': 74.57},
                {'lat': 42.88, 'lng': 74.58},
                {'lat': 42.87, 'lng': 74.58},
            ],
            'center_lat': 42.875,
            'center_lng': 74.575
        }
        response = self.client.post('/tour/zones/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(TourZone.objects.count(), 1)

    def test_create_zone_invalid_polygon(self):
        """Создание зоны с невалидным полигоном"""
        self.client.force_authenticate(user=self.agent)
        data = {
            'group': str(self.group.id),
            'name': 'Test Zone',
            'polygon': [{'lat': 42.87, 'lng': 74.57}],  # Только 1 точка
            'center_lat': 42.875,
            'center_lng': 74.575
        }
        response = self.client.post('/tour/zones/', data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class TourSessionAPITest(APITestCase):
    """API тесты для TourSession"""

    def setUp(self):
        self.client = APIClient()
        self.agent = User.objects.create(
            email='agent@test.com',
            role='tour_agency'
        )
        self.group = TourGroup.objects.create(
            agent=self.agent,
            name='Test Group'
        )
        self.session = TourSession.objects.create(
            group=self.group,
            status=TourStatus.DRAFT
        )

    def test_start_tour(self):
        """Начало тура"""
        self.client.force_authenticate(user=self.agent)
        data = {'duration_minutes': 90}
        response = self.client.post(f'/tour/sessions/{self.session.id}/start/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.session.refresh_from_db()
        self.assertEqual(self.session.status, TourStatus.ACTIVE)

    def test_complete_tour(self):
        """Завершение тура"""
        self.session.start_tour()
        self.client.force_authenticate(user=self.agent)
        response = self.client.post(f'/tour/sessions/{self.session.id}/complete/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.session.refresh_from_db()
        self.assertEqual(self.session.status, TourStatus.COMPLETED)

    def test_get_violations(self):
        """Получение нарушений"""
        self.client.force_authenticate(user=self.agent)
        response = self.client.get(f'/tour/sessions/{self.session.id}/violations/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)


class TourLocationUpdateTest(APITestCase):
    """Тесты для обновления местоположения"""

    def setUp(self):
        self.client = APIClient()
        self.agent = User.objects.create(
            email='agent@test.com',
            role='tour_agency'
        )
        self.tourist = User.objects.create(
            email='tourist@test.com',
            role='tourist'
        )
        self.group = TourGroup.objects.create(
            agent=self.agent,
            name='Test Group'
        )
        self.member = TourGroupMember.objects.create(
            group=self.group,
            user=self.tourist,
            status=MemberStatus.ACTIVE
        )
        self.zone = TourZone.objects.create(
            group=self.group,
            name='Test Zone',
            polygon=[
                {'lat': 42.87, 'lng': 74.57},
                {'lat': 42.88, 'lng': 74.57},
                {'lat': 42.88, 'lng': 74.58},
                {'lat': 42.87, 'lng': 74.58},
            ],
            center_lat=42.875,
            center_lng=74.575
        )
        self.session = TourSession.objects.create(
            group=self.group,
            status=TourStatus.ACTIVE
        )

    def test_location_update_inside_zone(self):
        """Обновление местоположения внутри зоны"""
        self.client.force_authenticate(user=self.tourist)
        data = {'latitude': 42.875, 'longitude': 74.575}  # Внутри зоны
        response = self.client.post('/tour/location/update/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Нарушений не должно быть
        violations = ZoneViolation.objects.count()
        self.assertEqual(violations, 0)

    def test_location_update_outside_zone(self):
        """Обновление местоположения вне зоны"""
        self.client.force_authenticate(user=self.tourist)
        data = {'latitude': 42.90, 'longitude': 74.60}  # Вне зоны
        response = self.client.post('/tour/location/update/', data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Должно быть нарушение
        violations = ZoneViolation.objects.count()
        self.assertGreater(violations, 0)


class TourGroupInviteAPITest(APITestCase):
    """Тесты для приглашений в группу"""

    def setUp(self):
        self.client = APIClient()
        self.agent = User.objects.create(
            email='agent@test.com',
            role='tour_agency'
        )
        self.group = TourGroup.objects.create(
            agent=self.agent,
            name='Test Group'
        )

    def test_get_invite_info(self):
        """Получение информации по коду"""
        response = self.client.get(f'/tour/invite/{self.group.invite_code}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Test Group')

    def test_get_invalid_invite_code(self):
        """Неверный код приглашения"""
        response = self.client.get('/tour/invite/INVALID/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
