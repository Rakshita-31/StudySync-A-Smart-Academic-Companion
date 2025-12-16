import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { updateProfile } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { UserCircleIcon, IdentificationIcon, AcademicCapIcon } from '@heroicons/react/24/outline';


const ProfileModal = ({ isOpen, onClose }) => {
    const { currentUser } = useAuth();
    const [displayName, setDisplayName] = useState('');
    const [age, setAge] = useState('');
    const [education, setEducation] = useState('');
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (currentUser) {
                setDisplayName(currentUser.displayName || '');
                const docRef = doc(db, 'users', currentUser.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    setAge(userData.age || '');
                    setEducation(userData.education || '');
                }
            }
        };

        fetchUserProfile();
    }, [currentUser]);

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setIsUpdatingProfile(true);
        setError('');
        setMessage('');

        try {
            // Update Firebase Auth profile
            await updateProfile(auth.currentUser, {
                displayName: displayName
            });

            // Save additional info to a Firestore profile document
            await setDoc(doc(db, 'users', currentUser.uid), {
                age: age,
                education: education,
                userId: currentUser.uid
            }, { merge: true });

            setMessage('Profile updated successfully!');
        } catch (err) {
            setError('Failed to update profile. Please try again.');
            console.error(err);
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
            <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl w-full max-w-md text-slate-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-violet-400">Your Profile</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-400">Email Address</label>
                        <p className="mt-1 text-lg font-semibold text-slate-200">{currentUser?.email}</p>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div className="flex items-center space-x-2">
                             <UserCircleIcon className="h-6 w-6 text-violet-400" />
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-slate-400">Display Name</label>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className="w-full mt-1 p-3 bg-slate-700 border border-slate-600 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                                    required
                                />
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                             <IdentificationIcon className="h-6 w-6 text-violet-400" />
                             <div className="flex-1">
                                <label className="block text-sm font-medium text-slate-400">Age</label>
                                <input
                                    type="number"
                                    value={age}
                                    onChange={(e) => setAge(e.target.value)}
                                    className="w-full mt-1 p-3 bg-slate-700 border border-slate-600 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                                />
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                             <AcademicCapIcon className="h-6 w-6 text-violet-400" />
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-slate-400">Education (e.g., School, College)</label>
                                <input
                                    type="text"
                                    value={education}
                                    onChange={(e) => setEducation(e.target.value)}
                                    className="w-full mt-1 p-3 bg-slate-700 border border-slate-600 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isUpdatingProfile}
                            className="w-full px-4 py-2 text-white bg-violet-600 font-bold rounded-lg hover:bg-violet-700 transition-colors disabled:opacity-50"
                        >
                            {isUpdatingProfile ? 'Updating...' : 'Update Profile'}
                        </button>
                        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                        {message && <p className="text-green-500 text-sm mt-2">{message}</p>}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;