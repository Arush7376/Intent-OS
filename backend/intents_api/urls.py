from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import IntentViewSet, TaskViewSet, DashboardViewSet, AnalyticsViewSet

router = DefaultRouter()
router.register(r'intents', IntentViewSet)
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'dashboard', DashboardViewSet, basename='dashboard')
router.register(r'analytics', AnalyticsViewSet, basename='analytics')

urlpatterns = [
    path('', include(router.urls)),
]
