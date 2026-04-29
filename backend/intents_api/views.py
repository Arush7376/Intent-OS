from rest_framework import viewsets
from .models import Intent, Task
from .serializers import IntentSerializer, TaskSerializer


class IntentViewSet(viewsets.ModelViewSet):
    queryset = Intent.objects.all().order_by('-created_at')
    serializer_class = IntentSerializer


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer

    def get_queryset(self):
        queryset = Task.objects.select_related('intent').all().order_by('-created_at')
        intent_id = self.request.query_params.get('intent_id')
        if intent_id:
            queryset = queryset.filter(intent_id=intent_id)
        return queryset
