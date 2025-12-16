import React from 'react';
import { NavLink } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { useAuth } from './context/AuthContext';
import { PlayIcon, CalculatorIcon, DocumentArrowUpIcon, BellIcon, PencilSquareIcon, DocumentChartBarIcon, Cog6ToothIcon, FolderIcon } from '@heroicons/react/24/outline';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const { currentUser } = useAuth();

  return (
    <div
      className={`fixed inset-y-0 left-0 transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out z-50`}
    >
      <div className="w-64 bg-slate-900 text-slate-200 min-h-screen p-4 flex flex-col">
        <div className="flex justify-between items-center mb-8">
          <div className="text-2xl font-bold">StudySync</div>
          <button onClick={toggleSidebar} className="lg:hidden text-white">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <nav className="flex-1">
          <ul>
            <li className="mb-2">
              <NavLink
                to="/dashboard"
                onClick={toggleSidebar}
                className={({ isActive }) =>
                  `block py-2 px-4 rounded-md transition-colors ${
                    isActive ? 'bg-violet-600' : 'hover:bg-slate-800'
                  }`
                }
              >
                Dashboard
              </NavLink>
            </li>
            <li className="mb-2">
              <NavLink
                to="/tasks"
                onClick={toggleSidebar}
                className={({ isActive }) =>
                  `block py-2 px-4 rounded-md transition-colors ${
                    isActive ? 'bg-violet-600' : 'hover:bg-slate-800'
                  }`
                }
              >
                Tasks
              </NavLink>
            </li>
            <li className="mb-2">
              <NavLink
                to="/focustimer"
                onClick={toggleSidebar}
                className={({ isActive }) =>
                  `block py-2 px-4 rounded-md transition-colors ${
                    isActive ? 'bg-violet-600' : 'hover:bg-slate-800'
                  }`
                }
              >
                Focus Timer
              </NavLink>
            </li>
            <li className="mb-2">
              <NavLink
                to="/gpacalc"
                onClick={toggleSidebar}
                className={({ isActive }) =>
                  `block py-2 px-4 rounded-md transition-colors ${
                    isActive ? 'bg-violet-600' : 'hover:bg-slate-800'
                  }`
                }
              >
                GPA Calculator
              </NavLink>
            </li>
            <li className="mb-2">
              <NavLink
                to="/analytics"
                onClick={toggleSidebar}
                className={({ isActive }) =>
                  `block py-2 px-4 rounded-md transition-colors ${
                    isActive ? 'bg-violet-600' : 'hover:bg-slate-800'
                  }`
                }
              >
                Analytics
              </NavLink>
            </li>
            <li className="mb-2">
              <NavLink
                to="/journal"
                onClick={toggleSidebar}
                className={({ isActive }) =>
                  `block py-2 px-4 rounded-md transition-colors ${
                    isActive ? 'bg-violet-600' : 'hover:bg-slate-800'
                  }`
                }
              >
                Journal
              </NavLink>
            </li>
            <li className="mb-2">
              <NavLink
                to="/settings"
                onClick={toggleSidebar}
                className={({ isActive }) =>
                  `block py-2 px-4 rounded-md transition-colors ${
                    isActive ? 'bg-violet-600' : 'hover:bg-slate-800'
                  }`
                }
              >
                Settings
              </NavLink>
            </li>
          </ul>
        </nav>
        
        <div className="mt-auto pt-4 border-t border-slate-700">
          <div className="mb-4">
            <span className="text-slate-400 text-sm">Welcome,</span>
            <p className="text-lg font-semibold">{currentUser?.email}</p>
          </div>
          <div className="bg-violet-600 text-white p-4 rounded-xl">
            <h3 className="text-lg font-semibold">Daily Motivation</h3>
            <p className="text-sm mt-1">"Success is the sum of small efforts repeated day in and day out."</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;