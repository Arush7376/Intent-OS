import React, { useState } from 'react';
import api from '../services/api';
import AIWorkflowPreview from './AIWorkflowPreview';

const IntentForm = ({ onIntentCreated }) => {
  const [naturalInput, setNaturalInput] = useState('');
  const [loadingStep, setLoadingStep] = useState(null); // 'analyzing', 'generating', null
  const [error, setError] = useState(null);
  
  const [intentData, setIntentData] = useState(null);
  const [workflow, setWorkflow] = useState(null);

  const suggestedPrompts = [
    "I want to crack CEH in 60 days while managing gym and college.",
    "Build a modern React app portfolio over the weekend.",
    "Train for a 10k marathon in 3 months with knee constraints."
  ];

  const handleAIProcess = async (e) => {
    e.preventDefault();
    if (!naturalInput.trim()) return;

    setError(null);
    
    try {
      // Step 1: Analyze Intent
      setLoadingStep('analyzing');
      const analysisRes = await api.post('ai/analyze-intent/', { text: naturalInput });
      const analyzedData = analysisRes.data;
      setIntentData(analyzedData);

      // Step 2: Generate Workflow
      setLoadingStep('generating');
      const workflowRes = await api.post('ai/generate-workflow/', { 
        text: naturalInput, 
        intent_data: analyzedData 
      });
      setWorkflow(workflowRes.data);
      
    } catch (err) {
      setError('AI processing failed. Please ensure GEMINI_API_KEY is configured.');
      console.error(err);
    } finally {
      setLoadingStep(null);
    }
  };

  const handleAccept = async () => {
    setLoadingStep('saving');
    setError(null);

    try {
      // Flatten hierarchy tasks
      const aiTasks = [];
      workflow.hierarchy?.phases?.forEach(phase => {
        phase.tasks?.forEach(task => {
          aiTasks.push({
            title: `[${phase.phase_name}] ${task.title}`,
            description: task.description || ''
          });
        });
      });

      const response = await api.post('intents/', {
        title: `${intentData.category} - ${intentData.timeline}`,
        description: naturalInput,
        ai_tasks: aiTasks
      });
      
      onIntentCreated(response.data);
      
      // Reset
      setNaturalInput('');
      setIntentData(null);
      setWorkflow(null);
    } catch (err) {
      setError('Failed to save intent.');
      console.error(err);
    } finally {
      setLoadingStep(null);
    }
  };

  const handleDiscard = () => {
    setIntentData(null);
    setWorkflow(null);
    setNaturalInput('');
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      {!workflow ? (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <span className="text-6xl">✨</span>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-2 tracking-tight">What do you want to achieve?</h2>
          <p className="text-gray-500 mb-6 text-sm">Describe your goal naturally, and our AI will build a complete workflow for you.</p>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleAIProcess} className="space-y-4">
            <div>
              <textarea
                value={naturalInput}
                onChange={(e) => setNaturalInput(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition resize-none text-gray-800"
                rows="4"
                placeholder="e.g. I want to crack CEH in 60 days while managing gym and college..."
                disabled={loadingStep !== null}
              />
            </div>

            {loadingStep ? (
              <div className="flex flex-col items-center justify-center py-4 space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                <p className="text-sm font-medium text-indigo-600 animate-pulse">
                  {loadingStep === 'analyzing' ? 'Understanding your constraints...' : 'Building your optimal workflow...'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-gray-400 font-medium py-1">Try:</span>
                  {suggestedPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNaturalInput(prompt)}
                      className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2 py-1 rounded transition"
                    >
                      Prompt {idx + 1}
                    </button>
                  ))}
                </div>
                
                <button
                  type="submit"
                  disabled={!naturalInput.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow flex items-center gap-2 whitespace-nowrap"
                >
                  <span>✨</span> Generate Plan
                </button>
              </div>
            )}
          </form>
        </div>
      ) : (
        <AIWorkflowPreview 
          workflow={workflow} 
          intentData={intentData}
          onAccept={handleAccept}
          onDiscard={handleDiscard}
        />
      )}
    </div>
  );
};

export default IntentForm;
