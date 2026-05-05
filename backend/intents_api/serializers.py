from rest_framework import serializers
from .models import Intent, Task


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
