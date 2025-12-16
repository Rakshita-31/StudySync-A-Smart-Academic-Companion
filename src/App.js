// File: src/App.jsx

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/context/AuthContext';
import { ThemeProvider } from './components/context/ThemeContext';
// 🎯 NEW IMPORT
import { TimerProvider } from './components/context/TimerContext';
import { auth } from './firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

// Import Pages
import Dashboard from './components/pages/Dashboard';
import Tasks from './components/pages/Tasks';
import FocusTimer from './components/pages/FocusTimer';
import GpaCalc from './components/pages/GpaCalc';
import Analytics from './components/pages/Analytics';
import Journal from './components/pages/Journal';
import Settings from './components/pages/Settings';
import Login from './components/pages/Login';
import Signup from './components/pages/Signup';

// Import Layouts
import MainLayout from './components/MainLayout';

// Component to handle the top-level loading state
const AppContent = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // This listener is the single source of truth for auth state.
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setLoading(false);
            // Optionally, handle initial navigation here
            if (user && window.location.pathname === '/login') {
                navigate('/');
            }
        });

        // Cleanup listener on unmount
        return () => unsubscribe();
    }, [navigate]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-slate-950 text-white text-2xl font-semibold">
                Loading Application...
            </div>
        );
    }

    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected Routes */}
            <Route path="/" element={currentUser ? <MainLayout /> : <Login />}>
                <Route index element={<Dashboard />} />
                <Route path="/tasks" element={<Tasks />} />
                <Route path="/focustimer" element={<FocusTimer />} />
                <Route path="/gpacalc" element={<GpaCalc />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/journal" element={<Journal />} />
                <Route path="/settings" element={<Settings />} />
            </Route>
            {/* Catch-all to redirect unauthenticated users */}
            {!currentUser && <Route path="*" element={<Login />} />}
        </Routes>
    );
};

function App() {
    return (
        <Router>
            <AuthProvider>
                {/* 🎯 WRAP THE APP WITH TIMER CONTEXT */}
                <TimerProvider> 
                    <ThemeProvider>
                        <AppContent />
                    </ThemeProvider>
                </TimerProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;