"""
Script to create test users with contacts and locations.
Run with: python manage.py shell < scripts/create_test_users_with_contacts.py
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sakbol_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from accounts.models import Profile
from sos.models import Contact, Location
from shared.enums import ProfileRole
import random

User = get_user_model()

# Coordinate range for locations
COORDINATES = [
    (40.93346, 72.95902),
    (40.92788, 73.00126),
    (40.94903, 73.00588),
    (40.96186, 72.97549),
]

TEST_USERS = [
    {
        'email': 'testuser1@sakbol.com',
        'password': 'TestPass123!',
        'first_name': 'Азамат',
        'last_name': 'Касымов',
        'birth_date': '1990-05-15',
        'phone_number': '+996555001001',
    },
    {
        'email': 'testuser2@sakbol.com',
        'password': 'TestPass123!',
        'first_name': 'Айгуль',
        'last_name': 'Токтоналиева',
        'birth_date': '1992-08-22',
        'phone_number': '+996555001002',
    },
    {
        'email': 'testuser3@sakbol.com',
        'password': 'TestPass123!',
        'first_name': 'Бакыт',
        'last_name': 'Жумабеков',
        'birth_date': '1988-03-10',
        'phone_number': '+996555001003',
    },
    {
        'email': 'testuser4@sakbol.com',
        'password': 'TestPass123!',
        'first_name': 'Нурия',
        'last_name': 'Асанова',
        'birth_date': '1995-11-30',
        'phone_number': '+996555001004',
    },
    {
        'email': 'testuser5@sakbol.com',
        'password': 'TestPass123!',
        'first_name': 'Эрлан',
        'last_name': 'Мамбетов',
        'birth_date': '1993-07-05',
        'phone_number': '+996555001005',
    },
]


def create_users():
    """Create test users with profiles."""
    print("Creating test users...")
    users = []
    for user_data in TEST_USERS:
        email = user_data['email']
        if User.objects.filter(email=email).exists():
            print(f"  User {email} already exists, skipping.")
            user = User.objects.get(email=email)
            users.append(user)
            continue

        user = User.objects.create(
            email=email,
            is_active=True,
        )
        user.set_password(user_data['password'])
        user.save()

        profile = Profile.objects.create(
            user=user,
            first_name=user_data['first_name'],
            last_name=user_data['last_name'],
            birth_date=user_data['birth_date'],
            phone_number=user_data['phone_number'],
            role=ProfileRole.USER,
        )
        users.append(user)
        print(f"  Created user: {email} (Profile ID: {profile.identifier})")

    return users


def create_contacts(users):
    """Create accepted contact connections between all users (one direction only)."""
    print("\nCreating contact connections...")
    contacts_created = 0
    for i, from_user in enumerate(users):
        for j, to_user in enumerate(users):
            if i >= j:
                continue
            if not Contact.objects.filter(from_user=from_user, to_user=to_user).exists():
                Contact.objects.create(
                    from_user=from_user,
                    to_user=to_user,
                    is_accepted=True,
                )
                contacts_created += 1
                print(f"  Contact: {from_user.email} -> {to_user.email}")

    print(f"  Total contacts created: {contacts_created}")


def create_locations(users):
    """Create initial locations for users within the coordinate range."""
    print("\nCreating initial locations...")
    for i, user in enumerate(users):
        if Location.objects.filter(user=user).exists():
            print(f"  Location for {user.email} already exists, updating.")
            location = Location.objects.get(user=user)
        else:
            location = Location(user=user)

        base_lat, base_lon = COORDINATES[i % len(COORDINATES)]
        # Add small random variation (±0.005 degrees)
        location.latitude = base_lat + random.uniform(-0.005, 0.005)
        location.longitude = base_lon + random.uniform(-0.005, 0.005)
        location.save()

        print(f"  Location for {user.email}: ({location.latitude:.5f}, {location.longitude:.5f})")


def main():
    print("=" * 50)
    print("Creating test users with contacts and locations")
    print("=" * 50)

    users = create_users()
    create_contacts(users)
    create_locations(users)

    print("\n" + "=" * 50)
    print("Done! Created/updated:")
    print(f"  - {len(users)} users")
    print(f"  - {len(users) * (len(users) - 1)} contact connections")
    print(f"  - {len(users)} locations")
    print("=" * 50)


if __name__ == '__main__':
    main()
