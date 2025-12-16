import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PlusIcon, PlayIcon, DocumentArrowUpIcon, CalculatorIcon, MagnifyingGlassIcon, BellIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import moment from 'moment';

// Hook Imports with Corrected Paths (Assuming Dashboard.jsx is in src/components/pages)
import useFirestoreCollection from '../../hooks/useFirestoreCollection'; 
import useFirestoreCount from '../../hooks/useFirestoreCount';
import { useRecentActivity } from '../../hooks/useRecentActivity'; 
import useGpa from '../../hooks/useGpa'; // <-- NEW: Dedicated hook for GPA
import useStudyStreak from '../../hooks/useStudyStreak'; // <-- NEW: Dedicated hook for Streak

const debounce = (func, delay) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
};

const getGreeting = () => {
    const hour = moment().hour();
    if (hour < 12) {
        return "Good Morning!";
    } else if (hour < 18) {
        return "Good Afternoon!";
    } else {
        return "Good Evening!";
    }
};

const Dashboard = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    
    const [searchQuery, setSearchQuery] = useState('');
    
    const debouncedSetSearchQuery = useMemo(() => debounce(setSearchQuery, 300), []);

    // 🎯 Hooks for Data Fetching
    
    // GPA (FIXED)
    const { currentGpa, loadingGpa } = useGpa();

    // Study Streak (FIXED)
    const { streak: studyStreak, loading: loadingStreak } = useStudyStreak();
    
    // Recent Activity (Existing hook)
    const { activity: recentActivity, loading: recentLoading } = useRecentActivity();
    
    // Upcoming Tasks (Existing logic)
    const upcomingTasksOptions = useMemo(() => ({
        limit: 5, 
        where: { field: 'completed', operator: '==', value: false }
    }), []);
    const { data: upcomingTasks, loading: tasksLoading } = useFirestoreCollection('tasks', currentUser?.uid, upcomingTasksOptions); 
    
    // Tasks Completed Count (Existing logic)
    const tasksCompletedOptions = useMemo(() => ({
        where: { field: 'completed', operator: '==', value: true }
    }), []);
    const { count: tasksCompletedCount, loading: countLoading } = useFirestoreCount('tasks', currentUser?.uid, tasksCompletedOptions);
    
    // Total Focus Time (Existing logic)
    const focusSessionsOptions = useMemo(() => ({}), []);
    const { data: focusSessions, loading: sessionsLoading } = useFirestoreCollection('focusSessions', currentUser?.uid, focusSessionsOptions);
    
    const totalFocusTimeInSeconds = (focusSessions || []).reduce((total, session) => total + session.duration, 0);
    const totalFocusTimeInHours = (totalFocusTimeInSeconds / 3600).toFixed(1);

    // Loading Check - All stats must be ready
    if (!currentUser || recentLoading || tasksLoading || countLoading || sessionsLoading || loadingGpa || loadingStreak) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-slate-950 text-slate-200 p-8">
                <p>Loading Dashboard...</p>
            </div>
        );
    }

    // Filtered lists for Search functionality
    const filteredRecentActivity = recentActivity && recentActivity.filter(item =>
        item.type.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const filteredUpcomingTasks = upcomingTasks && upcomingTasks.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.subject && item.subject.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
            {/* Header and Search Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6">
                <div className="text-left mb-4 md:mb-0">
                    <h1 className="text-3xl font-bold">{getGreeting()}</h1>
                    <p className="text-slate-400">The only way to do great work is to love what you do.</p>
                </div>
                <div className="relative w-full md:w-1/3">
                    <input
                        type="text"
                        placeholder="Search tasks, notes, or subjects..."
                        onChange={(e) => debouncedSetSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-full bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                </div>
            </div>

            {/* Welcome Banner */}
            <div className="bg-slate-800 p-8 rounded-3xl text-center mb-8">
                <h2 className="text-4xl font-extrabold text-white">Welcome to StudySync</h2>
                <p className="text-slate-400 mt-2">Your smart academic companion for better productivity.</p>
            </div>

            {/* Stats Cards (Now Dynamic) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-slate-800 p-6 rounded-3xl flex items-center space-x-4 transition-all duration-300 hover:scale-105 hover:border-violet-600 hover:ring-2 hover:ring-violet-600">
                    <div className="bg-emerald-600 p-3 rounded-full">
                        <DocumentArrowUpIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-400">Tasks Completed</p>
                        <p className="text-2xl font-bold">
                            {tasksCompletedCount}
                        </p>
                    </div>
                </div>
                <div className="bg-slate-800 p-6 rounded-3xl flex items-center space-x-4 transition-all duration-300 hover:scale-105 hover:border-violet-600 hover:ring-2 hover:ring-violet-600">
                    <div className="bg-cyan-600 p-3 rounded-full">
                        <PlayIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-400">Focus Time</p>
                        <p className="text-2xl font-bold">{totalFocusTimeInHours}H</p>
                    </div>
                </div>
                <div className="bg-slate-800 p-6 rounded-3xl flex items-center space-x-4 transition-all duration-300 hover:scale-105 hover:border-violet-600 hover:ring-2 hover:ring-violet-600">
                    <div className="bg-indigo-600 p-3 rounded-full">
                        <BellIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-400">Study Streak</p>
                        <p className="text-2xl font-bold">{studyStreak} days</p>
                    </div>
                </div>
                <div className="bg-slate-800 p-6 rounded-3xl flex items-center space-x-4 transition-all duration-300 hover:scale-105 hover:border-violet-600 hover:ring-2 hover:ring-violet-600">
                    <div className="bg-rose-600 p-3 rounded-full">
                        <CalculatorIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-400">Current GPA</p>
                        <p className="text-2xl font-bold">{currentGpa}</p> 
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button
                        onClick={() => navigate('/tasks')}
                        className="bg-slate-800 p-6 rounded-3xl flex flex-col items-center space-y-2 hover:bg-slate-700 transition-all duration-300 hover:scale-105 hover:ring-2 hover:ring-violet-600"
                    >
                        <div className="bg-violet-600 p-3 rounded-full">
                            <PlusIcon className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-sm font-semibold">Add New Task</span>
                    </button>
                    <button
                        onClick={() => navigate('/focustimer')}
                        className="bg-slate-800 p-6 rounded-3xl flex flex-col items-center space-y-2 hover:bg-slate-700 transition-all duration-300 hover:scale-105 hover:ring-2 hover:ring-violet-600"
                    >
                        <div className="bg-orange-500 p-3 rounded-full">
                            <PlayIcon className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-sm font-semibold">Start Focus Session</span>
                    </button>
                    <button
                        onClick={() => navigate('/journal')}
                        className="bg-slate-800 p-6 rounded-3xl flex flex-col items-center space-y-2 hover:bg-slate-700 transition-all duration-300 hover:scale-105 hover:ring-2 hover:ring-violet-600"
                    >
                        <div className="bg-blue-500 p-3 rounded-full">
                            <PencilSquareIcon className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-sm font-semibold">Journal</span>
                    </button>
                    <button
                        // Referenced your remembered information: [2025-09-21] I changed the file name to GpaCalc.
                        onClick={() => navigate('/GpaCalc')} 
                        className="bg-slate-800 p-6 rounded-3xl flex flex-col items-center space-y-2 hover:bg-slate-700 transition-all duration-300 hover:scale-105 hover:ring-2 hover:ring-violet-600"
                    >
                        <div className="bg-purple-500 p-3 rounded-full">
                            <CalculatorIcon className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-sm font-semibold">Calculate GPA</span>
                    </button>
                </div>
            </div>

            {/* Recent Activity and Upcoming Tasks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* RECENT ACTIVITY CARD */}
                <div className="bg-slate-800 p-6 rounded-3xl transition-all duration-300 hover:scale-105 hover:ring-2 hover:ring-violet-600">
                    <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
                    <ul className="space-y-4">
                        
                        {Array.isArray(filteredRecentActivity) && filteredRecentActivity.length > 0 ? (
                            filteredRecentActivity.map(activity => (
                                <li key={activity.id} className="bg-slate-900 p-4 rounded-3xl">
                                    <p className="font-semibold text-violet-300">{activity.type}</p> 
                                    <p className="text-xs text-slate-400">{activity.description}</p>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {activity.timestamp && activity.timestamp.toDate ? moment(activity.timestamp.toDate()).fromNow() : 'Just now'}
                                    </p>
                                </li>
                            ))
                        ) : (
                            <p className="text-slate-400">No recent activity.</p>
                        )}
                    </ul>
                </div>

                {/* UPCOMING TASKS CARD */}
                <div className="bg-slate-800 p-6 rounded-3xl transition-all duration-300 hover:scale-105 hover:ring-2 hover:ring-violet-600">
                    <h3 className="text-lg font-bold mb-4">Upcoming Tasks</h3>
                    <ul className="space-y-4">
                        
                        {Array.isArray(filteredUpcomingTasks) && filteredUpcomingTasks.length > 0 ? (
                            filteredUpcomingTasks.map(task => (
                                <li key={task.id} className="bg-slate-900 p-4 rounded-3xl flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold">{task.title}</p>
                                        <p className="text-xs text-slate-400">
                                            {task.subject && <span className="mr-2">{task.subject}</span>}
                                        </p>
                                    </div>
                                    <span className="text-xs text-slate-400">
                                        Due {moment(task.due.toDate ? task.due.toDate() : task.due).calendar(null, {
                                            lastDay: '[Yesterday]',
                                            sameDay: '[Today]',
                                            nextDay: '[Tomorrow]',
                                            lastWeek: '[last] dddd',
                                            nextWeek: '[next] dddd',
                                            sameElse: 'MMMM D'
                                        })}
                                    </span>
                                </li>
                            ))
                        ) : (
                            <p className="text-slate-400">No upcoming tasks.</p>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;