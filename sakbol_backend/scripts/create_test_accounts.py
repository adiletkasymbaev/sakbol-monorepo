import os
import sys
import random
import string

# Добавляем путь к проекту
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'sakbol_backend.settings')

import django
django.setup()

from django.contrib.auth import get_user_model
from sos.models import Location
from accounts.models import Profile
from shared.enums import ProfileRole

User = get_user_model()

# Данные для генерации
CITIES = ['Bishkek', 'Osh', 'Jalal-Abad', 'Karakol', 'Naryn']
FIRST_NAMES = {
    'kg': ['Азамат', 'Бакыт', 'Виктор', 'Гульнара', 'Данияр', 'Елена'],
    'ru': ['Александр', 'Дмитрий', 'Максим', 'Сергей', 'Андрей', 'Олег'],
}
LAST_NAMES = {
    'kg': ['Алиев', 'Уметов', 'Исаев', 'Омурбеков', 'Жээнбеков', 'Акматов'],
    'ru': ['Иванов', 'Петров', 'Сидоров', 'Кузнецов', 'Попов', 'Лебедев'],
}

ROLES = [ProfileRole.USER, ProfileRole.PARENT, ProfileRole.CHILD, ProfileRole.TOURIST, ProfileRole.TOUR_AGENCY]

def generate_random_password(length=12):
    """Генерация случайного пароля"""
    characters = string.ascii_letters + string.digits + '!@#$%^&*'
    return ''.join(random.choice(characters) for _ in range(length))

def generate_email(first_name, last_name, num):
    """Генерация email"""
    translit = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
        'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
    }
    
    def transliterate(text):
        result = text.lower()
        for cyrillic, latin in translit.items():
            result = result.replace(cyrillic, latin)
        return result
    
    first = transliterate(first_name)
    last = transliterate(last_name)
    return f"{first}.{last}{num}@sakbol.test"

def create_test_accounts(count=6):
    """Создание тестовых аккаунтов"""
    accounts = []
    
    print(f"Создание {count} тестовых аккаунтов...\n")
    
    for i in range(count):
        # Генерация данных
        name_group = random.choice(['kg', 'ru'])
        first_name = random.choice(FIRST_NAMES[name_group])
        last_name = random.choice(LAST_NAMES[name_group])
        email = generate_email(first_name, last_name, i + 1)
        password = generate_random_password()
        role = ROLES[i % len(ROLES)]
        city = random.choice(CITIES)
        
        # Проверка на дубликат
        if User.objects.filter(email__iexact=email).exists():
            print(f"⚠️  Пользователь {email} уже существует, пропускаем...")
            continue
        
        # Создание пользователя
        try:
            user = User.objects.create(email=email)
            user.set_password(password)
            user.save()
            
            # Создание профиля
            profile = Profile.objects.create(
                user=user,
                first_name=first_name,
                last_name=last_name,
                birth_date='1990-01-01',
                city=city,
                street='Тестовая улица',
                house_number='1',
                apartment_number='1',
                phone_number=f'+99670000000{i}',
                role=role,
                med_info='Тестовый аккаунт'
            )
            
            # Создание пустой локации
            Location.objects.create(user=user)
            
            accounts.append({
                'email': email,
                'password': password,
                'first_name': first_name,
                'last_name': last_name,
                'role': role,
                'city': city
            })
            
            print(f"✅ Создан: {email} (роль: {role})")
            
        except Exception as e:
            print(f"❌ Ошибка при создании {email}: {e}")
    
    return accounts

def save_to_file(accounts, filename='test_accounts.txt'):
    """Сохранение данных аккаунтов в файл"""
    # Сохраняем в корень проекта
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    filepath = os.path.join(project_root, filename)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write("=" * 60 + "\n")
        f.write("ТЕСТОВЫЕ АККАУНТЫ ДЛЯ SAKBOL\n")
        f.write("=" * 60 + "\n\n")
        f.write(f"Всего аккаунтов: {len(accounts)}\n")
        f.write(f"Бэкенд: http://127.0.0.1:8000\n")
        f.write(f"Фронтенд: http://localhost:5173\n")
        f.write("\n" + "-" * 60 + "\n\n")
        
        for i, acc in enumerate(accounts, 1):
            f.write(f"Аккаунт #{i}\n")
            f.write(f"  Email: {acc['email']}\n")
            f.write(f"  Пароль: {acc['password']}\n")
            f.write(f"  Имя: {acc['first_name']} {acc['last_name']}\n")
            f.write(f"  Роль: {acc['role']}\n")
            f.write(f"  Город: {acc['city']}\n")
            f.write("\n")
    
    print(f"\n📁 Данные сохранены в файл: {filepath}")
    return filepath

def add_to_gitignore():
    """Добавление файла в .gitignore"""
    # Добавляем в корневой .gitignore проекта
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    gitignore_path = os.path.join(project_root, '.gitignore')
    
    filename = 'test_accounts.txt'
    
    # Читаем текущий .gitignore
    if os.path.exists(gitignore_path):
        with open(gitignore_path, 'r', encoding='utf-8') as f:
            content = f.read()
    else:
        content = ''
    
    # Проверяем, есть ли уже файл в gitignore
    if filename not in content:
        with open(gitignore_path, 'a', encoding='utf-8') as f:
            f.write(f'\n# Тестовые аккаунты\n{filename}\n')
        print(f"✅ Файл {filename} добавлен в .gitignore")
    else:
        print(f"ℹ️  Файл {filename} уже в .gitignore")

if __name__ == '__main__':
    # Создание аккаунтов
    accounts = create_test_accounts(6)
    
    if accounts:
        # Сохранение в файл
        save_to_file(accounts)
        
        # Добавление в gitignore
        add_to_gitignore()
        
        print("\n" + "=" * 60)
        print("ГОТОВО! Тестовые аккаунты созданы и сохранены.")
        print("=" * 60)
    else:
        print("\n❌ Не удалось создать ни одного аккаунта")
