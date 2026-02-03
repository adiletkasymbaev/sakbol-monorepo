from django.utils import timezone
from .models import Profile

class LastSeenMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        if request.user.is_authenticated:
            try:
                profile = request.user.profile
                profile.is_online = True
                profile.last_seen = timezone.now()
                profile.save(update_fields=["is_online", "last_seen"])
            except Profile.DoesNotExist:
                pass

        return response