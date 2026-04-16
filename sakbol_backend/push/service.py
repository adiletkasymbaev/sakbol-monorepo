import json
import logging
from django.conf import settings
from pywebpush import webpush, WebPushException
from .models import WebPushSubscription, FCMDevice
import base64
from cryptography.hazmat.primitives import serialization

logger = logging.getLogger(__name__)

# Глобальная переменная для инициализации Firebase
_firebase_app = None

def get_firebase_app():
    """Ленивая инициализация Firebase App"""
    global _firebase_app
    if _firebase_app is None:
        try:
            import firebase_admin
            from firebase_admin import credentials
            
            cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS)
            _firebase_app = firebase_admin.initialize_app(cred)
            logger.info("Firebase initialized successfully")
        except FileNotFoundError:
            logger.warning(f"Firebase credentials file not found: {settings.FIREBASE_CREDENTIALS}")
        except Exception as e:
            logger.error(f"Firebase initialization error: {e}")
    return _firebase_app


def vapid_public_from_private_pem(private_pem_path: str) -> str:
    with open(private_pem_path, "rb") as f:
        private_key = serialization.load_pem_private_key(f.read(), password=None)

    public_key = private_key.public_key()
    nums = public_key.public_numbers()

    x = nums.x.to_bytes(32, "big")
    y = nums.y.to_bytes(32, "big")
    raw = b"\x04" + x + y

    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()


def send_fcm_notification(user, title: str, body: str, data=None):
    """
    Отправка push-уведомления через FCM (Firebase Cloud Messaging)
    Работает для Android, iOS и Web (через FCM)
    """
    app = get_firebase_app()
    if app is None:
        logger.warning("Firebase not initialized, skipping FCM notification")
        return False

    try:
        from firebase_admin import messaging
        from firebase_admin.exceptions import FirebaseError
    except ImportError:
        logger.error("firebase-admin not installed")
        return False

    devices = FCMDevice.objects.filter(user=user, is_active=True)
    if not devices.exists():
        logger.debug(f"No FCM devices for user {user.id}")
        return False

    success_count = 0
    for device in devices:
        try:
            # Создаём сообщение в правильном формате
            message = messaging.Message(
                notification=messaging.Notification(
                    title=title,
                    body=body,
                ),
                data=data or {},
                android=messaging.AndroidConfig(
                    priority="high",
                    notification=messaging.AndroidNotification(
                        click_action="FLUTTER_NOTIFICATION_CLICK",
                    )
                ),
                apns=messaging.APNSConfig(
                    payload=messaging.APNSPayload(
                        aps=messaging.Aps(
                            content_available=True,
                        )
                    )
                ),
                token=device.registration_id,
            )
            
            response = messaging.send(message, dry_run=False)
            logger.info(f"FCM sent to {device.device_type}: {response}")
            success_count += 1

        except messaging.UnregisteredError:
            logger.warning(f"FCM device unregistered: {device.registration_id[:30]}...")
            device.delete()
        except FirebaseError as e:
            # Ошибки Firebase (400, 403, 404, 500 и т.д.)
            logger.warning(f"FCM error for {device.device_type}: {e}")
            # Удаляем при ошибке 404 (токен не найден)
            if e.code == 404:
                logger.info(f"Deleting invalid FCM token: {device.registration_id[:30]}...")
                device.delete()
        except Exception as e:
            logger.error(f"FCM error for {device.device_type}: {type(e).__name__} {str(e)}")

    return success_count > 0


def send_web_push_notification(user, title: str, body: str, data=None):
    """
    Отправка Web Push уведомления (для браузеров)
    """
    subs = WebPushSubscription.objects.filter(user=user)
    logger.debug(f"Web Push: user={user.id}, subs={subs.count()}")

    if not subs.exists():
        logger.debug(f"No Web Push subscriptions for user {user.id}")
        return False

    payload = {"title": title, "body": body, "data": data or {}}

    success_count = 0
    for s in subs:
        logger.debug(f"Web Push: sending to {s.endpoint[:80]}")
        logger.debug(f"Web Push: p256dh={s.p256dh[:30] if s.p256dh else 'None'}...")
        logger.debug(f"Web Push: auth={s.auth[:30] if s.auth else 'None'}...")

        try:
            webpush(
                subscription_info={
                    "endpoint": s.endpoint,
                    "keys": {"p256dh": s.p256dh, "auth": s.auth},
                },
                data=json.dumps(payload),
                vapid_private_key=str(settings.VAPID_PRIVATE_KEY),
                vapid_claims={"sub": settings.VAPID_ADMIN_EMAIL},
                timeout=10,
            )
            logger.info("Web Push sent OK")
            success_count += 1

        except WebPushException as e:
            logger.error(f"WebPushException: {repr(e)}")
            resp = getattr(e, "response", None)
            
            if resp is not None:
                logger.error(f"STATUS: {resp.status_code}")
                logger.error(f"BODY: {getattr(resp, 'text', '')[:300]}")
                
                if resp.status_code in (410, 404):
                    logger.info(f"Deleting invalid subscription: {s.endpoint[:80]}")
                    s.delete()
                elif resp.status_code == 400:
                    logger.warning(f"Bad request for subscription: {s.endpoint[:80]}. Deleting...")
                    s.delete()
            else:
                logger.info(f"Deleting subscription with no response: {s.endpoint[:80]}")
                s.delete()

        except Exception as e:
            logger.error(f"Non-WebPush error: {type(e).__name__} {str(e)}")
            continue
    
    return success_count > 0


def push_to_user(user, title: str, body: str, data=None):
    """
    Отправка push-уведомления одному пользователю.
    Отправляет через FCM (мобильные) и Web Push (браузер).
    """
    fcm_sent = send_fcm_notification(user, title, body, data)
    web_sent = send_web_push_notification(user, title, body, data)
    
    logger.info(f"Push to user {user.id}: FCM={fcm_sent}, Web={web_sent}")
    
    return fcm_sent or web_sent


def push_to_users(users, title: str, body: str, data=None):
    """
    Массовая отправка push-уведомлений списку пользователей.
    users: queryset или список объектов User
    """
    from django.db.models import QuerySet
    
    if isinstance(users, QuerySet):
        users = list(users)
    
    logger.info(f"Push to {len(users)} users: {title}")
    
    for user in users:
        try:
            push_to_user(user, title, body, data)
        except Exception as e:
            logger.error(f"Error sending push to user {user.id}: {e}")