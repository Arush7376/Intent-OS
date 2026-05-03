import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api';

const TaskPanel = ({ intent, refreshKey, generationNotice }) => {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!intent) {
      setTasks([]);
      setTitle('');
      setError(null);
      return;
    }

    fetchTasks(intent.id);
  }, [intent, refreshKey]);

  const fetchTasks = async (intentId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_BASE_URL}/tasks/?intent_id=${intentId}`);
      setTasks(response.data);
    } catch (err) {
      setError('Failed to load tasks. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (event) => {
    event.preventDefault();
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError('Task title cannot be empty.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/tasks/`, {
        intent: intent.id,
        title: trimmedTitle,
      });
      setTasks((currentTasks) => [response.data, ...currentTasks]);
      setTitle('');
    } catch (err) {
      setError('Failed to add task. Please try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleComplete = async (task) => {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';

    try {
      const response = await axios.patch(`${API_BASE_URL}/tasks/${task.id}/`, {
        status: nextStatus,
      });
      setTasks((currentTasks) =>
        currentTasks.map((currentTask) =>
          currentTask.id === task.id ? response.data : currentTask
        )
      );
    } catch (err) {
      setError('Failed to update task. Please try again.');
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await axios.delete(`${API_BASE_URL}/tasks/${taskId}/`);
      setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
    } catch (err) {
      setError('Failed to delete task. Please try again.');
      console.error(err);
    }
  };

  if (!intent) {
    return (
      <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-gray-500">
        Select an intent to manage its tasks.
      </section>
    );
  }

  return (
    <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <div className="mb-5">
        <p className="text-sm font-semibold text-indigo-600">Tasks for</p>
        <h2 className="text-2xl font-bold text-gray-900">{intent.title}</h2>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium">
          {error}
        </div>
      )}

      {generationNotice?.intentId === intent.id && (
        <div
          className={`p-3 rounded-lg mb-4 text-sm font-medium ${
            generationNotice.isError
              ? 'bg-red-50 text-red-600'
              : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          {generationNotice.message}
        </div>
      )}

      <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
          placeholder="Add a task"
        />
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Adding...' : 'Add Task'}
        </button>
      </form>

      {loading ? (
        <div className="text-gray-500 text-sm">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="text-gray-500 text-sm border border-dashed border-gray-200 rounded-lg p-4">
          No tasks for this intent yet.
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {tasks.map((task) => (
            <li key={task.id} className="py-3 flex items-center gap-3">
              <input
                type="checkbox"
                checked={task.status === 'completed'}
                onChange={() => handleToggleComplete(task)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div className="min-w-0 flex-1">
                <p
                  className={`font-medium ${
                    task.status === 'completed'
                      ? 'text-gray-400 line-through'
                      : 'text-gray-900'
                  }`}
                >
                  {task.title}
                </p>
                <p className="text-xs text-gray-500 capitalize">{task.status}</p>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteTask(task.id)}
                className="text-sm font-medium text-red-600 hover:text-red-700"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default TaskPanel;
