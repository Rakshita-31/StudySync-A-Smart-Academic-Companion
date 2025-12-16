// File: src/components/pages/Analytics.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../../firebase/firebaseConfig';
import { collection, query, where, orderBy, onSnapshot, doc } from 'firebase/firestore'; 
import { AcademicCapIcon, ListBulletIcon, DocumentTextIcon, ClockIcon } from '@heroicons/react/24/outline'; // 🎯 NEW: Added ClockIcon
import { format, subDays } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts'; // 🎯 NEW: Added Cell for styling


// Custom hook to get a single document (for fetching user data and historical GPA)
const useFirestoreDocument = (collectionName, docId) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!docId) {
            setLoading(false);
            return;
        }

        const docRef = doc(db, collectionName, docId);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                setData(docSnap.data());
            } else {
                setData(null);
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching document:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [collectionName, docId]);

    return { data, loading };
};

// 🎯 NEW: Helper function to format seconds into a readable string
const formatDuration = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
};


const Analytics = () => {
    const { currentUser } = useAuth();
    const [recentActivities, setRecentActivities] = useState([]);
    const [journals, setJournals] = useState([]);
    const [taskData, setTaskData] = useState([]);
    const [journalData, setJournalData] = useState([]);
    const [focusSessions, setFocusSessions] = useState([]);
    const [focusData, setFocusData] = useState([]);
    const [gpaData, setGpaData] = useState([]);
    
    // 🎯 NEW STATE: To hold cumulative time by topic
    const [topicTimeSummary, setTopicTimeSummary] = useState([]); 

    const [loading, setLoading] = useState(true);

    // Fetch user data for historical GPA
    const { data: userData, loading: userLoading } = useFirestoreDocument('users', currentUser?.uid);

    // Combined loading state
    useEffect(() => {
        if (!userLoading) {
            setLoading(false);
        }
    }, [userLoading]);

    // Firestore listener for recent activities (Task Completion) - UNCHANGED
    useEffect(() => {
        if (!currentUser) return;
        const last7DaysDate = subDays(new Date(), 7);
        const q = query(
            collection(db, 'recentActivity'),
            where('uid', '==', currentUser.uid),
            where('timestamp', '>=', last7DaysDate),
            orderBy('timestamp', 'desc') 
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const activities = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp.toDate()
            }));
            setRecentActivities(activities);
        }, (error) => {
            console.error("Error fetching recent activities:", error); 
        });
        return () => unsubscribe();
    }, [currentUser]);

    // Firestore listener for journal entries - UNCHANGED
    useEffect(() => {
        if (!currentUser) return;
        const last30DaysDate = subDays(new Date(), 30);
        const q = query(
            collection(db, 'journals'),
            where('uid', '==', currentUser.uid),
            where('timestamp', '>=', last30DaysDate),
            orderBy('timestamp', 'desc')
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const journalEntries = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate()
            }));
            setJournals(journalEntries.filter(entry => entry.timestamp));
        });
        return () => unsubscribe();
    }, [currentUser]);

    // Firestore listener for focus sessions (Focus Time) - UNCHANGED
    useEffect(() => {
        if (!currentUser) return;
        const last30DaysDate = subDays(new Date(), 30);
        const q = query(
            collection(db, 'focusSessions'),
            where('uid', '==', currentUser.uid), 
            where('completedAt', '>=', last30DaysDate),
            orderBy('completedAt', 'desc')             
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const sessions = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                completedAt: doc.data().completedAt?.toDate() 
            }));
            setFocusSessions(sessions.filter(session => session.completedAt)); 
        }, (error) => {
            console.error("Error fetching focus sessions:", error);
        });
        return () => unsubscribe();
    }, [currentUser]);

    // Data processing for Task Completion Chart - UNCHANGED
    useEffect(() => {
        const getTaskDataForChart = () => {
            const last7Days = [];
            for (let i = 6; i >= 0; i--) {
                const date = subDays(new Date(), i);
                last7Days.push({
                    name: format(date, 'MMM d'),
                    tasksCompleted: 0,
                    dateString: format(date, 'yyyy-MM-dd')
                });
            }
            recentActivities.forEach(activity => {
                if (activity.type && activity.type.startsWith('Task Completed')) {
                    const activityDateString = format(activity.timestamp, 'yyyy-MM-dd');
                    const index = last7Days.findIndex(day => day.dateString === activityDateString);
                    if (index !== -1) {
                        last7Days[index].tasksCompleted += 1;
                    }
                }
            });
            return last7Days;
        };
        setTaskData(getTaskDataForChart());
    }, [recentActivities]);

    // Data processing for Journaling Consistency Chart - UNCHANGED
    useEffect(() => {
        const getJournalDataForChart = () => {
            const last30Days = [];
            for (let i = 29; i >= 0; i--) {
                const date = subDays(new Date(), i);
                last30Days.push({
                    name: format(date, 'MMM d'),
                    entries: 0,
                    dateString: format(date, 'yyyy-MM-dd')
                });
            }
            journals.forEach(journal => {
                const journalDateString = format(journal.timestamp, 'yyyy-MM-dd');
                const index = last30Days.findIndex(day => day.dateString === journalDateString);
                if (index !== -1) {
                    last30Days[index].entries += 1; 
                }
            });
            return last30Days;
        };
        setJournalData(getJournalDataForChart());
    }, [journals]);

    // Data processing for Focus Session Trends Chart - UNCHANGED
    useEffect(() => {
        const getFocusDataForChart = () => {
            const last30Days = [];
            for (let i = 29; i >= 0; i--) {
                const date = subDays(new Date(), i);
                last30Days.push({
                    name: format(date, 'MMM d'),
                    'Focus Time': 0,
                    dateString: format(date, 'yyyy-MM-dd')
                });
            }
            focusSessions.forEach(session => {
                const sessionDateString = format(session.completedAt, 'yyyy-MM-dd'); 
                const index = last30Days.findIndex(day => day.dateString === sessionDateString);
                if (index !== -1) {
                    last30Days[index]['Focus Time'] += session.duration / 3600; 
                }
            });
            return last30Days;
        };
        setFocusData(getFocusDataForChart());
    }, [focusSessions]);
    
    // 🎯 NEW DATA PROCESSING: Calculate cumulative time by topic
    useEffect(() => {
        const getTopicTimeSummary = () => {
            const topicMap = {};
            
            // 1. Accumulate duration by topic
            focusSessions.forEach(session => {
                // Ensure topic is a string and default to 'Untitled'
                const topicKey = (session.topic || 'Untitled Session').trim(); 
                
                topicMap[topicKey] = (topicMap[topicKey] || 0) + session.duration;
            });

            // 2. Convert map to array for display, sorted by total time
            const summaryArray = Object.keys(topicMap)
                .map(topic => ({
                    topic: topic,
                    duration: topicMap[topic], // in seconds
                    formattedDuration: formatDuration(topicMap[topic]) // formatted string
                }))
                .sort((a, b) => b.duration - a.duration); // Sort descending

            return summaryArray;
        };
        setTopicTimeSummary(getTopicTimeSummary());
    }, [focusSessions]); // Recalculate whenever focusSessions changes

    // Data processing for GPA Progress Chart - UNCHANGED
    useEffect(() => {
        if (!userData || !userData.previousSemesters) return;
        const formattedGpaData = userData.previousSemesters.map((sem, index) => ({
            // This relies on your file name being GpaCalc, which you noted earlier!
            name: `Semester ${index + 1}`, 
            gpa: parseFloat(sem.gpa)
        }));
        setGpaData(formattedGpaData);
    }, [userData]);


    if (loading) {
        return <div className="min-h-screen bg-slate-950 text-slate-200 flex justify-center items-center">Loading...</div>;
    }

    // --- RENDER ---
    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
            <h1 className="text-3xl font-bold text-violet-400 mb-8">Your Analytics Dashboard</h1>

            {/* Header Cards: Added Focus Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8"> {/* Changed to 4 columns */}
                <div className="bg-slate-800 p-6 rounded-3xl flex items-center space-x-4 transition-all duration-300 hover:translate-y-[-10px] hover:border-violet-600 border border-transparent">
                    <div className="bg-violet-600 p-3 rounded-full">
                        <AcademicCapIcon className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <p className="text-lg font-semibold">Overall Progress</p>
                        <p className="text-sm text-slate-400">GPA and academic trends.</p>
                    </div>
                </div>
                <div className="bg-slate-800 p-6 rounded-3xl flex items-center space-x-4 transition-all duration-300 hover:translate-y-[-10px] hover:border-violet-600 border border-transparent">
                    <div className="bg-emerald-600 p-3 rounded-full">
                        <ListBulletIcon className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <p className="text-lg font-semibold">Task Performance</p>
                        <p className="text-sm text-slate-400">Tasks completed over time.</p>
                    </div>
                </div>
                <div className="bg-slate-800 p-6 rounded-3xl flex items-center space-x-4 transition-all duration-300 hover:translate-y-[-10px] hover:border-violet-600 border border-transparent">
                    <div className="bg-cyan-600 p-3 rounded-full">
                        <DocumentTextIcon className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <p className="text-lg font-semibold">Journaling Habits</p>
                        <p className="text-sm text-slate-400">Consistency in your writing.</p>
                    </div>
                </div>
                <div className="bg-slate-800 p-6 rounded-3xl flex items-center space-x-4 transition-all duration-300 hover:translate-y-[-10px] hover:border-violet-600 border border-transparent">
                    <div className="bg-amber-500 p-3 rounded-full">
                        <ClockIcon className="h-8 w-8 text-white" /> {/* 🎯 NEW: Clock Icon */}
                    </div>
                    <div>
                        <p className="text-lg font-semibold">Focus Breakdown</p>
                        <p className="text-sm text-slate-400">Time spent by topic.</p>
                    </div>
                </div>
            </div>

            {/* Main Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* 🎯 NEW: Topic Time Summary */}
                <div className="bg-slate-800 p-6 rounded-3xl transition-all duration-300 hover:translate-y-[-10px] hover:border-violet-600 border border-transparent row-span-2"> {/* Takes up space of 2 normal charts */}
                    <h2 className="text-xl font-semibold mb-4 text-violet-400">Total Focus Time by Topic</h2>
                    
                    <div className="max-h-[660px] overflow-y-auto pr-2"> {/* Added scrollable container */}
                        {topicTimeSummary.length > 0 ? (
                            <ul className="space-y-4">
                                {topicTimeSummary.map((item, index) => (
                                    <li key={index} className="flex justify-between items-center p-4 bg-slate-700/50 rounded-xl shadow-md border-l-4 border-emerald-500">
                                        <p className="text-lg font-medium text-white truncate mr-4">{item.topic}</p>
                                        <p className="text-xl font-bold text-emerald-400 flex-shrink-0">{item.formattedDuration}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-slate-400 italic mt-8 text-center">No focus sessions with topics saved yet. Start a session!</p>
                        )}
                    </div>
                </div>
                
                {/* Task Completion Rate Chart - UNCHANGED */}
                <div className="bg-slate-800 p-6 rounded-3xl transition-all duration-300 hover:translate-y-[-10px] hover:border-violet-600 border border-transparent">
                    <h2 className="text-xl font-semibold mb-4 text-violet-400">Task Completion Rate (Last 7 Days)</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={taskData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <XAxis dataKey="name" stroke="#64748b" />
                            <YAxis allowDecimals={false} stroke="#64748b" />
                            <Tooltip
                                cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '0.75rem' }}
                                labelStyle={{ color: '#c4b5fd' }}
                                itemStyle={{ color: '#cbd5e1' }}
                            />
                            <Bar dataKey="tasksCompleted" name="Tasks Completed" fill="#8b5cf6" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Focus Session Trends Chart (Bar Chart) - UNCHANGED */}
                <div className="bg-slate-800 p-6 rounded-3xl transition-all duration-300 hover:translate-y-[-10px] hover:border-violet-600 border border-transparent">
                    <h2 className="text-xl font-semibold mb-4 text-violet-400">Focus Time (Last 30 Days)</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={focusData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <XAxis dataKey="name" stroke="#64748b" />
                            <YAxis stroke="#64748b" />
                            <Tooltip
                                cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '0.75rem' }}
                                labelStyle={{ color: '#c4b5fd' }}
                                itemStyle={{ color: '#cbd5e1' }}
                                formatter={(value) => [`Focus Time: ${value.toFixed(2)}H`, 'Focus Time']}
                            />
                            <Bar dataKey="Focus Time" fill="#82ca9d" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Journaling Consistency Chart - MOVED TO NEW ROW */}
                <div className="bg-slate-800 p-6 rounded-3xl transition-all duration-300 hover:translate-y-[-10px] hover:border-violet-600 border border-transparent">
                    <h2 className="text-xl font-semibold mb-4 text-violet-400">Journaling Consistency (Last 30 Days)</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={journalData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <XAxis dataKey="name" stroke="#64748b" />
                            <YAxis allowDecimals={false} stroke="#64748b" />
                            <Tooltip
                                cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '0.75rem' }}
                                labelStyle={{ color: '#c4b5fd' }}
                                itemStyle={{ color: '#cbd5e1' }}
                            />
                            <Bar dataKey="entries" name="Entries" fill="#4d7c0f" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* GPA Progress Chart (Line Chart) - MOVED TO NEW ROW */}
                <div className="bg-slate-800 p-6 rounded-3xl transition-all duration-300 hover:translate-y-[-10px] hover:border-violet-600 border border-transparent">
                    <h2 className="text-xl font-semibold mb-4 text-violet-400">GPA Progress</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart
                            data={gpaData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <XAxis dataKey="name" stroke="#64748b" />
                            <YAxis domain={[0, 4.0]} stroke="#64748b" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '0.75rem' }}
                                labelStyle={{ color: '#c4b5fd' }}
                                itemStyle={{ color: '#cbd5e1' }}
                            />
                            <Line type="monotone" dataKey="gpa" stroke="#8b5cf6" strokeWidth={2} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Analytics;