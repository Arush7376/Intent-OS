from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Intent, Task, ActivityLog, Notification

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = [
            'id',
            'title',
            'message',
            'type',
            'is_read',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user


class IntentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Intent
        fields = ['id', 'title', 'description', 'created_at']


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = [
            'id',
            'intent',
            'title',
            'description',
            'status',
            'due_date',
            'day_number',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def validate_title(self, value):
        title = value.strip()
        if not title:
            raise serializers.ValidationError('Task title cannot be empty.')
        return title


class ActivityLogSerializer(serializers.ModelSerializer):
    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True)
    intent_title = serializers.CharField(source='related_intent.title', read_only=True, allow_null=True)
    task_title = serializers.CharField(source='related_task.title', read_only=True, allow_null=True)

    class Meta:
        model = ActivityLog
        fields = [
            'id',
            'event_type',
            'event_type_display',
            'related_intent',
            'intent_title',
            'related_task',
            'task_title',
            'timestamp',
            'metadata'
        ]
        read_only_fields = ['id', 'timestamp']
