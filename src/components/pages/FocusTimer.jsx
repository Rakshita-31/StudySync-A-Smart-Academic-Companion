// File: src/components/pages/FocusTimer.jsx

import React, { useState, useEffect, useRef } from 'react';
import { PlayIcon, PauseIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import MotivationalModal from '../MotivationalModal'; 
import { useTimer } from '../context/TimerContext'; 
import StudyMaterialsSection from '../StudyMaterialsSection'; 
import FullScreenViewerModal from '../FullScreenViewerModal'; // Import the new modal

const FocusTimer = () => {
    const { 
        seconds, 
        isActive, 
        originalSeconds, 
        isEditing, 
        setIsEditing, 
        isModalOpen, 
        setIsModalOpen, 
        currentMessage,
        handleStartPause, 
        handleReset,
        handleTimeSave: handleTimeSaveContext,
        
        topic,
        setTopic,
        accumulativeTime, 
    } = useTimer();
    
    const [newTime, setNewTime] = useState('');
    const inputRef = useRef(null);
    
    // --- HELPER FUNCTIONS ---
    const formatTime = (timeInSeconds) => {
        if (timeInSeconds === null) return "00:00:00";
        
        const hours = Math.floor(timeInSeconds / 3600);
        const minutes = Math.floor((timeInSeconds % 3600) / 60);
        const secs = timeInSeconds % 60;
        
        if (accumulativeTime !== null && timeInSeconds === accumulativeTime) {
            if (timeInSeconds >= 3600) {
                return `${hours}h ${minutes}m`;
            } else if (timeInSeconds >= 60) {
                return `${minutes}m ${secs}s`;
            }
            return `${secs}s`;
        }
        
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const parseTimeString = (str) => {
        const parts = str.split(':').map(p => parseInt(p.trim()));
        let totalSeconds = 0;

        if (parts.length === 3) {
            totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
        } else if (parts.length === 2) {
            totalSeconds = parts[0] * 60 + parts[1];
        } else if (parts.length === 1) {
            totalSeconds = parts[0];
        }

        if (isNaN(totalSeconds) || totalSeconds < 0) {
            return null;
        }
        return totalSeconds;
    };


    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);
    
    // --- UI EVENT HANDLERS ---

    const handleTimeClick = () => {
        if (!isActive && accumulativeTime === null) {
             setIsEditing(true);
             setNewTime(formatTime(seconds));
        }
    };

    const handleTimeSave = () => {
        const parsed = parseTimeString(newTime);
        handleTimeSaveContext(parsed); 
    };

    const circumference = 2 * Math.PI * 180;
    const progress = originalSeconds > 0 ? (seconds / originalSeconds) * circumference : 0; 
    const strokeDashoffset = circumference - progress;

    return (
        <div className="w-full h-full text-slate-200 flex flex-col items-center justify-center py-8"> 
            
            {/* 1. Main Timer Card */}
            <div className="flex flex-col items-center bg-slate-800 p-16 rounded-3xl shadow-lg w-full max-w-xl">
                <h1 className="text-4xl font-bold text-violet-400 mb-8">Focus Timer</h1>

                {/* Topic Input Field */}
                <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder={isActive ? "Topic in progress..." : "What are you studying today?"}
                    disabled={isActive || accumulativeTime !== null} 
                    className={`text-center text-xl font-semibold mb-8 p-3 rounded-xl w-full max-w-sm transition-colors duration-200 ${
                        isActive || accumulativeTime !== null ? 'bg-slate-700 text-slate-400 cursor-not-allowed' : 'bg-slate-700 text-white placeholder-slate-400 focus:ring-2 focus:ring-violet-400'
                    }`}
                />

                {/* Accumulative Time Display */}
                {accumulativeTime !== null && (
                    <div className="text-center mb-6 p-4 bg-emerald-900/30 border border-emerald-500 rounded-lg w-full max-w-sm">
                        <p className="text-sm text-emerald-400 font-semibold mb-1">
                            TOTAL TIME ON {topic.toUpperCase() || 'THIS TOPIC'}
                        </p>
                        <p className="text-3xl font-bold text-emerald-300">
                            {formatTime(accumulativeTime)}
                        </p>
                    </div>
                )}
                
                <div className="relative w-96 h-96 mb-12">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            className="text-slate-700"
                            strokeWidth="15"
                            stroke="currentColor"
                            fill="transparent"
                            r="180"
                            cx="192"
                            cy="192"
                        />
                        <circle
                            className="text-emerald-500 transition-all duration-1000 ease-linear"
                            strokeWidth="15"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="180"
                            cx="192"
                            cy="192"
                        />
                    </svg>
                    <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
                        {isEditing ? (
                            <div className="flex flex-col items-center">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={newTime}
                                    onChange={(e) => setNewTime(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleTimeSave()}
                                    onBlur={handleTimeSave}
                                    className="text-7xl font-mono text-center mb-4 bg-slate-700 text-white w-72 p-2 rounded-lg focus:outline-none"
                                />
                                <button
                                    onClick={handleTimeSave}
                                    className="text-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded-full transition-colors duration-200"
                                >
                                    Set
                                </button>
                            </div>
                        ) : (
                            <div
                                onClick={handleTimeClick}
                                className="text-7xl font-mono text-white cursor-pointer hover:text-violet-400 transition-colors duration-200"
                            >
                                {formatTime(seconds)}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex space-x-10">
                    <button
                        onClick={handleStartPause}
                        className={`p-6 rounded-full transition-colors duration-200 ${
                            isActive ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'
                        }`}
                    >
                        {isActive ? (
                            <PauseIcon className="h-12 w-12 text-white" />
                        ) : (
                            <PlayIcon className="h-12 w-12 text-white" />
                        )}
                    </button>
                    <button
                        onClick={handleReset}
                        className="p-6 rounded-full bg-slate-600 hover:bg-slate-700 transition-colors duration-200"
                    >
                        <ArrowPathIcon className="h-12 w-12 text-white" />
                    </button>
                </div>
            </div>
            
            {/* 2. Materials Section (List/Upload only) */}
            <div className="w-full max-w-6xl mt-12">
                <StudyMaterialsSection />
            </div>
            
            {/* 3. NEW FULL-SCREEN MODAL */}
            <FullScreenViewerModal />

            <MotivationalModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                message={currentMessage} 
            />
        </div>
    );
};

export default FocusTimer;