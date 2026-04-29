from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Intent, Task


class TaskApiTests(APITestCase):
    def setUp(self):
        self.intent = Intent.objects.create(title='Launch project')
        self.other_intent = Intent.objects.create(title='Plan week')

    def test_create_task_for_intent(self):
        response = self.client.post(
            reverse('task-list'),
            {'intent': self.intent.id, 'title': 'Draft checklist'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['intent'], self.intent.id)
        self.assertEqual(response.data['title'], 'Draft checklist')
        self.assertEqual(response.data['status'], Task.Status.PENDING)

    def test_rejects_empty_task_title(self):
        response = self.client.post(
            reverse('task-list'),
            {'intent': self.intent.id, 'title': '   '},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('title', response.data)

    def test_lists_and_filters_tasks_by_intent(self):
        task = Task.objects.create(intent=self.intent, title='Write plan')
        Task.objects.create(intent=self.other_intent, title='Buy supplies')

        response = self.client.get(reverse('task-list'), {'intent_id': self.intent.id})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], task.id)

    def test_updates_task_status(self):
        task = Task.objects.create(intent=self.intent, title='Ship feature')

        response = self.client.patch(
            reverse('task-detail', args=[task.id]),
            {'status': Task.Status.COMPLETED},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        task.refresh_from_db()
        self.assertEqual(task.status, Task.Status.COMPLETED)

    def test_deletes_task(self):
        task = Task.objects.create(intent=self.intent, title='Remove clutter')

        response = self.client.delete(reverse('task-detail', args=[task.id]))

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Task.objects.filter(id=task.id).exists())
