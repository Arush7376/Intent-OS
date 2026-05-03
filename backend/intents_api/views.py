from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Intent, Task
from .serializers import IntentSerializer, TaskSerializer
from .services import TaskGenerationService


class IntentViewSet(viewsets.ModelViewSet):
    queryset = Intent.objects.all().order_by('-created_at')
    serializer_class = IntentSerializer

    def perform_create(self, serializer):
        intent = serializer.save()
        TaskGenerationService.generate_for_intent(intent)

    @action(detail=True, methods=['post'], url_path='generate-tasks')
    def generate_tasks(self, request, pk=None):
        intent = self.get_object()
        force = request.data.get('force') is True
        result = TaskGenerationService.generate_for_intent(intent, force=force)
        serializer = TaskSerializer(result.tasks, many=True)

        return Response(
            {
                'message': result.message,
                'generated': result.generated,
                'tasks': serializer.data,
            },
            status=status.HTTP_201_CREATED if result.generated else status.HTTP_200_OK,
        )


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer

    def get_queryset(self):
        queryset = Task.objects.select_related('intent').all().order_by('created_at', 'id')
        intent_id = self.request.query_params.get('intent_id')
        if intent_id:
            queryset = queryset.filter(intent_id=intent_id)
        return queryset
