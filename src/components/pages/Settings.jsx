import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from 'firebase/auth';
import { auth } from '../../firebase/firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { EnvelopeIcon, CodeBracketIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

const Settings = () => {
    const { currentUser } = useAuth();
    const [message, setMessage] = useState('');
    const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
    const [age, setAge] = useState('');
    const [education, setEducation] = useState('');
    const [rating, setRating] = useState(0);
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

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
        setMessage('');

        try {
            await updateProfile(auth.currentUser, {
                displayName: displayName
            });

            await setDoc(doc(db, 'users', currentUser.uid), {
                age: age,
                education: education,
                userId: currentUser.uid
            }, { merge: true });

            setMessage('Profile updated successfully!');
            await auth.currentUser.reload();
        } catch (err) {
            setMessage('Failed to update profile. Please try again.');
            console.error(err);
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const cardStyle = "bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-transparent hover:border-violet-600 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105";

    return (
        <div className="text-slate-200">
            <h1 className="text-3xl font-bold mb-8">Settings & Info</h1>

            <div className="space-y-6">

                {/* User Profile Card */}
                <div className={`${cardStyle} w-full max-w-2xl mx-auto`}>
                    <h2 className="text-xl font-semibold mb-4 text-violet-400">User Profile</h2>
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400">Display Name</label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full mt-1 p-3 bg-slate-700/70 border border-slate-600 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400">Age</label>
                            <input
                                type="number"
                                value={age}
                                onChange={(e) => setAge(e.target.value)}
                                className="w-full mt-1 p-3 bg-slate-700/70 border border-slate-600 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400">Education</label>
                            <input
                                type="text"
                                value={education}
                                onChange={(e) => setEducation(e.target.value)}
                                className="w-full mt-1 p-3 bg-slate-700/70 border border-slate-600 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isUpdatingProfile}
                            className="w-full px-4 py-2 text-white bg-violet-600 font-bold rounded-lg hover:bg-violet-700 transition-colors disabled:bg-slate-500"
                        >
                            {isUpdatingProfile ? 'Updating...' : 'Update Profile'}
                        </button>
                        {message && (
                            <p className={`text-sm mt-2 ${message.includes('Failed') ? 'text-red-500' : 'text-green-500'}`}>
                                {message}
                            </p>
                        )}
                    </form>
                </div>

                {/* Feedback Card */}
                <div className={`${cardStyle} w-full max-w-2xl mx-auto`}>
                    <h2 className="text-xl font-semibold mb-4 text-violet-400">Feedback</h2>
                    <p className="text-slate-400 mb-4">Have an idea or found a bug? Let us know!</p>
                    
                    {/* Ratings */}
                    <div className="flex items-center space-x-1 mb-4">
                        {[...Array(5)].map((_, index) => (
                            <StarIcon 
                                key={index}
                                className={`h-8 w-8 cursor-pointer transition-colors duration-200 ${index < rating ? 'text-yellow-400' : 'text-gray-600'}`}
                                onClick={() => setRating(index + 1)}
                            />
                        ))}
                    </div>

                    <a 
                        href="mailto:ezhilar706@gmail.com?subject=StudySync App Feedback"
                        className="flex items-center justify-center space-x-2 px-4 py-2 text-white bg-violet-600 font-bold rounded-lg hover:bg-violet-700 transition-colors"
                    >
                        <EnvelopeIcon className="h-5 w-5" />
                        <span>Send Feedback</span>
                    </a>
                </div>

                {/* Developer Info Card */}
                <div className={`${cardStyle} w-full max-w-2xl mx-auto`}>
                    <h2 className="text-xl font-semibold mb-4 text-violet-400">Developed By</h2>
                    <div className="flex items-center space-x-3 mb-2">
                        <CodeBracketIcon className="h-6 w-6 text-violet-400" />
                        <span className="text-md text-slate-200">This project was developed by a team of four enthusiastic B.Tech IT students from Sri Manakula Vinayagar Engineering College — Rakshita, Rosini, Sandhya, and Niranjana. We are passionate about technology, problem-solving, and building impactful solutions through innovative projects.</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;