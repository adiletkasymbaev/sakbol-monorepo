import json
from django.conf import settings
from pywebpush import webpush, WebPushException
from .models import WebPushSubscription
import base64
from cryptography.hazmat.primitives import serialization

def vapid_public_from_private_pem(private_pem_path: str) -> str:
    with open(private_pem_path, "rb") as f:
        private_key = serialization.load_pem_private_key(f.read(), password=None)

    public_key = private_key.public_key()
    nums = public_key.public_numbers()

    x = nums.x.to_bytes(32, "big")
    y = nums.y.to_bytes(32, "big")
    raw = b"\x04" + x + y

    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()

def push_to_user(user, title: str, body: str, data=None):
    subs = WebPushSubscription.objects.filter(user=user)
    print("PUSH DEBUG: user=", user.id, "subs=", subs.count())

    payload = {"title": title, "body": body, "data": data or {}}

    for s in subs:
        print("PUSH DEBUG: sending to", s.endpoint[:80])

        try:
            print("PUSH DEBUG: before webpush")
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
            print("PUSH DEBUG: after webpush (OK)")

        except WebPushException as e:
            print("❌ WebPushException:", repr(e))
            resp = getattr(e, "response", None)
            if resp is not None:
                print("STATUS:", resp.status_code)
                print("BODY:", getattr(resp, "text", "")[:300])

        except Exception as e:
            print("❌ Non-WebPush error:", type(e).__name__, str(e))
            raise