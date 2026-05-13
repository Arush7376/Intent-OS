from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Intent, Task, ActivityLog
from .serializers import IntentSerializer, TaskSerializer, ActivityLogSerializer, RegisterSerializer, UserSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from .services import TaskGenerationService, SchedulingService, AdaptationEngine
from django.utils import timezone
from django.db.models import Count, Q
from datetime import timedelta



class AuthViewSet(viewsets.ViewSet):
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def register(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({'message': 'User created successfully.'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def profile(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class IntentViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        return Intent.objects.filter(user=self.request.user).order_by('-created_at')
    serializer_class = IntentSerializer

    def perform_create(self, serializer):
        intent = serializer.save(user=self.request.user)
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
        queryset = Task.objects.select_related('intent').filter(intent__user=self.request.user).order_by('created_at', 'id')
        intent_id = self.request.query_params.get('intent_id')
        if intent_id:
            queryset = queryset.filter(intent_id=intent_id)
        return queryset


class DashboardViewSet(viewsets.ViewSet):
    @action(detail=False, methods=['get'])
    def overview(self, request):
        total_intents = Intent.objects.filter(user=request.user).count()
        total_tasks = Task.objects.filter(intent__user=request.user).count()
        completed_tasks = Task.objects.filter(intent__user=request.user, status=Task.Status.COMPLETED).count()
        pending_tasks = total_tasks - completed_tasks
        completion_percentage = round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0
        
        today = timezone.localdate()
        missed_tasks_count = Task.objects.filter(intent__user=request.user, status=Task.Status.PENDING, due_date__lt=today).count()
        
        # Streak logic
        yesterday = today - timedelta(days=1)
        logs = ActivityLog.objects.filter(related_intent__user=request.user, event_type=ActivityLog.EventType.TASK_COMPLETED).order_by('-timestamp')
        dates_with_completion = sorted(list(set([log.timestamp.astimezone(timezone.get_current_timezone()).date() for log in logs])), reverse=True)
        
        current_streak = 0
        if dates_with_completion:
            current_date_to_check = today
            if dates_with_completion[0] == today:
                pass
            elif dates_with_completion[0] == yesterday:
                current_date_to_check = yesterday
            else:
                dates_with_completion = [] # Streak broken
                
            for d in dates_with_completion:
                if d == current_date_to_check:
                    current_streak += 1
                    current_date_to_check -= timedelta(days=1)
                elif d > current_date_to_check:
                    continue
                else:
                    break

        return Response({
            'total_intents': total_intents,
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'pending_tasks': pending_tasks,
            'completion_percentage': completion_percentage,
            'productivity_score': completion_percentage,
            'current_streak': current_streak,
            'missed_tasks_count': missed_tasks_count,
        })

    @action(detail=False, methods=['get'])
    def today(self, request):
        today = timezone.localdate()
        tasks = Task.objects.select_related('intent').filter(intent__user=request.user, due_date=today).order_by('created_at')
        return Response(TaskSerializer(tasks, many=True).data)

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        today = timezone.localdate()
        tasks = Task.objects.select_related('intent').filter(intent__user=request.user, due_date__gt=today).order_by('due_date', 'created_at')
        return Response(TaskSerializer(tasks, many=True).data)

    @action(detail=False, methods=['get'])
    def progress(self, request):
        intents = Intent.objects.filter(user=request.user).annotate(
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
        recent_intents = Intent.objects.filter(user=request.user).order_by('-created_at')[:5]
        recent_tasks = Task.objects.filter(intent__user=request.user, status=Task.Status.COMPLETED).select_related('intent').order_by('-created_at')[:5]
        return Response({
            'intents': IntentSerializer(recent_intents, many=True).data,
            'completed_tasks': TaskSerializer(recent_tasks, many=True).data
        })


class AnalyticsViewSet(viewsets.ViewSet):
    @action(detail=False, methods=['get'])
    def summary(self, request):
        today = timezone.localdate()
        total_tasks = Task.objects.filter(intent__user=request.user).count()
        completed_tasks = Task.objects.filter(intent__user=request.user, status=Task.Status.COMPLETED).count()
        pending_tasks = total_tasks - completed_tasks
        completion_percentage = round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0
        missed_tasks = Task.objects.filter(intent__user=request.user, status=Task.Status.PENDING, due_date__lt=today).count()
        
        streak = self._calculate_streak(request)
        
        return Response({
            'total_completed': completed_tasks,
            'total_pending': pending_tasks,
            'completion_percentage': completion_percentage,
            'current_streak': streak,
            'missed_tasks_count': missed_tasks,
        })
        
    def _calculate_streak(self):
        today = timezone.localdate()
        yesterday = today - timedelta(days=1)
        
        logs = ActivityLog.objects.filter(related_intent__user=request.user, event_type=ActivityLog.EventType.TASK_COMPLETED).order_by('-timestamp')
        dates_with_completion = sorted(list(set([log.timestamp.astimezone(timezone.get_current_timezone()).date() for log in logs])), reverse=True)
        
        if not dates_with_completion:
            return 0
            
        streak = 0
        current_date_to_check = today
        
        if dates_with_completion[0] == today:
            pass
        elif dates_with_completion[0] == yesterday:
            current_date_to_check = yesterday
        else:
            return 0
            
        for d in dates_with_completion:
            if d == current_date_to_check:
                streak += 1
                current_date_to_check -= timedelta(days=1)
            elif d > current_date_to_check:
                continue
            else:
                break
                
        return streak

    @action(detail=False, methods=['get'])
    def daily(self, request):
        today = timezone.localdate()
        start_datetime = timezone.now() - timedelta(days=14)
        
        logs = ActivityLog.objects.filter(
            related_intent__user=request.user,
            event_type=ActivityLog.EventType.TASK_COMPLETED,
            timestamp__gte=start_datetime
        )
        
        counts = {}
        for log in logs:
            d = log.timestamp.astimezone(timezone.get_current_timezone()).date()
            counts[d] = counts.get(d, 0) + 1
            
        start_date = today - timedelta(days=13)
        data = []
        for i in range(14):
            d = start_date + timedelta(days=i)
            data.append({
                'date': d.isoformat(),
                'count': counts.get(d, 0)
            })
            
        return Response(data)

    @action(detail=False, methods=['get'])
    def weekly(self, request):
        today = timezone.localdate()
        start_datetime = timezone.now() - timedelta(weeks=8)
        
        logs = ActivityLog.objects.filter(
            related_intent__user=request.user,
            event_type=ActivityLog.EventType.TASK_COMPLETED,
            timestamp__gte=start_datetime
        )
        
        counts = {}
        for log in logs:
            d = log.timestamp.astimezone(timezone.get_current_timezone()).date()
            week_start = d - timedelta(days=d.weekday())
            counts[week_start] = counts.get(week_start, 0) + 1
            
        start_of_week = today - timedelta(days=today.weekday())
        start_date = start_of_week - timedelta(weeks=7)
        data = []
        for i in range(8):
            ws = start_date + timedelta(weeks=i)
            data.append({
                'week': ws.isoformat(),
                'count': counts.get(ws, 0)
            })
            
        return Response(data)
        
    @action(detail=False, methods=['get'])
    def timeline(self, request):
        logs = ActivityLog.objects.filter(related_intent__user=request.user).select_related('related_intent', 'related_task').order_by('-timestamp')[:50]
        return Response(ActivityLogSerializer(logs, many=True).data)

class AdaptationViewSet(viewsets.ViewSet):
    @action(detail=False, methods=['post'])
    def run(self, request):
        result = AdaptationEngine.run_adaptation(request.user)
        return Response({
            'message': result.message,
            'rescheduled_count': result.rescheduled_count,
            'workload_limit': result.workload_limit,
            'recovery_days_inserted': result.recovery_days_inserted,
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def status(self, request):
        status_data = AdaptationEngine.get_status(request.user)
        return Response(status_data)


