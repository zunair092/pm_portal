# import json
# from channels.generic.websocket import AsyncWebsocketConsumer

# class NotificationConsumer(AsyncWebsocketConsumer):
#     async def connect(self):
#         self.group_name = f"user_{self.scope['user'].id}"
#         await self.channel_layer.group_add(self.group_name, self.channel_name)
#         await self.accept()

#     async def disconnect(self, close_code):
#         await self.channel_layer.group_discard(self.group_name, self.channel_name)

#     async def send_notification(self, event):
#         await self.send(text_data=json.dumps({
#             'message': event['message']
#         }))


# import json
# from channels.generic.websocket import AsyncWebsocketConsumer

# class NotificationConsumer(AsyncWebsocketConsumer):
#     async def connect(self):
#         # 1. Get user from the scope (AuthMiddlewareStack handles this)
#         self.user = self.scope.get("user")

#         # 2. Check if user exists and is logged in
#         if self.user and self.user.is_authenticated:
#             self.group_name = f"user_{self.user.id}"

#             # 3. Join the personal user group
#             await self.channel_layer.group_add(
#                 self.group_name,
#                 self.channel_name
#             )

#             # 4. Accept the connection
#             await self.accept()
#         else:
#             # Reject connection if user is anonymous
#             await self.close()

#     async def disconnect(self, close_code):
#         # Leave the group on disconnect to save memory
#         if hasattr(self, 'group_name'):
#             await self.channel_layer.group_discard(
#                 self.group_name,
#                 self.channel_name
#             )

#     # This method handles the 'send_notification' type from your views
#     async def send_notification(self, event):
#         message = event.get('message', 'No message content')

#         # Send the data down to the browser/JavaScript
#         await self.send(text_data=json.dumps({
#             'message': message
#         }))


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