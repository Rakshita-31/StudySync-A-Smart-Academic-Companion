import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { collection, query, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import AddTaskModal from '../AddTaskModal';
import { PlusIcon, MagnifyingGlassIcon, TrashIcon } from '@heroicons/react/24/outline';
import moment from 'moment';
import { logRecentActivity } from '../../firebase/utils';

const Tasks = () => {
    const { currentUser } = useAuth();
    
    const [tasks, setTasks] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterPriority, setFilterPriority] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    // FIX 1: New state to track notification permission status
    const [notificationStatus, setNotificationStatus] = useState('default');

    // FIX 1: EFFECT TO REQUEST NOTIFICATION PERMISSION
    useEffect(() => {
        if (!("Notification" in window)) {
            console.warn("This browser does not support desktop notification.");
            return;
        }

        // Check current status and request if needed
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                setNotificationStatus(permission);
            });
        } else {
            setNotificationStatus(Notification.permission);
        }
    }, []);

    // Effect: LISTEN, FETCH, and FILTER (UNMODIFIED)
    useEffect(() => {
        if (!currentUser || !currentUser.uid) {
            setTasks([]);
            return;
        }
        
        const tasksQuery = query(
            collection(db, 'tasks'),
            where('uid', '==', currentUser.uid)
        );

        const unsubscribe = onSnapshot(tasksQuery, (querySnapshot) => {
            const rawTasks = querySnapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            }));

            const filteredTasks = rawTasks.filter(task => {
                const taskTitle = task.title || '';
                const taskSubject = task.subject || '';
                const taskPriority = task.priority || 'medium'; 
                const taskCompleted = task.completed === true; 
                
                const matchesSearch =
                    taskTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    taskSubject.toLowerCase().includes(searchQuery.toLowerCase());

                const matchesPriority =
                    filterPriority === 'All' || taskPriority.toLowerCase() === filterPriority.toLowerCase();

                const matchesStatus =
                    filterStatus === 'All' ||
                    (filterStatus === 'To Do' && !taskCompleted) ||
                    (filterStatus === 'Completed' && taskCompleted);
                
                return matchesSearch && matchesPriority && matchesStatus;
            });

            setTasks(filteredTasks);
        }, (error) => {
            console.error("Firestore Task Fetch Error:", error);
        });

        return () => unsubscribe();
        
    }, [currentUser, searchQuery, filterPriority, filterStatus]); 

    // FIX 2: EFFECT FOR TASK NOTIFICATIONS (IMPROVED LOGIC)
    // NOTE: This uses localStorage to prevent notifying the user about the same task repeatedly.
    useEffect(() => {
        if (notificationStatus !== 'granted') return; // Only run if permission is granted

        const interval = setInterval(() => {
            const now = moment().startOf('day'); // Start of today for clean comparison
            const alertedTasks = JSON.parse(localStorage.getItem('alertedTasks') || '{}');
            let newAlerts = false;

            tasks.forEach(task => {
                // Safely convert Firestore timestamp to a moment object
                const taskDue = task.due && task.due.toDate ? moment(task.due.toDate()).startOf('day') : null;
                const taskId = task.id;

                if (!taskDue || task.completed || alertedTasks[taskId]) {
                    return; // Skip if no due date, completed, or already notified
                }
                
                let notificationBody = '';
                
                // Case 1: Overdue (Due date is before today)
                if (taskDue.isBefore(now, 'day')) {
                    notificationBody = `Your task "${task.title}" is OVERDUE! Due on ${taskDue.format('MMMM D')}.`;
                } 
                // Case 2: Due Today
                else if (taskDue.isSame(now, 'day')) {
                    notificationBody = `Your task "${task.title}" is DUE TODAY! Priority: ${task.priority}.`;
                }

                // If we have a notification to send
                if (notificationBody) {
                    new Notification('Task Reminder: StudySync', {
                        body: notificationBody,
                        icon: '/favicon.ico', // Optionally add an icon
                        tag: taskId // Use the task ID as a tag to avoid duplicate browser notifications
                    });
                    
                    alertedTasks[taskId] = true; // Mark as alerted
                    newAlerts = true;
                }
            });

            if (newAlerts) {
                localStorage.setItem('alertedTasks', JSON.stringify(alertedTasks));
            }

        }, 30000); // Check every 30 seconds (down from 60s for faster testing)

        return () => clearInterval(interval);
    }, [tasks, notificationStatus]); // Depend on tasks and the permission status

    // ... (rest of the functions: addTask, toggleComplete, deleteTask, getPriorityColor - UNMODIFIED)
    
    const addTask = async ({ taskTitle, description, subject, priority, dueDate }) => {
        if (!currentUser || !currentUser.uid) return;
        
        try {
            await addDoc(collection(db, 'tasks'), {
                uid: currentUser.uid,
                title: taskTitle,
                description: description,
                subject: subject,
                priority: priority,
                due: dueDate, // If this is a Date object or null, the save should succeed.
                completed: false,
                timestamp: serverTimestamp()
            });
            
            try {
                logRecentActivity(currentUser.uid, `New Task Added`, `"${taskTitle}" was added to your list.`);
            } catch (activityError) {
                console.error("Error logging recent activity (IGNORING):", activityError);
            }
            
        } catch (error) {
            console.error("CRITICAL ERROR adding task:", error);
            alert(`Failed to add task due to a critical save error. Check the console for details.`);
        }
    };

    const toggleComplete = async (task) => {
        const updatedTasks = tasks.map(t =>
            t.id === task.id ? { ...t, completed: !t.completed } : t
        );
        setTasks(updatedTasks);

        try {
            await updateDoc(doc(db, 'tasks', task.id), {
                completed: !task.completed
            });
            if (!task.completed) {
                logRecentActivity(currentUser.uid, `Task Completed: ${task.title}`, `You finished the task "${task.title}".`);
            }
        } catch (error) {
            console.error("Error updating task status:", error);
            setTasks(tasks); 
        }
    };

    const deleteTask = async (id) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            await deleteDoc(doc(db, 'tasks', id));
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high':
                return 'bg-red-500';
            case 'medium':
                return 'bg-yellow-500';
            case 'low':
                return 'bg-green-500';
            default:
                return 'bg-slate-400';
        }
    };

    if (!currentUser || !currentUser.uid) {
        return (
            <div className="flex justify-center items-center h-screen bg-slate-950 text-white text-2xl font-semibold">
                Loading User Data...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
            {/* Display a warning if notifications are denied */}
            {notificationStatus === 'denied' && (
                <div className="bg-red-900 border border-red-700 text-white p-4 rounded-lg mb-4">
                    ❌ Notifications are blocked by your browser. Please change your browser settings to receive task alerts.
                </div>
            )}
            
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Task Manager</h1>
                <div className="flex items-center space-x-4">
                    <button
                        className="flex items-center space-x-2 px-6 py-3 bg-violet-600 text-white font-bold rounded-3xl hover:bg-violet-700 transition-colors"
                        onClick={() => setIsModalOpen(true)}
                    >
                        <PlusIcon className="h-5 w-5" />
                        <span>Add Task</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="relative flex-grow">
                    <input
                        type="text"
                        placeholder="Search tasks, subjects, or descriptions..."
                        className="w-full pl-10 pr-4 py-3 rounded-3xl bg-slate-800 border border-slate-700 text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                </div>
                <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="px-4 py-3 rounded-3xl bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                    <option value="All">All Priority</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                </select>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-3 rounded-3xl bg-slate-800 border border-slate-700 text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                    <option value="All">All Status</option>
                    <option value="To Do">To Do</option>
                    <option value="Completed">Completed</option>
                </select>
            </div>

            <div className="space-y-4">
                {tasks.length > 0 ? (
                    tasks.map((task) => (
                        <div key={task.id} className={`bg-slate-800 p-6 rounded-3xl transition-shadow relative`}>
                            <div className={`absolute top-0 left-0 w-full h-1 rounded-t-3xl ${task.completed ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                                <div className="h-full" style={{ width: task.completed ? '100%' : '0%' }} />
                            </div>

                            <div className="flex justify-between items-start mt-2">
                                <div className="flex items-center space-x-4">
                                    <input
                                        type="checkbox"
                                        checked={task.completed}
                                        onChange={() => toggleComplete(task)}
                                        className="form-checkbox h-5 w-5 text-violet-600 rounded-full bg-slate-700 border-slate-600"
                                    />
                                    <div>
                                        <h3 className={`text-lg font-semibold ${task.completed ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                                            {task.title}
                                        </h3>
                                        {task.description && (
                                            <p className={`text-sm text-slate-400 mt-1 ${task.completed ? 'line-through' : ''}`}>
                                                {task.description}
                                            </p>
                                        )}
                                        <div className="flex items-center space-x-2 mt-2 text-sm">
                                            {task.subject && (
                                                <span className="bg-slate-700 text-slate-300 px-2 py-1 rounded-full">{task.subject}</span>
                                            )}
                                            <span className={`px-2 py-1 rounded-full text-white font-semibold capitalize ${getPriorityColor(task.priority)}`}>
                                                {task.priority}
                                            </span>
                                            {task.due && (
                                                <p className={`text-sm ${moment(task.due.toDate ? task.due.toDate() : task.due).isBefore(moment(), 'day') && !task.completed ? 'text-red-500' : 'text-slate-400'}`}>
                                                    Due {moment(task.due.toDate ? task.due.toDate() : task.due).calendar(null, {
                                                        lastDay: '[Yesterday]',
                                                        sameDay: '[Today]',
                                                        nextDay: '[Tomorrow]',
                                                        lastWeek: '[last] dddd',
                                                        nextWeek: '[next] dddd',
                                                        sameElse: 'MMMM D'
                                                    })}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => deleteTask(task.id)}
                                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                >
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-slate-400 text-lg mt-8">
                        You have no tasks! Start by adding a new one.
                    </p>
                )}
            </div>

            {isModalOpen && (
                <AddTaskModal
                    onAddTask={addTask}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
};

export default Tasks;