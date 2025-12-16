import React, { useState, useEffect } from 'react';
import { AcademicCapIcon, RocketLaunchIcon } from '@heroicons/react/24/solid';
import { db } from '../../firebase/firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import GradingSystemModal from '../GpaCalc/GradingSystemModal';
import { motion } from 'framer-motion';

const GpaCalc = () => {
    const { currentUser } = useAuth();
    // --- Existing GPA Calculation States ---
    const [courses, setCourses] = useState([]);
    const [newCourse, setNewCourse] = useState({ name: '', grade: '', credits: '' });
    const [semesterGPA, setSemesterGPA] = useState(null);
    const [cgpa, setCgpa] = useState(null);
    const [prevSemestersData, setPrevSemestersData] = useState([]);
    const [numSemesters, setNumSemesters] = useState('');
    
    // --- Prediction Tool States ---
    const [currentCGPA, setCurrentCGPA] = useState('');
    const [completedCredits, setCompletedCredits] = useState('');
    const [targetCGPA, setTargetCGPA] = useState('');
    const [nextSemesterCredits, setNextSemesterCredits] = useState('');
    const [requiredGPA, setRequiredGPA] = useState(null);

    // --- Modal & Utility States ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [gradingScale, setGradingScale] = useState({});
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // 1. Fetch Grading Scale and Saved Data on Mount
    useEffect(() => {
        const fetchData = async () => {
            if (currentUser) {
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                
                if (userDocSnap.exists()) {
                    const data = userDocSnap.data();
                    // Load Grading Scale
                    if (data.gradingScale) {
                        setGradingScale(data.gradingScale);
                    } else {
                        // Default scale if none exists
                        setGradingScale({
                            'A+': 4.0, 'A': 4.0, 'A-': 3.7,
                            'B+': 3.3, 'B': 3.0, 'B-': 2.7,
                            'C+': 2.3, 'C': 2.0, 'C-': 1.7,
                            'D+': 1.3, 'D': 1.0, 'F': 0.0
                        });
                    }
                    
                    // Load Saved CGPA Inputs for easy access/prediction
                    if (data.latestCGPA && data.previousSemesters) {
                        const totalPrevCredits = data.previousSemesters.reduce((sum, sem) => sum + (parseFloat(sem.credits) || 0), 0);
                        setCurrentCGPA(data.latestCGPA);
                        setCompletedCredits(totalPrevCredits.toString());
                    }
                }
            }
            setLoading(false);
        };
        fetchData();
    }, [currentUser]);

    // --- CGPA Prediction Logic (FIXED for 10.0 scale) ---
    const calculateRequiredGPA = () => {
        setRequiredGPA(null);
        const currentC = parseFloat(currentCGPA);
        const completedCr = parseFloat(completedCredits);
        const targetC = parseFloat(targetCGPA);
        const nextCr = parseFloat(nextSemesterCredits);

        if (isNaN(currentC) || isNaN(completedCr) || isNaN(targetC) || isNaN(nextCr) || completedCr < 0 || nextCr <= 0 || targetC < 0) {
            setRequiredGPA("Invalid Input");
            return;
        }
        
        // **FIXED**: Set MAX_GPA_SCALE to 10.0 based on user feedback.
        const MAX_GPA_SCALE = 10.0; 

        const totalCreditsAfter = completedCr + nextCr;
        const totalPointsNeeded = targetC * totalCreditsAfter;
        const currentPoints = currentC * completedCr;
        
        const pointsNeededNextSem = totalPointsNeeded - currentPoints;
        const requiredGPAValue = pointsNeededNextSem / nextCr;

        // Check if the required GPA exceeds the maximum possible score (10.0)
        if (requiredGPAValue > MAX_GPA_SCALE) {
            setRequiredGPA("Target Unachievable");
        } else if (requiredGPAValue < 0) {
            setRequiredGPA("Target Achieved"); // Target is met or exceeded already, just need a non-negative GPA
        }
        else {
            setRequiredGPA(requiredGPAValue.toFixed(2));
        }
    };
    
    // --- Existing GPA Calculator Handlers ---

    const handleNumSemestersChange = (e) => {
        const num = parseInt(e.target.value) || '';
        setNumSemesters(num);
        const newArray = num ? Array.from({ length: num }, () => ({ gpa: '', credits: '' })) : [];
        setPrevSemestersData(newArray);
    };

    const handlePrevSemesterChange = (index, field, value) => {
        const newData = [...prevSemestersData];
        newData[index] = { ...newData[index], [field]: value };
        setPrevSemestersData(newData);
    };

    const handleAddCourse = (e) => {
        e.preventDefault();
        if (newCourse.name && newCourse.grade && newCourse.credits) {
            setCourses([...courses, newCourse]);
            setNewCourse({ name: '', grade: '', credits: '' });
        }
    };

    const handleRemoveCourse = (indexToRemove) => {
        setCourses(courses.filter((_, index) => index !== indexToRemove));
    };

    const calculateSemesterGPA = () => {
        let totalPoints = 0;
        let totalCredits = 0;
        let valid = true;

        courses.forEach(course => {
            const gradeLetter = course.grade.toUpperCase();
            const points = gradingScale[gradeLetter];
            const credits = parseFloat(course.credits);
            
            if (points !== undefined && !isNaN(credits) && credits > 0) {
                totalPoints += points * credits;
                totalCredits += credits;
            } else {
                valid = false;
            }
        });

        if (totalCredits > 0 && valid) {
            const calculatedGPA = totalPoints / totalCredits;
            setSemesterGPA(calculatedGPA.toFixed(2));
        } else {
            setSemesterGPA('Invalid Data');
        }
    };

    const calculateCGPA = () => {
        let totalPoints = 0;
        let totalCredits = 0;

        prevSemestersData.forEach(sem => {
            const gpa = parseFloat(sem.gpa);
            const credits = parseFloat(sem.credits);
            if (!isNaN(gpa) && !isNaN(credits) && credits > 0) {
                totalPoints += gpa * credits;
                totalCredits += credits;
            }
        });
        
        const currentSemesterGPA = parseFloat(semesterGPA);
        const currentSemesterCredits = courses.reduce((sum, course) => sum + (parseFloat(course.credits) || 0), 0);

        if (!isNaN(currentSemesterGPA) && currentSemesterCredits > 0) {
            totalPoints += currentSemesterGPA * currentSemesterCredits;
            totalCredits += currentSemesterCredits;
        }

        if (totalCredits > 0) {
            const calculatedCgpa = totalPoints / totalCredits;
            setCgpa(calculatedCgpa.toFixed(2));
        } else {
            setCgpa('Invalid Data');
        }
    };

    const handleSaveData = async () => {
        if (!currentUser) {
            alert("Please log in to save your data.");
            return;
        }

        setIsSaving(true);
        // Recalculate to ensure latest values are used for saving
        calculateSemesterGPA(); 
        calculateCGPA(); 
        
        try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            await setDoc(userDocRef, {
                latestSemesterGPA: semesterGPA,
                latestCGPA: cgpa,
                previousSemesters: prevSemestersData,
                currentSemesterCourses: courses,
                predictionInputs: {
                    currentCGPA, completedCredits, targetCGPA, nextSemesterCredits
                },
                savedAt: new Date(),
            }, { merge: true });
            alert("Data saved successfully! Your dashboard should now update.");
        } catch (error) {
            console.error("Error saving data: ", error);
            alert("Failed to save data. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };
    // --- End Existing GPA Calculator Handlers ---


    if (loading) {
        return <div className="min-h-screen bg-slate-950 text-slate-200 flex justify-center items-center">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col items-center p-8 space-y-8">
            <h1 className="text-3xl font-bold text-violet-400 flex items-center">
                <AcademicCapIcon className="h-8 w-8 mr-3 text-purple-400"/>
                GPA & CGPA Tools
            </h1>
            
            <div className="flex justify-center w-full max-w-4xl">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded-full transition-colors duration-200 text-sm"
                >
                    Customize Grading Scale
                </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-4xl">
                
                {/* 🚀 CGPA Projection Card */}
                <motion.div 
                    className="bg-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl w-full border-2 border-emerald-500/50"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <h2 className="text-2xl font-bold text-emerald-400 mb-6 text-center flex items-center justify-center">
                        <RocketLaunchIcon className="h-6 w-6 mr-2"/> CGPA Projection
                    </h2>
                    
                    <div className="space-y-4 mb-6">
                        <input
                            type="number" step="0.01" min="0" 
                            placeholder="Current CGPA (e.g. 9.06)"
                            value={currentCGPA}
                            onChange={(e) => setCurrentCGPA(e.target.value)}
                            className="w-full bg-slate-700 p-3 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                        />
                        <input
                            type="number" step="1" min="0"
                            placeholder="Total Credits Completed (e.g. 67)"
                            value={completedCredits}
                            onChange={(e) => setCompletedCredits(e.target.value)}
                            className="w-full bg-slate-700 p-3 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                        />
                        <input
                            type="number" step="0.01" min="0" 
                            placeholder="Desired Final CGPA (Target)"
                            value={targetCGPA}
                            onChange={(e) => setTargetCGPA(e.target.value)}
                            className="w-full bg-slate-700 p-3 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                        />
                        <input
                            type="number" step="1" min="1"
                            placeholder="Next Semester Credits"
                            value={nextSemesterCredits}
                            onChange={(e) => setNextSemesterCredits(e.target.value)}
                            className="w-full bg-slate-700 p-3 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
                        />
                    </div>
                    
                    <button onClick={calculateRequiredGPA} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-full transition-colors duration-200">
                        Calculate Required GPA
                    </button>
                    
                    {requiredGPA !== null && (
                        <div className="mt-6 p-4 bg-slate-700 rounded-xl text-center">
                            <p className="text-lg font-semibold text-slate-300">
                                Required GPA for Next Semester:
                            </p>
                            <p className="text-3xl font-bold mt-1">
                                <span className={
                                    requiredGPA === "Target Unachievable" ? "text-red-400" : 
                                    (requiredGPA === "Target Achieved" ? "text-green-400" : "text-yellow-400")
                                }>
                                    {requiredGPA}
                                </span>
                            </p>
                        </div>
                    )}
                </motion.div>
                
                {/* Existing Semester GPA Card */}
                <motion.div 
                    className="bg-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl w-full border-2 border-purple-500/50"
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h2 className="text-2xl font-bold text-violet-400 mb-6 text-center">Current Semester GPA</h2>
                    <form onSubmit={handleAddCourse} className="space-y-4 mb-6">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <input
                                type="text"
                                placeholder="Course Name"
                                value={newCourse.name}
                                onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                                className="bg-slate-700 p-3 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all col-span-1 sm:col-span-1"
                            />
                            <select
                                value={newCourse.grade}
                                onChange={(e) => setNewCourse({ ...newCourse, grade: e.target.value })}
                                className="bg-slate-700 p-3 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all appearance-none"
                            >
                                <option value="" disabled>Select Grade</option>
                                {Object.keys(gradingScale).sort().map(grade => (
                                    <option key={grade} value={grade}>{grade}</option>
                                ))}
                            </select>
                            <input
                                type="number"
                                step="0.5"
                                placeholder="Credits"
                                value={newCourse.credits}
                                onChange={(e) => setNewCourse({ ...newCourse, credits: e.target.value })}
                                className="bg-slate-700 p-3 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all"
                            />
                        </div>
                        <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-full transition-colors duration-200">
                            Add Course
                        </button>
                    </form>

                    {courses.length > 0 && (
                        <div className="space-y-3 mb-6 max-h-48 overflow-y-auto">
                            {courses.map((course, index) => (
                                <div key={index} className="bg-slate-700 p-3 rounded-lg flex items-center justify-between">
                                    <div className="flex-1">
                                        <p className="text-base font-semibold">{course.name}</p>
                                        <p className="text-xs text-slate-400">Grade: {course.grade} • Credits: {course.credits}</p>
                                    </div>
                                    <button onClick={() => handleRemoveCourse(index)} className="text-red-400 hover:text-red-500 text-sm ml-4">
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    <button onClick={calculateSemesterGPA} className="w-full bg-violet-500 hover:bg-violet-600 text-white font-bold py-3 px-6 rounded-full transition-colors duration-200">
                        Calculate Semester GPA
                    </button>
                    
                    {semesterGPA !== null && (
                        <div className="mt-6 p-4 bg-slate-700 rounded-xl text-center">
                            <p className="text-xl font-bold">
                                Calculated GPA: <span className="text-emerald-400">{semesterGPA}</span>
                            </p>
                        </div>
                    )}
                </motion.div>
                
                {/* Existing CGPA Card */}
                <motion.div 
                    className="bg-slate-800 p-6 sm:p-8 rounded-3xl shadow-xl w-full border-2 border-purple-500/50 lg:col-span-2"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <h2 className="text-2xl font-bold text-violet-400 mb-6 text-center">Cumulative GPA (CGPA)</h2>
                    
                    <div className="flex items-center space-x-4 mb-6 justify-center">
                        <label className="text-slate-400 font-medium whitespace-nowrap">Previous Semesters:</label>
                        <input
                            type="number"
                            min="0"
                            value={numSemesters}
                            onChange={handleNumSemestersChange}
                            className="bg-slate-700 p-2 rounded-lg text-white w-20 focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all"
                        />
                    </div>
                    
                    {numSemesters > 0 && (
                        <div className="space-y-4 mb-6 max-h-48 overflow-y-auto">
                            {prevSemestersData.map((sem, index) => (
                                <div key={index} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 p-3 bg-slate-700 rounded-lg items-center">
                                    <span className="text-slate-300 font-semibold w-full sm:w-auto">Sem {index + 1}:</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="GPA (e.g. 3.5)"
                                        value={sem.gpa}
                                        onChange={(e) => handlePrevSemesterChange(index, 'gpa', e.target.value)}
                                        className="bg-slate-600 p-2 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all flex-1 w-full"
                                    />
                                    <input
                                        type="number"
                                        step="1"
                                        placeholder="Credits (e.g. 15)"
                                        value={sem.credits}
                                        onChange={(e) => handlePrevSemesterChange(index, 'credits', e.target.value)}
                                        className="bg-slate-600 p-2 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 transition-all flex-1 w-full"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {(numSemesters > 0 || semesterGPA !== null) && (
                        <div className="mt-6">
                            <button onClick={calculateCGPA} className="w-full bg-violet-500 hover:bg-violet-600 text-white font-bold py-3 px-6 rounded-full transition-colors duration-200">
                                Calculate CGPA
                            </button>
                        </div>
                    )}
                    
                    {cgpa !== null && (
                        <div className="mt-6 p-4 bg-slate-700 rounded-xl text-center">
                            <p className="text-2xl font-bold">
                                Final CGPA: <span className="text-emerald-400">{cgpa}</span>
                            </p>
                        </div>
                    )}
                    
                    <button
                        onClick={handleSaveData}
                        disabled={isSaving || (semesterGPA === null && cgpa === null)}
                        className={`mt-8 w-full bg-emerald-500 text-white font-bold py-3 px-6 rounded-full transition-colors duration-200 ${isSaving || (semesterGPA === null && cgpa === null) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-emerald-600'}`}
                    >
                        {isSaving ? 'Saving...' : 'Save All Results to Dashboard'}
                    </button>
                </motion.div>
            </div>

            <GradingSystemModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={(newScale) => {
                    setGradingScale(newScale);
                    setIsModalOpen(false);
                }}
            />
        </div>
    );
};

export default GpaCalc;