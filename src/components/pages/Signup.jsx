import React, { useState } from 'react';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { auth } from '../../firebase/firebaseConfig'; // Corrected path

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            navigate('/');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-950 p-4">
            <div className="w-full max-w-md bg-slate-800/70 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-transparent transition-all duration-300 hover:translate-y-[-10px] hover:border-violet-600 hover:ring-2 hover:ring-violet-600">
                <form onSubmit={handleSignup} className="space-y-6">
                    <h2 className="text-3xl font-bold text-center text-violet-400">Sign Up</h2>
                    {error && <p className="text-rose-500 text-center">{error}</p>}
                    <div>
                        <label className="block text-sm font-medium text-slate-300">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full mt-1 p-3 bg-slate-700/60 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            placeholder="Enter your email"
                            required
                        />
                    </div>
                    <div className="relative">
                        <label className="block text-sm font-medium text-slate-300">Password</label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full mt-1 p-3 bg-slate-700/60 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            placeholder="Password (min 6 characters)"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center text-sm leading-5"
                        >
                            {showPassword ? (
                                <EyeSlashIcon className="h-5 w-5 text-slate-400" />
                            ) : (
                                <EyeIcon className="h-5 w-5 text-slate-400" />
                            )}
                        </button>
                    </div>
                    <div className="relative">
                        <label className="block text-sm font-medium text-slate-300">Confirm Password</label>
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full mt-1 p-3 bg-slate-700/60 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
                            placeholder="Confirm your password"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center text-sm leading-5"
                        >
                            {showConfirmPassword ? (
                                <EyeSlashIcon className="h-5 w-5 text-slate-400" />
                            ) : (
                                <EyeIcon className="h-5 w-5 text-slate-400" />
                            )}
                        </button>
                    </div>
                    <button
                        type="submit"
                        className="w-full py-3 bg-violet-600 text-white rounded-lg font-bold hover:bg-violet-700 transition-colors"
                    >
                        Sign Up
                    </button>
                    <div className="text-center">
                        <p className="text-sm text-slate-400">
                            Already have an account?{' '}
                            <Link to="/login" className="text-violet-400 hover:underline">
                                Log in
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Signup;