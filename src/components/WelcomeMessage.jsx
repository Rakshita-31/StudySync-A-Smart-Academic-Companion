import React from 'react';
import { useAuth } from './context/AuthContext';

const WelcomeMessage = () => {
    const { currentUser } = useAuth();

    return (
        <div className="bg-slate-900 p-4 rounded-3xl text-center">
            <p className="font-semibold text-slate-200">{currentUser?.email}</p>
            <p className="text-xs text-violet-300">
                "Success is the sum of small efforts repeated day in and day out."
            </p>
        </div>
    );
};

export default WelcomeMessage;