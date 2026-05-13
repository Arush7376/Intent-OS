from django.db import models
from django.contrib.auth.models import User


class Intent(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='intents')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new:
            ActivityLog.objects.create(event_type=ActivityLog.EventType.INTENT_CREATED, related_intent=self)

    def __str__(self):
        return self.title


class Task(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        COMPLETED = 'completed', 'Completed'

    intent = models.ForeignKey(Intent, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    due_date = models.DateField(blank=True, null=True)
    day_number = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        old_status = None
        if not is_new:
            old_task = Task.objects.filter(pk=self.pk).first()
            if old_task:
                old_status = old_task.status
        
        super().save(*args, **kwargs)
        
        if is_new:
            ActivityLog.objects.create(event_type=ActivityLog.EventType.TASK_CREATED, related_task=self, related_intent=self.intent)
        elif old_status and old_status != self.status and self.status == self.Status.COMPLETED:
            ActivityLog.objects.create(event_type=ActivityLog.EventType.TASK_COMPLETED, related_task=self, related_intent=self.intent)

    def delete(self, *args, **kwargs):
        # We need to save the intent before deletion since self.intent will be unavailable
        intent = self.intent
        super().delete(*args, **kwargs)
        ActivityLog.objects.create(event_type=ActivityLog.EventType.TASK_DELETED, related_intent=intent)

    def __str__(self):
        return self.title


class ActivityLog(models.Model):
    class EventType(models.TextChoices):
        TASK_COMPLETED = 'task_completed', 'Task Completed'
        TASK_CREATED = 'task_created', 'Task Created'
        TASK_DELETED = 'task_deleted', 'Task Deleted'
        INTENT_CREATED = 'intent_created', 'Intent Created'

    event_type = models.CharField(max_length=50, choices=EventType.choices)
    related_intent = models.ForeignKey(Intent, on_delete=models.SET_NULL, null=True, blank=True, related_name='activity_logs')
    related_task = models.ForeignKey(Task, on_delete=models.SET_NULL, null=True, blank=True, related_name='activity_logs')
    timestamp = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(null=True, blank=True)

    def __str__(self):
        return f"{self.get_event_type_display()} at {self.timestamp}"
