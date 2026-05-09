import React from 'react';
import { LayoutDashboard, CheckSquare, TrendingUp } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0 flex-col hidden md:flex">
      <div className="p-6">
        <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
          IntentOS
        </h1>
      </div>
      <nav className="flex-1 px-4 space-y-2">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
            activeTab === 'dashboard'
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="font-medium">Dashboard</span>
        </button>
        <button
          onClick={() => setActiveTab('intents')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
            activeTab === 'intents'
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <CheckSquare className="w-5 h-5" />
          <span className="font-medium">Intents</span>
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
            activeTab === 'analytics'
              ? 'bg-indigo-50 text-indigo-700'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          <span className="font-medium">Analytics</span>
        </button>
      </nav>
    </div>
  );
};

export default Sidebar;
