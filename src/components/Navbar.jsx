import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { auth } from '../firebase/firebaseConfig';
import {
  Bars3Icon,
  XMarkIcon,
  HomeIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  CalculatorIcon,
  ChartBarIcon,
  BookOpenIcon,
  Cog6ToothIcon,
  ArrowRightStartOnRectangleIcon,
} from '@heroicons/react/24/outline';

const Navbar = () => {
  const { currentUser } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Error logging out:', error.message);
    }
  };

  const navLinks = [
    { name: 'Dashboard', icon: HomeIcon, path: '/' },
    { name: 'Tasks', icon: ClipboardDocumentCheckIcon, path: '/tasks' },
    { name: 'Focus Timer', icon: ClockIcon, path: '/focustimer' },
    { name: 'GPA Calculator', icon: CalculatorIcon, path: '/gpa-calc' },
    { name: 'Analytics', icon: ChartBarIcon, path: '/analytics' },
    { name: 'Journal', icon: BookOpenIcon, path: '/journal' },
    { name: 'Settings', icon: Cog6ToothIcon, path: '/settings' },
  ];

  return (
    <>
      <div className="md:hidden">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 text-slate-200"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
      </div>

      <nav
        className={`fixed inset-y-0 left-0 transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0 transition-transform duration-200 ease-in-out z-50
          w-64 bg-slate-900 border-r border-slate-700 flex flex-col`}
      >
        <div className="flex items-center justify-between p-4 mb-4">
          <NavLink to="/" className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-white">StudySync</h1>
          </NavLink>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-slate-200"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4">
          <ul>
            {navLinks.map((link) => (
              <li key={link.name} className="my-2">
                <NavLink
                  to={link.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center p-3 rounded-lg text-sm font-semibold
                    ${
                      isActive
                        ? 'bg-violet-600 text-white'
                        : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                    }
                    transition-colors duration-200`
                  }
                >
                  <link.icon className="h-5 w-5 mr-3" />
                  <span>{link.name}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 border-t border-slate-700">
          <div className="bg-slate-800 p-4 rounded-3xl text-center mb-4">
            <p className="font-semibold text-slate-200">{currentUser?.email}</p>
            <p className="text-xs text-slate-400 mt-1">
              "Success is the sum of small efforts repeated day in and day out."
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center p-3 rounded-3xl text-sm font-semibold text-red-400 bg-red-900 hover:bg-red-800 transition-colors"
          >
            <ArrowRightStartOnRectangleIcon className="h-5 w-5 mr-2" />
            Logout
          </button>
        </div>
      </nav>
    </>
  );
};

export default Navbar;