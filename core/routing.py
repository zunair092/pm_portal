# from django.urls import path
# from .consumers import NotificationConsumer

# websocket_urlpatterns = [
#     path('ws/notifications/', NotificationConsumer.as_asgi()),
# ]

from django.urls import re_path
from . import consumers # Make sure you have a consumers.py

websocket_urlpatterns = [
    re_path(r'ws/notifications/$', consumers.NotificationConsumer.as_asgi()),
]