import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, AlertCircle, Zap, CalendarClock, ShieldAlert, CheckCircle } from 'lucide-react';

const AdaptationPanel = () => {
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/api/adaptation/status/');
      setStatusData(response.data);
    } catch (error) {
      console.error('Error fetching adaptation status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleRunAdaptation = async () => {
    try {
      setRunning(true);
      setRunResult(null);
      const response = await axios.post('http://localhost:8000/api/adaptation/run/');
      setRunResult(response.data);
      // Refresh status after running
      await fetchStatus();
    } catch (error) {
      console.error('Error running adaptation:', error);
      setRunResult({ error: 'Failed to run adaptation engine.' });
    } finally {
      setRunning(false);
    }
  };

  if (loading && !statusData) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-8">
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900 flex items-center">
          <Zap className="w-8 h-8 text-amber-500 mr-3" />
          Smart Adjustments
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          The Adaptation Engine dynamically balances your workload based on your behavior.
        </p>
      </div>

      {statusData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Activity className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Workload Limit</h3>
            </div>
            <div>
              <p className="text-4xl font-black text-indigo-600">{statusData.workload_limit}</p>
              <p className="text-sm text-gray-500 mt-1">Maximum tasks per day</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Recent Productivity</h3>
            </div>
            <div>
              <p className="text-4xl font-black text-emerald-600">{statusData.recent_completed}</p>
              <p className="text-sm text-gray-500 mt-1">Completed in last 7 days</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-rose-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Missed Tasks</h3>
            </div>
            <div>
              <p className="text-4xl font-black text-rose-600">{statusData.recent_missed}</p>
              <p className="text-sm text-gray-500 mt-1">Pending past due date</p>
            </div>
          </div>
        </div>
      )}

      {statusData?.needs_recovery && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg flex items-start space-x-3">
          <ShieldAlert className="w-6 h-6 text-amber-600 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-amber-800">Burnout Warning</h4>
            <p className="text-sm text-amber-700 mt-1">
              You have a high number of missed tasks recently. The engine will insert a light recovery day to help you catch up without feeling overwhelmed.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Adaptation Engine Trigger</h3>
            <p className="text-sm text-gray-500 mt-1">Manually run the engine to balance schedules and reschedule overdue tasks.</p>
          </div>
          <button
            onClick={handleRunAdaptation}
            disabled={running}
            className={`mt-4 sm:mt-0 px-6 py-2.5 rounded-lg text-white font-medium flex items-center space-x-2 transition-all ${
              running ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md hover:shadow-lg hover:-translate-y-0.5'
            }`}
          >
            {running ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Adapting...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Run Engine</span>
              </>
            )}
          </button>
        </div>

        {runResult && !runResult.error && (
          <div className="p-6 bg-emerald-50/50 border-t border-emerald-100">
            <div className="flex items-center space-x-2 text-emerald-800 mb-4">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Adaptation Successful</span>
            </div>
            <ul className="space-y-2 text-sm text-emerald-700">
              <li className="flex items-center"><CalendarClock className="w-4 h-4 mr-2"/> {runResult.rescheduled_count} task(s) rescheduled from the past.</li>
              <li className="flex items-center"><Activity className="w-4 h-4 mr-2"/> Daily workload threshold set to {runResult.workload_limit} tasks.</li>
              {runResult.recovery_days_inserted > 0 && (
                <li className="flex items-center"><ShieldAlert className="w-4 h-4 mr-2"/> {runResult.recovery_days_inserted} recovery day(s) inserted into your schedule.</li>
              )}
            </ul>
          </div>
        )}

        {runResult && runResult.error && (
          <div className="p-6 bg-rose-50/50 border-t border-rose-100">
            <div className="flex items-center space-x-2 text-rose-800">
              <AlertCircle className="w-5 h-5" />
              <span className="font-semibold">Error: {runResult.error}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdaptationPanel;
