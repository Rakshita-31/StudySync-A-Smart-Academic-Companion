import React, { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';

const AddTaskModal = ({ onAddTask, onClose }) => {
    const [taskTitle, setTaskTitle] = useState('');
    const [description, setDescription] = useState('');
    const [subject, setSubject] = useState('');
    const [priority, setPriority] = useState('medium');
    const [dueDate, setDueDate] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        // Basic validation for required field
        if (taskTitle.trim() === '') return;
        
        // FIX: Ensure dueDate is a Date object (or null) for safe Firestore saving.
        let finalDueDate = null;
        if (dueDate) {
            // Convert the date string ("YYYY-MM-DD") from the input to a JS Date object
            finalDueDate = new Date(dueDate);
        }
        
        onAddTask({
            taskTitle,
            description,
            subject,
            priority,
            dueDate: finalDueDate // Pass the correctly formatted date or null
        });
        
        // Reset form state
        setTaskTitle('');
        setDescription('');
        setSubject('');
        setPriority('medium');
        setDueDate('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
            <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl w-full max-w-md text-slate-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-violet-400">Add New Task</h2>
                    <button 
                        onClick={onClose} 
                        className="text-slate-400 hover:text-white transition-colors text-3xl"
                    >
                        &times;
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-400">Task Title *</label>
                        <input 
                            type="text" 
                            value={taskTitle}
                            onChange={(e) => setTaskTitle(e.target.value)}
                            placeholder="e.g., Complete Mathematics Assignment"
                            className="w-full mt-1 p-3 bg-slate-700 border border-slate-600 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe the task details..."
                            className="w-full mt-1 p-3 bg-slate-700 border border-slate-600 rounded-lg resize-none placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            rows="3"
                        ></textarea>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400">Subject</label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="e.g., Mathematics"
                                className="w-full mt-1 p-3 bg-slate-700 border border-slate-600 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400">Priority</label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                className="w-full mt-1 p-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                            >
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-400">Due Date (Optional)</label>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full mt-1 p-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                        />
                    </div>
                    <div className="flex justify-end space-x-4 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 text-slate-400 rounded-md font-bold hover:bg-slate-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex items-center space-x-2 px-6 py-3 bg-violet-600 text-white font-bold rounded-lg hover:bg-violet-700 transition-colors"
                        >
                            <PlusIcon className="h-5 w-5" />
                            <span>Add Task</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddTaskModal;