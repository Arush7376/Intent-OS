import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Target, CheckCircle2, Clock, ListTodo } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, colorClass }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center space-x-4 transition-transform hover:scale-105 duration-200 cursor-default">
    <div className={`p-3 rounded-lg ${colorClass}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

const Dashboard = ({ activeTab }) => {
  const [overview, setOverview] = useState(null);
  const [todayTasks, setTodayTasks] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [progress, setProgress] = useState([]);
  const [recent, setRecent] = useState({ intents: [], completed_tasks: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTab !== 'dashboard') return;
    
    let isMounted = true;
    
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [overviewRes, todayRes, upcomingRes, progressRes, recentRes] = await Promise.all([
          axios.get('http://localhost:8000/api/dashboard/overview/'),
          axios.get('http://localhost:8000/api/dashboard/today/'),
          axios.get('http://localhost:8000/api/dashboard/upcoming/'),
          axios.get('http://localhost:8000/api/dashboard/progress/'),
          axios.get('http://localhost:8000/api/dashboard/recent/')
        ]);

        if (isMounted) {
            setOverview(overviewRes.data);
            setTodayTasks(todayRes.data);
            setUpcomingTasks(upcomingRes.data);
            setProgress(progressRes.data);
            setRecent(recentRes.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        if (isMounted) {
            setLoading(false);
        }
      }
    };

    fetchDashboardData();
    
    return () => { isMounted = false; };
  }, [activeTab]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex justify-between items-end mb-6">
        <div>
            <h2 className="text-3xl font-extrabold text-gray-900">Productivity Dashboard</h2>
            <p className="mt-2 text-sm text-gray-500">Monitor your workflows, tasks, and progress.</p>
        </div>
      </div>
      
      {/* Stats Overview */}
      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Intents" 
            value={overview.total_intents} 
            icon={Target} 
            colorClass="bg-gradient-to-br from-blue-500 to-blue-600" 
          />
          <StatCard 
            title="Total Tasks" 
            value={overview.total_tasks} 
            icon={ListTodo} 
            colorClass="bg-gradient-to-br from-indigo-500 to-indigo-600" 
          />
          <StatCard 
            title="Completed" 
            value={overview.completed_tasks} 
            icon={CheckCircle2} 
            colorClass="bg-gradient-to-br from-emerald-500 to-emerald-600" 
          />
          <StatCard 
            title="Completion Rate" 
            value={`${overview.completion_percentage}%`} 
            icon={Clock} 
            colorClass="bg-gradient-to-br from-purple-500 to-purple-600" 
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area (Tasks & Progress) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Today's Tasks */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 mr-2 animate-pulse"></span>
                Due Today
                </h3>
            </div>
            <div className="p-6 bg-gray-50/50">
                {todayTasks.length === 0 ? (
                <div className="text-center py-6">
                    <CheckCircle2 className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p className="text-sm text-gray-500 font-medium">No tasks due today. Enjoy your day!</p>
                </div>
                ) : (
                <div className="space-y-3">
                    {todayTasks.map(task => (
                    <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900 mb-1">{task.title}</span>
                        <span className="text-xs text-gray-500 flex items-center"><Target className="w-3 h-3 mr-1" /> {task.intent?.title || 'Unknown Intent'}</span>
                        </div>
                        <div className="mt-2 sm:mt-0">
                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                                {task.status}
                             </span>
                        </div>
                    </div>
                    ))}
                </div>
                )}
            </div>
          </div>

          {/* Intent Progress */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
             <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Intent Progress</h3>
             </div>
            <div className="p-6 space-y-6">
              {progress.slice(0, 5).map(intent => (
                <div key={intent.id} className="space-y-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-semibold text-gray-800">{intent.title}</span>
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{intent.completed_tasks} / {intent.total_tasks} ({intent.percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-2.5 rounded-full transition-all duration-1000 ease-out" 
                      style={{ width: `${intent.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
              {progress.length === 0 && (
                  <p className="text-sm text-gray-500 italic text-center py-4">No intents created yet.</p>
              )}
            </div>
          </div>
          
          {/* Upcoming Tasks */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-2"></span>
                Upcoming Tasks
                </h3>
            </div>
            <div className="p-6 bg-gray-50/50">
                {upcomingTasks.length === 0 ? (
                <p className="text-sm text-gray-500 italic text-center py-4">No upcoming tasks scheduled.</p>
                ) : (
                <div className="space-y-3">
                    {upcomingTasks.map(task => (
                    <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900 mb-1">{task.title}</span>
                        <span className="text-xs text-gray-500 flex items-center"><Target className="w-3 h-3 mr-1" /> {task.intent?.title || 'Unknown Intent'}</span>
                        </div>
                        <div className="mt-2 sm:mt-0">
                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Due: {task.due_date}
                             </span>
                        </div>
                    </div>
                    ))}
                </div>
                )}
            </div>
          </div>

        </div>

        {/* Sidebar / Recent Activity */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 border-b border-gray-100 pb-4">Recent Activity</h3>
            
            <div className="mb-8">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center"><Target className="w-3.5 h-3.5 mr-1.5"/> Latest Intents</h4>
              {recent.intents.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">No recent intents.</p>
              ) : (
                <ul className="space-y-4">
                    {recent.intents.map(intent => (
                    <li key={`recent-intent-${intent.id}`} className="text-sm text-gray-700 flex items-start group">
                        <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 mr-3 group-hover:scale-150 transition-transform"></div>
                        <span className="font-medium group-hover:text-indigo-600 transition-colors line-clamp-2">{intent.title}</span>
                    </li>
                    ))}
                </ul>
              )}
            </div>

            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center"><CheckCircle2 className="w-3.5 h-3.5 mr-1.5"/> Recently Completed</h4>
              {recent.completed_tasks.length === 0 ? (
                  <p className="text-xs text-gray-500 italic">No recently completed tasks.</p>
              ) : (
                <ul className="space-y-4">
                    {recent.completed_tasks.map(task => (
                    <li key={`recent-task-${task.id}`} className="text-sm text-gray-700 flex items-start group">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 mr-3 group-hover:scale-150 transition-transform"></div>
                        <span className="font-medium group-hover:text-emerald-600 transition-colors line-clamp-2">{task.title}</span>
                    </li>
                    ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
