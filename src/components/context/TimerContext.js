// File: src/components/context/TimerContext.js

import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react'; 
import { db } from '../../firebase/firebaseConfig';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore'; 
import { useAuth } from './AuthContext';

const motivationalMessages = [
    "Stay focused. Distraction is the enemy of progress.",
    "Your future self will thank you for this work.",
    "Small steps, every day. You've got this!",
    "Remember your goal. Get back to work!",
];

const MINIMUM_STREAK_DURATION = 120; // 2 minutes for testing
const INACTIVITY_TIMEOUT_MS = 60000; // 60 seconds of inactivity allowed
const INTERVAL_CHECK_MS = 1000;      // Check for inactivity every 1 second

const TimerContext = createContext();

export const useTimer = () => {
    return useContext(TimerContext);
};

// DUMMY MATERIALS 
const DUMMY_MATERIALS = [
    { id: 'mat-1', type: 'link', name: 'Aptitude Tutorial & Practice', value: 'https://www.indiabix.com/aptitude/questions-and-answers/#google_vignette', isFocus: false },
    { id: 'mat-2', type: 'link', name: 'DSA Playlist (YouTube)', value: 'https://www.youtube.com/embed/videoseries?list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ', isFocus: false },
    // MODIFIED: Replaced PDF placeholder with the new Time & Work video/playlist.
    { id: 'mat-3', type: 'link', name: 'Time & Work (Aptitude)', value: 'https://www.youtube.com/embed/w74KP-C6h-g', isFocus: false }, 
];


export const TimerProvider = ({ children }) => {
    const { currentUser } = useAuth();
    
    // Core Timer State
    const [seconds, setSeconds] = useState(1500);
    const [isActive, setIsActive] = useState(false);
    const [originalSeconds, setOriginalSeconds] = useState(1500);
    const [topic, setTopic] = useState('');
    const [accumulativeTime, setAccumulativeTime] = useState(null);
    
    // UI State
    const [isEditing, setIsEditing] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentMessage, setCurrentMessage] = useState('');
    
    // NEW STATE FOR STUDY MATERIALS
    const [isMaterialViewerOpen, setIsMaterialViewerOpen] = useState(false);
    const [materials, setMaterials] = useState(DUMMY_MATERIALS); 
    const [currentLink, setCurrentLink] = useState(null);       
    const [currentFileUrl, setCurrentFileUrl] = useState(null); 
    const [currentMaterialName, setCurrentMaterialName] = useState(null); 
    
    // Internal Refs
    const intervalRef = useRef(null);
    const sessionLoggedRef = useRef(false);
    
    // INACTIVITY REFS & NEW REF FOR STATE TRACKING
    const userActivityIntervalRef = useRef(null);
    const lastActivityTimeRef = useRef(Date.now()); 
    const isActiveRef = useRef(isActive); // Tracks latest 'isActive'
    
    // --- FIREBASE LOGIC (unchanged) ---
    const fetchAccumulativeTime = async (currentTopic) => {
        if (!currentUser || !currentTopic) return;
        
        try {
            const sessionsRef = collection(db, 'focusSessions');
            const q = query(sessionsRef, where('uid', '==', currentUser.uid), where('topic', '==', currentTopic));
            const snapshot = await getDocs(q);

            let totalTime = 0;
            snapshot.forEach(doc => {
                totalTime += doc.data().duration || 0; 
            });
            setAccumulativeTime(totalTime);
        } catch (error) {
            console.error("Error fetching accumulative time:", error);
        }
    };
    
    const saveSessionToFirestore = async (duration) => {
        if (!currentUser || sessionLoggedRef.current) return;
        
        if (duration < MINIMUM_STREAK_DURATION) {
             console.log("Session too short to log streak.");
             return; 
        }

        try {
            const sessionsRef = collection(db, 'focusSessions');
            await addDoc(sessionsRef, {
                uid: currentUser.uid,
                duration: duration, 
                topic: topic || 'Untitled Session', 
                completedAt: serverTimestamp(),
            });
            sessionLoggedRef.current = true;
            console.log("Focus session logged successfully.");

            await fetchAccumulativeTime(topic || 'Untitled Session');

        } catch (error) {
            console.error("Error logging focus session:", error);
        }
    };
    // --- END FIREBASE LOGIC ---

    // --- ACTIVITY MONITORING ---

    // The job of the listener is to record the current timestamp
    const recordLastActivityTime = () => {
        lastActivityTimeRef.current = Date.now();
    };

    // Uses isActiveRef to ensure it reads the latest state
    const handleInactivityTimeout = () => {
        if (isActiveRef.current) { 
            setIsActive(false);
            const randomIndex = Math.floor(Math.random() * motivationalMessages.length);
            setCurrentMessage(motivationalMessages[randomIndex]);
            setIsModalOpen(true);
        }
    };
    
    // Manual reset function - exposed to the modal
    const manualResetActivity = () => {
        recordLastActivityTime();
    };

    // --- EFFECTS ---

    // NEW EFFECT: Keeps isActiveRef updated with the latest isActive state
    useEffect(() => {
        isActiveRef.current = isActive;
    }, [isActive]);


    // 1. Timer Interval Effect (unchanged)
    useEffect(() => {
        if (isActive) {
            intervalRef.current = setInterval(() => {
                setSeconds((prevSeconds) => {
                    if (prevSeconds <= 1) {
                        clearInterval(intervalRef.current);
                        setIsActive(false);
                        saveSessionToFirestore(originalSeconds); 
                        return 0;
                    }
                    return prevSeconds - 1;
                });
            }, 1000);
            manualResetActivity(); 

        } else if (!isActive && seconds !== originalSeconds && seconds !== 0 && !sessionLoggedRef.current) {
            saveSessionToFirestore(originalSeconds - seconds); 
        }

        return () => {
            clearInterval(intervalRef.current);
        };
    }, [isActive, seconds, originalSeconds]);

    // 2. Continuous Inactivity Checker (Fixed)
    useEffect(() => {
        clearInterval(userActivityIntervalRef.current);
        
        // Interval runs whenever the timer is active.
        if (isActive) { 
            lastActivityTimeRef.current = Date.now(); 
            
            userActivityIntervalRef.current = setInterval(() => {
                const now = Date.now();
                
                // If the check finds no activity, trigger the timeout
                if (now - lastActivityTimeRef.current > INACTIVITY_TIMEOUT_MS) {
                    handleInactivityTimeout(); 
                }
            }, INTERVAL_CHECK_MS); 
        }
        
        return () => {
            clearInterval(userActivityIntervalRef.current);
        }
    }, [isActive]); 

    // 3. Global Activity and Visibility Listeners (FINAL FIX: includes window.blur)
    
    // 3a. Stable function for activity listener
    const handleGlobalActivity = useCallback(() => {
        if (isActive) {
             recordLastActivityTime();
        }
    }, [isActive]); 
    
    // 3b. Stable function for visibility listener
    const handleVisibilityChange = useCallback(() => {
        // Pause timer on tab switch (document.hidden) or when the browser window loses focus (blur).
        if ((document.hidden || !document.hasFocus()) && isActive) { 
            setIsActive(false);
            console.log("Timer paused: Focus lost.");
            setCurrentMessage("Focus lost: You switched away from the app! Click PLAY to resume your session.");
            setIsModalOpen(true);
        } 
    }, [isActive]); 
    
    // 3c. Effect to set up and tear down global listeners
    useEffect(() => {
        window.addEventListener('mousemove', handleGlobalActivity); 
        window.addEventListener('keydown', handleGlobalActivity);
        window.addEventListener('mousedown', handleGlobalActivity);
        
        // CRITICAL FIX: Listener for when the entire window loses focus (most reliable fix for iframe)
        window.addEventListener('blur', handleVisibilityChange); 
        
        document.addEventListener('visibilitychange', handleVisibilityChange); 

        return () => {
            window.removeEventListener('mousemove', handleGlobalActivity);
            window.removeEventListener('keydown', handleGlobalActivity);
            window.removeEventListener('mousedown', handleGlobalActivity);
            
            // CLEANUP: for blur listener
            window.removeEventListener('blur', handleVisibilityChange);
            
            document.removeEventListener('visibilitychange', handleVisibilityChange); 
        };
    }, [handleGlobalActivity, handleVisibilityChange]); 


    // Cleanup accumulative time when topic or active state changes (unchanged)
    useEffect(() => {
        if (isActive || topic === '') {
            setAccumulativeTime(null);
        }
    }, [isActive, topic]);
    
    // --- MATERIAL MANAGEMENT FUNCTIONS (unchanged) ---
    const selectMaterial = (material) => {
        if (material.type === 'link') {
            setCurrentLink(material.value);
            setCurrentFileUrl(null);
        } else if (material.type === 'file') {
            setCurrentFileUrl(material.value);
            setCurrentLink(null);
        }
        setCurrentMaterialName(material.name);
        
        setIsMaterialViewerOpen(true); 
        
        if (isActive) {
             manualResetActivity();
        }
    };

    const clearMaterial = () => {
        setCurrentLink(null);
        setCurrentFileUrl(null);
        setCurrentMaterialName(null);
        
        setIsMaterialViewerOpen(false);
        
        if (isActive) {
             manualResetActivity();
        }
    };

    // --- EXPOSED CONTROLS (unchanged) ---
    const handleStartPause = () => {
        if (seconds === 0) {
            sessionLoggedRef.current = false; 
            setSeconds(originalSeconds);
        }
        setIsActive(prev => !prev);
        
        if (!isActive) {
            setAccumulativeTime(null);
            manualResetActivity(); 
        }
    };

    const handleReset = () => {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        
        setIsActive(false);
        setSeconds(originalSeconds);
        sessionLoggedRef.current = false; 
        clearInterval(userActivityIntervalRef.current); 
        
        setTopic(''); 
        setAccumulativeTime(null);
        clearMaterial(); 
    };

    const handleTimeSave = (newParsedTime) => {
        if (newParsedTime && newParsedTime > 0) {
            setSeconds(newParsedTime);
            setOriginalSeconds(newParsedTime);
            sessionLoggedRef.current = false; 
        }
        setIsEditing(false);
    };

    const value = {
        seconds,
        isActive,
        originalSeconds,
        isEditing, 
        setIsEditing,
        isModalOpen, 
        setIsModalOpen,
        currentMessage,
        
        topic,
        setTopic, 
        accumulativeTime, 

        materials,
        setMaterials, 
        currentLink,
        currentFileUrl,
        currentMaterialName,
        selectMaterial,
        clearMaterial,
        isMaterialViewerOpen, 

        handleStartPause,
        handleReset,
        handleTimeSave,
        manualResetActivity, // EXPOSED FOR MODAL
    };

    return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
};