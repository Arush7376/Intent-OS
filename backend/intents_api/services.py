from dataclasses import dataclass

from django.db import transaction

from .models import Intent, Task


@dataclass(frozen=True)
class TaskGenerationResult:
    tasks: list[Task]
    generated: bool
    message: str


class TaskGenerationService:
    RULES = (
        (
            ('learn', 'study', 'course'),
            (
                'Basics / Introduction',
                'Core Concepts',
                'Practice / Exercises',
                'Projects',
                'Revision',
            ),
        ),
        (
            ('fitness', 'gym', 'workout'),
            (
                'Warm-up',
                'Strength training',
                'Cardio',
                'Cool down',
            ),
        ),
        (
            ('exam', 'crack', 'prepare'),
            (
                'Syllabus breakdown',
                'Daily study plan',
                'Practice tests',
                'Revision schedule',
            ),
        ),
    )

    FALLBACK_TASKS = (
        'Clarify outcome',
        'Break down milestones',
        'Start first action',
        'Track progress',
        'Review results',
    )

    @classmethod
    def generate_for_intent(cls, intent: Intent, *, force: bool = False) -> TaskGenerationResult:
        existing_tasks = list(intent.tasks.order_by('created_at', 'id'))

        if existing_tasks and not force:
            return TaskGenerationResult(
                tasks=existing_tasks,
                generated=False,
                message='Tasks already exist',
            )

        task_titles = cls.get_task_titles(intent.title)

        with transaction.atomic():
            if force:
                intent.tasks.all().delete()

            tasks = [
                Task(intent=intent, title=title, status=Task.Status.PENDING)
                for title in task_titles
            ]
            created_tasks = Task.objects.bulk_create(tasks)

        return TaskGenerationResult(
            tasks=created_tasks,
            generated=True,
            message='Tasks generated successfully',
        )

    @classmethod
    def get_task_titles(cls, intent_title: str) -> tuple[str, ...]:
        normalized_title = intent_title.lower()

        for keywords, task_titles in cls.RULES:
            if any(keyword in normalized_title for keyword in keywords):
                return task_titles

        return cls.FALLBACK_TASKS
