from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import IntentViewSet

router = DefaultRouter()
router.register(r'intents', IntentViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
