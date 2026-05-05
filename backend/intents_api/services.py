from dataclasses import dataclass
from datetime import date, timedelta

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


@dataclass(frozen=True)
class SchedulingResult:
    tasks: list[Task]
    scheduled: bool
    message: str


class SchedulingService:
    @classmethod
    def schedule_intent_tasks(cls, intent: Intent, *, force: bool = False, duration: int = None) -> SchedulingResult:
        tasks = list(intent.tasks.order_by('created_at', 'id'))
        
        if not tasks:
            return SchedulingResult(
                tasks=[],
                scheduled=False,
                message='No tasks to schedule'
            )

        tasks_to_schedule = tasks
        if not force:
            tasks_to_schedule = [t for t in tasks if not t.due_date]
            
        if not tasks_to_schedule:
            return SchedulingResult(
                tasks=tasks,
                scheduled=False,
                message='All tasks are already scheduled'
            )

        # Distribute tasks evenly. For simple case, 1 task per day.
        # Handle buffer: every 5th day is a buffer day (skip it).
        current_date = date.today()
        day_count = 1
        
        tasks_updated = []
        for task in tasks_to_schedule:
            # Check for buffer day
            if day_count % 5 == 0:
                # Buffer day, skip assignment and move to next day
                current_date += timedelta(days=1)
                day_count += 1
            
            task.due_date = current_date
            task.day_number = day_count
            tasks_updated.append(task)
            
            # Move to next day
            current_date += timedelta(days=1)
            day_count += 1

        with transaction.atomic():
            Task.objects.bulk_update(tasks_updated, ['due_date', 'day_number'])

        return SchedulingResult(
            tasks=tasks,
            scheduled=True,
            message='Schedule generated successfully'
        )
