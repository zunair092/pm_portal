import json
from channels.generic.websocket import AsyncWebsocketConsumer

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope.get("user")
        if self.user and self.user.is_authenticated:
            # Personal notifications group
            self.group_name = f"user_{self.user.id}"
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            
            # Global project updates group
            self.project_group = "project_updates"
            await self.channel_layer.group_add(self.project_group, self.channel_name)
            
            await self.accept()
        else:
            await self.close()

    async def disconnect(self, close_code):
        if hasattr(self, 'group_name'):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        if hasattr(self, 'project_group'):
            await self.channel_layer.group_discard(self.project_group, self.channel_name)

    # Personal notification handler
    async def send_notification(self, event):
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'message': event.get('message', '')
        }))

    # New project broadcast handler
    async def project_added(self, event):
        await self.send(text_data=json.dumps({
            'type': 'project_added',
            'project_name': event.get('project_name'),
            'client_name': event.get('client_name'),
            'project_id': event.get('project_id'),
        }))