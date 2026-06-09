from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

def notify(user, message):
    if not user:
        return
    layer = get_channel_layer()
    async_to_sync(layer.group_send)(
        f"user_{user.id}",
        {
            "type": "send_notification",
            "message": message
        }
    )