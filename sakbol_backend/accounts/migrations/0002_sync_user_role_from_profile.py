# Generated manually to sync user role from profile

from django.db import migrations
from django.contrib.auth import get_user_model

User = get_user_model()


def sync_user_role_from_profile(apps, schema_editor):
    """Синхронизирует роль User с ролью Profile для всех существующих пользователей."""
    Profile = apps.get_model('accounts', 'Profile')
    
    updated_count = 0
    for profile in Profile.objects.select_related('user').all():
        if profile.user and profile.user.role != profile.role:
            profile.user.role = profile.role
            profile.user.save(update_fields=['role'])
            updated_count += 1
    
    print(f"Updated {updated_count} users to match their profile role.")


def reverse_sync(apps, schema_editor):
    """Обратная операция — ничего не делаем, так как это data migration."""
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(sync_user_role_from_profile, reverse_sync),
    ]
