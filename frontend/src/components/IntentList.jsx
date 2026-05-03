const IntentList = ({
  intents,
  selectedIntentId,
  onSelectIntent,
  onGenerateTasks,
  generatingIntentId,
}) => {
  if (intents.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto text-center p-6 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
        No intents documented yet. Create one above!
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      {intents.map((intent) => (
        <article
          key={intent.id}
          className={`w-full bg-white p-5 rounded-lg shadow-sm border transition duration-200 ${
            selectedIntentId === intent.id
              ? 'border-indigo-500 ring-2 ring-indigo-100'
              : 'border-gray-100 hover:border-gray-300 hover:shadow-md'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-2">
            <button
              type="button"
              onClick={() => onSelectIntent(intent)}
              className="min-w-0 flex-1 text-left"
            >
              <h3 className="text-lg font-bold text-gray-900">{intent.title}</h3>
            </button>
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
              {new Date(intent.created_at).toLocaleDateString()}
            </span>
          </div>
          {intent.description && (
            <p className="text-gray-600 text-sm mt-2 leading-relaxed">
              {intent.description}
            </p>
          )}
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => onGenerateTasks(intent)}
              disabled={generatingIntentId === intent.id}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingIntentId === intent.id ? 'Generating...' : 'Generate Tasks'}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
};

export default IntentList;
