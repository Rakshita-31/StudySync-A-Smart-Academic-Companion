import React, { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import ProfileModal from './ProfileModal';
import {
    HomeIcon,
    ListBulletIcon,
    ClockIcon,
    CalculatorIcon,
    ChartBarIcon,
    BookOpenIcon,
    Cog6ToothIcon,
    UserCircleIcon,
    ArrowRightStartOnRectangleIcon
} from '@heroicons/react/24/outline';


const MainLayout = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (err) {
            console.error("Failed to log out:", err);
        }
    };

    const navItems = [
        { name: 'Dashboard', path: '/', icon: <HomeIcon className="h-6 w-6" /> },
        { name: 'Tasks', path: '/tasks', icon: <ListBulletIcon className="h-6 w-6" /> },
        { name: 'Focus Timer', path: '/focustimer', icon: <ClockIcon className="h-6 w-6" /> },
        { name: 'GPA Calculator', path: '/gpacalc', icon: <CalculatorIcon className="h-6 w-6" /> },
        { name: 'Analytics', path: '/analytics', icon: <ChartBarIcon className="h-6 w-6" /> },
        { name: 'Journal', path: '/journal', icon: <BookOpenIcon className="h-6 w-6" /> },
        { name: 'Settings', path: '/settings', icon: <Cog6ToothIcon className="h-6 w-6" /> },
    ];

    return (
        <div className="flex bg-slate-950 min-h-screen">
            {/* Sidebar */}
            <div className="bg-slate-900 text-slate-200 w-64 h-screen p-6 flex flex-col justify-between transition-colors duration-300 sticky top-0">
                <div>
                    <div className="flex items-center space-x-3 mb-8">
                        <h1 className="text-2xl font-bold">StudySync</h1>
                    </div>
                    <nav className="space-y-2">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.name}
                                to={item.path}
                                className={({ isActive }) =>
                                    `flex items-center space-x-3 p-3 rounded-lg font-medium transition-colors duration-200 ${isActive
                                        ? 'bg-violet-600 text-white'
                                        : 'text-slate-400 hover:bg-slate-800'
                                    }`
                                }
                            >
                                {item.icon}
                                <span>{item.name}</span>
                            </NavLink>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto">
                {/* Top Navigation Bar */}
                <nav className="flex items-center justify-end p-4 bg-slate-900 border-b border-slate-700 transition-colors duration-300 sticky top-0 z-10">
                    <div className="flex items-center space-x-4">
                        {/* User Profile Icon */}
                        <button
                            onClick={() => setIsProfileModalOpen(true)}
                            className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors"
                        >
                            <UserCircleIcon className="h-8 w-8" />
                            <p className="font-semibold text-slate-200">{currentUser?.displayName || currentUser?.email}</p>
                        </button>

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="flex items-center px-4 py-2 rounded-lg text-sm font-semibold text-red-400 bg-red-900 hover:bg-red-800 transition-colors"
                        >
                            <ArrowRightStartOnRectangleIcon className="h-5 w-5 mr-2" />
                            Logout
                        </button>
                    </div>
                </nav>

                {/* Page Content */}
                <main className="p-8">
                    <Outlet />
                </main>
            </div>

            {/* Render the profile modal */}
            <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
        </div>
    );
};

export default MainLayout;