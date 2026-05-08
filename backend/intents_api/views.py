from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Intent, Task
from .serializers import IntentSerializer, TaskSerializer
from .services import TaskGenerationService, SchedulingService
from django.utils import timezone
from django.db.models import Count, Q


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

    @action(detail=True, methods=['post'], url_path='schedule')
    def schedule(self, request, pk=None):
        intent = self.get_object()
        force = request.data.get('force') is True
        duration = request.data.get('duration')
        if duration is not None:
            try:
                duration = int(duration)
            except ValueError:
                duration = None

        result = SchedulingService.schedule_intent_tasks(intent, force=force, duration=duration)
        serializer = TaskSerializer(result.tasks, many=True)

        return Response(
            {
                'message': result.message,
                'scheduled': result.scheduled,
                'tasks': serializer.data,
            },
            status=status.HTTP_201_CREATED if result.scheduled else status.HTTP_200_OK,
        )


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer

    def get_queryset(self):
        queryset = Task.objects.select_related('intent').all().order_by('created_at', 'id')
        intent_id = self.request.query_params.get('intent_id')
        if intent_id:
            queryset = queryset.filter(intent_id=intent_id)
        return queryset


class DashboardViewSet(viewsets.ViewSet):
    @action(detail=False, methods=['get'])
    def overview(self, request):
        total_intents = Intent.objects.count()
        total_tasks = Task.objects.count()
        completed_tasks = Task.objects.filter(status=Task.Status.COMPLETED).count()
        pending_tasks = total_tasks - completed_tasks
        completion_percentage = round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0

        return Response({
            'total_intents': total_intents,
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'pending_tasks': pending_tasks,
            'completion_percentage': completion_percentage
        })

    @action(detail=False, methods=['get'])
    def today(self, request):
        today = timezone.localdate()
        tasks = Task.objects.select_related('intent').filter(due_date=today).order_by('created_at')
        return Response(TaskSerializer(tasks, many=True).data)

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        today = timezone.localdate()
        tasks = Task.objects.select_related('intent').filter(due_date__gt=today).order_by('due_date', 'created_at')
        return Response(TaskSerializer(tasks, many=True).data)

    @action(detail=False, methods=['get'])
    def progress(self, request):
        intents = Intent.objects.annotate(
            total_tasks=Count('tasks'),
            completed_tasks=Count('tasks', filter=Q(tasks__status=Task.Status.COMPLETED))
        ).order_by('-created_at')
        
        data = []
        for intent in intents:
            percentage = round((intent.completed_tasks / intent.total_tasks * 100), 1) if intent.total_tasks > 0 else 0
            data.append({
                'id': intent.id,
                'title': intent.title,
                'total_tasks': intent.total_tasks,
                'completed_tasks': intent.completed_tasks,
                'percentage': percentage
            })
        return Response(data)
        
    @action(detail=False, methods=['get'])
    def recent(self, request):
        recent_intents = Intent.objects.order_by('-created_at')[:5]
        recent_tasks = Task.objects.filter(status=Task.Status.COMPLETED).select_related('intent').order_by('-created_at')[:5]
        return Response({
            'intents': IntentSerializer(recent_intents, many=True).data,
            'completed_tasks': TaskSerializer(recent_tasks, many=True).data
        })

