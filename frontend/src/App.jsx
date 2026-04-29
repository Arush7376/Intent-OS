import { useState, useEffect } from 'react';
import axios from 'axios';
import IntentForm from './components/IntentForm';
import IntentList from './components/IntentList';
import TaskPanel from './components/TaskPanel';

function App() {
  const [intents, setIntents] = useState([]);
  const [selectedIntent, setSelectedIntent] = useState(null);
  const [loading, setLoading] = useState(true);

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
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
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
          />
          <TaskPanel intent={selectedIntent} />
        </div>
      )}
    </div>
  );
}

export default App;
