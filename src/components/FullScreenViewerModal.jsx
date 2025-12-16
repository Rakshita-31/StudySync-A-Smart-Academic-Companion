// File: src/components/FullScreenViewerModal.jsx

import React from 'react';
import { useTimer } from './context/TimerContext';
import { XMarkIcon, ClockIcon, ArrowTopRightOnSquareIcon, DocumentIcon } from '@heroicons/react/24/outline';

const FullScreenViewerModal = () => {
    const {
        currentLink,
        currentFileUrl,
        currentMaterialName,
        clearMaterial,
        isMaterialViewerOpen,
        seconds,
    } = useTimer();

    // Do not render if the state is false
    if (!isMaterialViewerOpen) return null;

    // Helper to format time
    const formatTime = (timeInSeconds) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const secs = timeInSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    let content;
    
    // Explicitly block sites that refuse embedding (e.g., LeetCode)
    const isLinkBlocked = currentLink && (currentLink.includes('leetcode.com') || currentLink.includes('skillrack.com'));

    if (isLinkBlocked) {
        // Fix for blocked links: Open in a new tab
        content = (
            <div className="w-full h-full bg-slate-900 flex items-center justify-center rounded-lg border-2 border-dashed border-slate-700">
                <div className="text-slate-400 text-center p-8">
                    <XMarkIcon className="h-12 w-12 mx-auto mb-4 text-red-500" />
                    <h3 className="text-xl font-semibold mb-3">"{currentMaterialName}" Requires New Tab Access</h3>
                    <p className="mb-4">
                        This resource is restricted from being embedded in a frame. To continue studying and keep the timer running:
                    </p>
                    <a
                        href={currentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={clearMaterial}
                        className="py-3 px-6 rounded-full bg-violet-600 hover:bg-violet-700 text-white font-bold transition-colors shadow-lg flex items-center justify-center mx-auto max-w-xs"
                    >
                        <ArrowTopRightOnSquareIcon className="h-5 w-5 mr-2" /> Open in New Tab
                    </a>
                </div>
            </div>
        );
    } else if (currentLink) {
        // Standard Link Embed (DSA Playlist and Aptitude will load here)
        content = (
            <iframe
                src={currentLink}
                title={currentMaterialName}
                className="w-full h-full border-0"
                allow="autoplay; fullscreen; picture-in-picture"
            />
        );
    } else if (currentFileUrl) {
        // File Placeholder
        content = (
            <div className="w-full h-full bg-slate-900 flex items-center justify-center rounded-lg">
                <p className="text-slate-400 text-center p-4">
                    <DocumentIcon className="h-12 w-12 mx-auto mb-3 text-cyan-400" />
                    <span className="font-semibold text-lg">{currentMaterialName}</span> <br/>
                    <span className="text-sm italic mt-1">(Placeholder for File Viewer)</span>
                </p>
            </div>
        );
    } else {
        content = (
            <div className="w-full h-full bg-slate-900 flex items-center justify-center rounded-lg border-2 border-dashed border-slate-700">
                <p className="text-slate-500 text-xl font-medium">No material selected.</p>
            </div>
        );
    }

    return (
        // Global listeners in TimerContext handle all activity
        <div
            className="fixed inset-0 z-50 bg-slate-900/95 flex flex-col p-4 sm:p-8"
        >
            {/* Top Bar / Timer and Controls */}
            <div className="flex justify-between items-center mb-4 bg-slate-800 p-4 rounded-xl shadow-2xl border border-violet-700">
                <h2 className="text-2xl font-bold text-violet-400 truncate">
                    Currently Focused: {currentMaterialName || 'Material Viewer'}
                </h2>
                
                {/* TIMER DISPLAY (Top Right Corner) */}
                <div className="flex items-center space-x-6">
                    <div className="flex items-center text-xl font-mono text-emerald-400 bg-slate-700 p-2 rounded-lg">
                        <ClockIcon className="h-6 w-6 mr-2"/>
                        {formatTime(seconds)}
                    </div>

                    <button
                        onClick={clearMaterial}
                        className="p-2 rounded-full bg-red-600 hover:bg-red-700 transition-colors shadow-xl"
                        title="Close Viewer & Return to Timer"
                    >
                        <XMarkIcon className="h-8 w-8 text-white" />
                    </button>
                </div>
            </div>

            {/* Main Viewer Area (Takes up the rest of the screen) */}
            <div className="flex-grow min-h-0">
                {content}
            </div>
        </div>
    );
};

export default FullScreenViewerModal;