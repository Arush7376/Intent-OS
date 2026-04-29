from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import IntentViewSet, TaskViewSet

router = DefaultRouter()
router.register(r'intents', IntentViewSet)
router.register(r'tasks', TaskViewSet, basename='task')

urlpatterns = [
    path('', include(router.urls)),
]
