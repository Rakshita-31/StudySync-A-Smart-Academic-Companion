import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { XMarkIcon } from '@heroicons/react/24/outline';

const GradingSystemModal = ({ isOpen, onClose, onSave }) => {
    const { currentUser } = useAuth();
    const [gradingScale, setGradingScale] = useState({});
    const [newGrade, setNewGrade] = useState('');
    const [newPoints, setNewPoints] = useState('');

    // Fetch the user's custom grading scale on mount
    useEffect(() => {
        const fetchGradingScale = async () => {
            if (currentUser) {
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists() && userDocSnap.data().gradingScale) {
                    setGradingScale(userDocSnap.data().gradingScale);
                } else {
                    // Default scale if none exists
                    setGradingScale({
                        'A+': 4.0, 'A': 4.0, 'A-': 3.7,
                        'B+': 3.3, 'B': 3.0, 'B-': 2.7,
                        'C+': 2.3, 'C': 2.0, 'C-': 1.7,
                        'D+': 1.3, 'D': 1.0, 'F': 0.0
                    });
                }
            }
        };

        if (isOpen) {
            fetchGradingScale();
        }
    }, [isOpen, currentUser]);

    const handleAddOrUpdateGrade = async (e) => {
        e.preventDefault();
        if (newGrade && newPoints) {
            const updatedScale = {
                ...gradingScale,
                [newGrade.toUpperCase()]: parseFloat(newPoints)
            };
            setGradingScale(updatedScale);
            setNewGrade('');
            setNewPoints('');
        }
    };

    const handleRemoveGrade = (grade) => {
        const updatedScale = { ...gradingScale };
        delete updatedScale[grade];
        setGradingScale(updatedScale);
    };

    const handleSave = async () => {
        if (!currentUser) return;

        const userDocRef = doc(db, 'users', currentUser.uid);
        try {
            await setDoc(userDocRef, { gradingScale }, { merge: true });
            onSave(gradingScale);
            onClose();
        } catch (error) {
            console.error("Error saving grading scale: ", error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-75 flex justify-center items-center z-50">
            <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl w-full max-w-xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
                    <XMarkIcon className="h-6 w-6" />
                </button>
                <h2 className="text-2xl font-bold text-violet-400 mb-6 text-center">Customize Grading Scale</h2>

                <form onSubmit={handleAddOrUpdateGrade} className="flex space-x-2 mb-4">
                    <input
                        type="text"
                        placeholder="Grade (e.g. B+)"
                        value={newGrade}
                        onChange={(e) => setNewGrade(e.target.value)}
                        className="bg-slate-700 p-3 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 flex-1"
                    />
                    <input
                        type="number"
                        step="0.1"
                        placeholder="Points (e.g. 3.3)"
                        value={newPoints}
                        onChange={(e) => setNewPoints(e.target.value)}
                        className="bg-slate-700 p-3 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 w-24"
                    />
                    <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-lg transition-colors">
                        Add
                    </button>
                </form>

                <div className="bg-slate-700 p-4 rounded-lg max-h-64 overflow-y-auto mb-4">
                    <h3 className="text-lg font-semibold mb-2 text-slate-300">Your Grades:</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {Object.entries(gradingScale).sort().map(([grade, points]) => (
                            <div key={grade} className="bg-slate-600 p-3 rounded-md flex justify-between items-center">
                                <span>{grade}: {points}</span>
                                <button onClick={() => handleRemoveGrade(grade)} className="text-red-400 hover:text-red-500 transition-colors ml-2">
                                    <XMarkIcon className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="text-center mt-6">
                    <button onClick={handleSave} className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 px-6 rounded-full transition-colors duration-200">
                        Save Grading System
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GradingSystemModal;