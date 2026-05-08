from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import IntentViewSet, TaskViewSet, DashboardViewSet

router = DefaultRouter()
router.register(r'intents', IntentViewSet)
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'dashboard', DashboardViewSet, basename='dashboard')

urlpatterns = [
    path('', include(router.urls)),
]
