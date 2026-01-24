from django.urls import path
from . import views

urlpatterns = [
    path('', views.login_view, name='login'),
    path('signup/', views.signup_view, name='signup'),
    path('logout/', views.logout_view, name='logout'),
    path('project-management/', views.project_management_view, name='project_management'),
    path('project/<int:pk>/', views.project_detail, name='project_detail'),
]
