import { useState, useEffect } from 'react';
import axios from 'axios';
import IntentForm from './components/IntentForm';
import IntentList from './components/IntentList';

function App() {
  const [intents, setIntents] = useState([]);
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
    // Add the new intent to the top of the list
    setIntents((prevIntents) => [newIntent, ...prevIntents]);
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto text-center mb-10">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
          IntentOS
        </h1>
        <p className="mt-3 text-lg text-gray-500">
          Document your intents clearly and build the future.
        </p>
      </div>

      <IntentForm onIntentCreated={handleIntentCreated} />
      
      {loading ? (
        <div className="text-center text-gray-500">Loading intents...</div>
      ) : (
        <IntentList intents={intents} />
      )}
    </div>
  );
}

export default App;
