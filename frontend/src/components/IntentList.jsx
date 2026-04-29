const IntentList = ({ intents, selectedIntentId, onSelectIntent }) => {
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
        <button
          type="button"
          key={intent.id}
          onClick={() => onSelectIntent(intent)}
          className={`w-full text-left bg-white p-5 rounded-lg shadow-sm border transition duration-200 ${
            selectedIntentId === intent.id
              ? 'border-indigo-500 ring-2 ring-indigo-100'
              : 'border-gray-100 hover:border-gray-300 hover:shadow-md'
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-bold text-gray-900">{intent.title}</h3>
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
              {new Date(intent.created_at).toLocaleDateString()}
            </span>
          </div>
          {intent.description && (
            <p className="text-gray-600 text-sm mt-2 leading-relaxed">
              {intent.description}
            </p>
          )}
        </button>
      ))}
    </div>
  );
};

export default IntentList;
