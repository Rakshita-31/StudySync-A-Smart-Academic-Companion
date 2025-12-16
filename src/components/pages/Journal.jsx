import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { collection, query, onSnapshot, addDoc, serverTimestamp, orderBy, deleteDoc, doc, where } from 'firebase/firestore';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { logRecentActivity } from '../../firebase/utils';
import moment from 'moment';

const Journal = () => {
    const { currentUser } = useAuth();
    const [journalEntries, setJournalEntries] = useState([]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    const textAreaRef = useRef(null);

    useEffect(() => {
        if (textAreaRef.current) {
            textAreaRef.current.style.height = '0px';
            const scrollHeight = textAreaRef.current.scrollHeight;
            textAreaRef.current.style.height = scrollHeight + 'px';
        }
    }, [content]);

    useEffect(() => {
        if (!currentUser) return;

        const q = query(
            collection(db, 'journals'),
            where('uid', '==', currentUser.uid),
            orderBy('timestamp', 'desc')
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const entries = querySnapshot.docs.map(d => ({
                id: d.id,
                ...d.data(),
            }));
            
            // 🛑 CRITICAL DEBUG LINE ADDED HERE 🛑
            console.log("Journal Entries Fetched:", entries);
            
            setJournalEntries(entries);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const handleAddEntry = async (e) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) return;

        if (currentUser) {
            try {
                const newEntry = {
                    title: title,
                    content: content,
                    uid: currentUser.uid, 
                    timestamp: serverTimestamp()
                };
                await addDoc(collection(db, 'journals'), newEntry);

                logRecentActivity(currentUser.uid, 'New Journal Entry', `You added a new entry titled "${title}".`);

                setTitle('');
                setContent('');
            } catch (error) {
                console.error("Error adding journal entry: ", error);
            }
        }
    };

    const handleDeleteEntry = async (id, title) => {
        if (window.confirm('Are you sure you want to delete this journal entry?')) {
            await deleteDoc(doc(db, 'journals', id));
            logRecentActivity(currentUser.uid, 'Journal Entry Deleted', `You deleted the entry titled "${title}".`);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-8">
            <h1 className="text-3xl font-bold mb-8">My Journal</h1>

            <div className="bg-slate-800 p-8 rounded-3xl shadow-lg mb-8 transition-all duration-300 hover:shadow-2xl hover:border-violet-500 border-2 border-transparent">
                <h2 className="text-2xl font-bold mb-4">Add New Entry</h2>
                <form onSubmit={handleAddEntry} className="space-y-4">
                    <div>
                        <input
                            type="text"
                            placeholder="Entry Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            required
                        />
                    </div>
                    <div>
                        <textarea
                            ref={textAreaRef}
                            placeholder="Write your thoughts here..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 min-h-[150px]"
                            required
                        ></textarea>
                    </div>
                    <button
                        type="submit"
                        className="flex items-center space-x-2 px-6 py-3 bg-violet-600 text-white font-bold rounded-lg hover:bg-violet-700 transition-colors"
                    >
                        <PlusIcon className="h-5 w-5" />
                        <span>Add Entry</span>
                    </button>
                </form>
            </div>

            <div className="space-y-6">
                <h2 className="text-2xl font-bold">Past Entries</h2>
                {journalEntries.length > 0 ? (
                    journalEntries.map(entry => (
                        <div key={entry.id} className="bg-slate-800 p-6 rounded-3xl shadow-lg
                            border-2 border-transparent hover:border-violet-500 transition-all duration-300 hover:shadow-2xl hover:scale-[1.01] transform-gpu">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-semibold">{entry.title}</h3>
                                    <p className="text-slate-400 text-sm mt-1">
                                        {entry.timestamp ? moment(entry.timestamp.toDate()).format('MMMM D, YYYY') : 'Date unavailable'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDeleteEntry(entry.id, entry.title)}
                                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                >
                                    <TrashIcon className="h-5 w-5" />
                                </button>
                            </div>
                            <p className="mt-4 text-slate-300 whitespace-pre-wrap">{entry.content}</p>
                        </div>
                    ))
                ) : (
                    <p className="text-center text-slate-400 text-lg mt-8">
                        You have no journal entries yet!
                    </p>
                )}
            </div>
        </div>
    );
};

export default Journal;