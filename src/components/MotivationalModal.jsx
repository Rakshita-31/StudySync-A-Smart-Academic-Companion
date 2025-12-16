import React from 'react';

const MotivationalModal = ({ isOpen, onClose, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-950 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 p-8 rounded-2xl shadow-xl text-center max-w-sm w-full">
                <h2 className="text-2xl font-bold text-violet-400 mb-4">You got this!</h2>
                <p className="text-lg text-white mb-6">
                    {message}
                </p>
                <button
                    onClick={onClose}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-full transition-colors duration-200"
                >
                    Back to Focus
                </button>
            </div>
        </div>
    );
};

export default MotivationalModal;