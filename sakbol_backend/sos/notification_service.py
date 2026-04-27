"""
Helper functions for creating in-app notifications and sending push notifications.
"""
from django.db import models
from sos.models import Contact, Notification, AlertSignal, SosSignal
from push.service import push_to_users


def get_accepted_contacts_users(user):
    """Get all users who are accepted contacts of the given user."""
    contacts = Contact.objects.filter(
        (models.Q(from_user=user) | models.Q(to_user=user)),
        is_accepted=True
    ).select_related("from_user", "to_user")

    notified_users = set()
    for contact in contacts:
        other_user = contact.to_user if contact.from_user == user else contact.from_user
        if other_user.id != user.id and other_user.id not in notified_users:
            notified_users.add(other_user.id)

    from accounts.models import User
    return User.objects.filter(id__in=notified_users)


def notify_contacts_alert_created(alert_signal):
    """Create in-app notifications and push notifications for all contacts when an alert is created."""
    sender = alert_signal.sender_user
    contacts_qs = get_accepted_contacts_users(sender)

    try:
        sender_profile = sender.profile
        sender_name = f"{sender_profile.first_name} {sender_profile.last_name}".strip() or sender.email
    except Exception:
        sender_name = sender.email

    title = "Предупреждающий сигнал"
    body = f"Ваш контакт {sender_name} отправил предупреждающий сигнал. Обратите внимание!"

    # In-app notifications
    notifications = []
    for contact_user in contacts_qs:
        notifications.append(
            Notification(
                recipient=contact_user,
                sender=sender,
                notification_type="alert_signal",
                title=title,
                body=body,
                alert_signal=alert_signal,
            )
        )
    Notification.objects.bulk_create(notifications)

    # Push notifications
    if contacts_qs.exists():
        push_to_users(contacts_qs, title, body, {
            "alert_signal_id": alert_signal.id,
            "sender_id": sender.id,
            "type": "alert_signal"
        })


def notify_contacts_sos_created(sos_signal):
    """Create in-app notifications and push notifications for all contacts when an SOS is created."""
    sender = sos_signal.sender_user
    contacts_qs = get_accepted_contacts_users(sender)

    try:
        sender_profile = sender.profile
        sender_name = f"{sender_profile.first_name} {sender_profile.last_name}".strip() or sender.email
    except Exception:
        sender_name = sender.email

    title = "Экстренный SOS-сигнал"
    body = f"Ваш контакт {sender_name} вызвал экстренный SOS-сигнал! Обратите внимание!"

    # In-app notifications
    notifications = []
    for contact_user in contacts_qs:
        notifications.append(
            Notification(
                recipient=contact_user,
                sender=sender,
                notification_type="sos_signal",
                title=title,
                body=body,
                sos_signal=sos_signal,
            )
        )
    Notification.objects.bulk_create(notifications)

    # Push notifications
    if contacts_qs.exists():
        push_to_users(contacts_qs, title, body, {
            "sos_signal_id": sos_signal.id,
            "sender_id": sender.id,
            "type": "sos_signal"
        })


def notify_alert_answered(alert_signal, responder_user):
    """Notify the alert sender AND all other contacts that someone answered the alert."""
    sender = alert_signal.sender_user

    try:
        responder_profile = responder_user.profile
        responder_name = f"{responder_profile.first_name} {responder_profile.last_name}".strip() or responder_user.email
    except Exception:
        responder_name = responder_user.email

    # Notify the original sender
    title = "Сигнал обработан"
    body = f"{responder_name} откликнулся на ваш предупреждающий сигнал."
    Notification.objects.create(
        recipient=sender,
        sender=responder_user,
        notification_type="alert_answered",
        title=title,
        body=body,
        alert_signal=alert_signal,
    )

    # Notify all other contacts (except sender and responder)
    contacts_qs = get_accepted_contacts_users(sender)
    other_contacts = contacts_qs.exclude(id__in=[sender.id, responder_user.id])

    if other_contacts.exists():
        title_other = "Сигнал обработан"
        body_other = f"{responder_name} откликнулся на предупреждающий сигнал от {sender.email}."
        notifications = []
        for contact_user in other_contacts:
            notifications.append(
                Notification(
                    recipient=contact_user,
                    sender=responder_user,
                    notification_type="alert_answered",
                    title=title_other,
                    body=body_other,
                    alert_signal=alert_signal,
                )
            )
        Notification.objects.bulk_create(notifications)

        # Push to other contacts
        push_to_users(other_contacts, title_other, body_other, {
            "alert_signal_id": alert_signal.id,
            "responder_id": responder_user.id,
            "type": "alert_answered"
        })

    # Push to sender
    from accounts.models import User
    push_to_users(User.objects.filter(id=sender.id), title, body, {
        "alert_signal_id": alert_signal.id,
        "responder_id": responder_user.id,
        "type": "alert_answered"
    })


def notify_sos_answered(sos_signal, responder_user):
    """Notify the SOS sender AND all other contacts that someone answered the SOS."""
    sender = sos_signal.sender_user

    try:
        responder_profile = responder_user.profile
        responder_name = f"{responder_profile.first_name} {responder_profile.last_name}".strip() or responder_user.email
    except Exception:
        responder_name = responder_user.email

    # Notify the original sender
    title = "SOS-сигнал обработан"
    body = f"{responder_name} откликнулся на ваш SOS-сигнал."
    Notification.objects.create(
        recipient=sender,
        sender=responder_user,
        notification_type="sos_answered",
        title=title,
        body=body,
        sos_signal=sos_signal,
    )

    # Notify all other contacts
    contacts_qs = get_accepted_contacts_users(sender)
    other_contacts = contacts_qs.exclude(id__in=[sender.id, responder_user.id])

    if other_contacts.exists():
        title_other = "SOS-сигнал обработан"
        body_other = f"{responder_name} откликнулся на SOS-сигнал от {sender.email}."
        notifications = []
        for contact_user in other_contacts:
            notifications.append(
                Notification(
                    recipient=contact_user,
                    sender=responder_user,
                    notification_type="sos_answered",
                    title=title_other,
                    body=body_other,
                    sos_signal=sos_signal,
                )
            )
        Notification.objects.bulk_create(notifications)

        push_to_users(other_contacts, title_other, body_other, {
            "sos_signal_id": sos_signal.id,
            "responder_id": responder_user.id,
            "type": "sos_answered"
        })

    from accounts.models import User
    push_to_users(User.objects.filter(id=sender.id), title, body, {
        "sos_signal_id": sos_signal.id,
        "responder_id": responder_user.id,
        "type": "sos_answered"
    })


def notify_alert_escalated_to_sos(alert_signal, sos_signal):
    """Notify all contacts that an alert was escalated to SOS due to no response."""
    sender = alert_signal.sender_user

    try:
        sender_profile = sender.profile
        sender_name = f"{sender_profile.first_name} {sender_profile.last_name}".strip() or sender.email
    except Exception:
        sender_name = sender.email

    title = "SOS-сигнал (авто)"
    body = f"Предупреждающий сигнал от {sender_name} escalated в экстренный SOS (нет ответа 3 мин)."

    contacts_qs = get_accepted_contacts_users(sender)

    notifications = []
    for contact_user in contacts_qs:
        notifications.append(
            Notification(
                recipient=contact_user,
                sender=sender,
                notification_type="alert_escalated",
                title=title,
                body=body,
                alert_signal=alert_signal,
                sos_signal=sos_signal,
            )
        )
    Notification.objects.bulk_create(notifications)

    if contacts_qs.exists():
        push_to_users(contacts_qs, title, body, {
            "alert_signal_id": alert_signal.id,
            "sos_signal_id": sos_signal.id,
            "sender_id": sender.id,
            "type": "alert_escalated"
        })
