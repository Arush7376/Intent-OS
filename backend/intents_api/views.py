from rest_framework import viewsets
from .models import Intent
from .serializers import IntentSerializer

class IntentViewSet(viewsets.ModelViewSet):
    queryset = Intent.objects.all().order_by('-created_at')
    serializer_class = IntentSerializer
