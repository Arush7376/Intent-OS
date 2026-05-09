import { useState, useEffect } from 'react';
import axios from 'axios';
import IntentForm from './components/IntentForm';
import IntentList from './components/IntentList';
import TaskPanel from './components/TaskPanel';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [intents, setIntents] = useState([]);
  const [selectedIntent, setSelectedIntent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingIntentId, setGeneratingIntentId] = useState(null);
  const [schedulingIntentId, setSchedulingIntentId] = useState(null);
  const [taskRefreshKey, setTaskRefreshKey] = useState(0);
  const [generationNotice, setGenerationNotice] = useState(null);

  useEffect(() => {
    fetchIntents();
  }, []);

  const fetchIntents = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/intents/');
      setIntents(response.data);
    } catch (error) {
      console.error('Error fetching intents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIntentCreated = (newIntent) => {
    setIntents((prevIntents) => [newIntent, ...prevIntents]);
    setSelectedIntent(newIntent);
    setTaskRefreshKey((currentKey) => currentKey + 1);
    setGenerationNotice({
      intentId: newIntent.id,
      message: 'Tasks generated successfully',
      isError: false,
    });
  };

  const handleGenerateTasks = async (intent) => {
    setGeneratingIntentId(intent.id);
    setSelectedIntent(intent);
    setGenerationNotice(null);

    try {
      const response = await axios.post(
        `http://localhost:8000/api/intents/${intent.id}/generate-tasks/`
      );
      setGenerationNotice({
        intentId: intent.id,
        message: response.data.message,
        isError: false,
      });
      setTaskRefreshKey((currentKey) => currentKey + 1);
    } catch (error) {
      setGenerationNotice({
        intentId: intent.id,
        message: 'Failed to generate tasks. Please try again.',
        isError: true,
      });
      console.error('Error generating tasks:', error);
    } finally {
      setGeneratingIntentId(null);
    }
  };

  const handleGenerateSchedule = async (intent) => {
    setSchedulingIntentId(intent.id);
    setSelectedIntent(intent);
    setGenerationNotice(null);

    try {
      const response = await axios.post(
        `http://localhost:8000/api/intents/${intent.id}/schedule/`
      );
      setGenerationNotice({
        intentId: intent.id,
        message: response.data.message,
        isError: false,
      });
      setTaskRefreshKey((currentKey) => currentKey + 1);
    } catch (error) {
      setGenerationNotice({
        intentId: intent.id,
        message: 'Failed to generate schedule. Please try again.',
        isError: true,
      });
      console.error('Error generating schedule:', error);
    } finally {
      setSchedulingIntentId(null);
    }
  };

  return (
    <div className="flex bg-gray-50 min-h-screen">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 overflow-y-auto">
        {activeTab === 'dashboard' ? (
          <Dashboard activeTab={activeTab} />
        ) : activeTab === 'analytics' ? (
          <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto animate-fade-in">
            <Analytics />
          </div>
        ) : (
          <div className="py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto text-center mb-10">
              <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                IntentOS
              </h1>
              <p className="mt-3 text-lg text-gray-500">
                Capture intents and manage the manual tasks behind them.
              </p>
            </div>

            <IntentForm onIntentCreated={handleIntentCreated} />
            
            {loading ? (
              <div className="text-center text-gray-500">Loading intents...</div>
            ) : (
              <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-6 items-start">
                <IntentList
                  intents={intents}
                  selectedIntentId={selectedIntent?.id}
                  onSelectIntent={setSelectedIntent}
                  onGenerateTasks={handleGenerateTasks}
                  generatingIntentId={generatingIntentId}
                  onGenerateSchedule={handleGenerateSchedule}
                  schedulingIntentId={schedulingIntentId}
                />
                <TaskPanel
                  intent={selectedIntent}
                  refreshKey={taskRefreshKey}
                  generationNotice={generationNotice}
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
