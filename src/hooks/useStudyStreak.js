import { useState, useEffect } from 'react';
import useFirestoreCollection from './useFirestoreCollection'; 
import moment from 'moment';

// CORRECTED IMPORT PATH for your file structure: src/hooks -> src/components/context
import { useAuth } from '../components/context/AuthContext'; 

/**
 * Calculates a user's consecutive study streak based on focus sessions.
 * Sessions are normalized to the user's local calendar day.
 */
const useStudyStreak = () => {
    const { currentUser } = useAuth();
    
    // Fetch all focus sessions
    const { 
        data: focusSessions, 
        loading: loadingSessions 
    } = useFirestoreCollection('focusSessions', currentUser?.uid, {});

    const [streak, setStreak] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (loadingSessions || !currentUser || !focusSessions) {
            setLoading(loadingSessions);
            return;
        }

        if (focusSessions.length === 0) {
            setStreak(0);
            setLoading(false);
            return;
        }

        const calculatedStreak = calculateStreak(focusSessions);
        setStreak(calculatedStreak);
        setLoading(false);

    }, [focusSessions, currentUser, loadingSessions]);

    /**
     * Core logic to calculate the streak while accounting for timezones.
     * @param {Array<Object>} sessions - Array of focus session documents.
     * @returns {number} The calculated consecutive daily streak.
     */
    const calculateStreak = (sessions) => {
        if (!sessions || sessions.length === 0) return 0;
        
        // Timezone Offset Calculation: Used to shift UTC time to align with local midnight.
        const userOffsetMs = new Date().getTimezoneOffset() * 60 * 1000; 
        
        const uniqueStudyDays = new Set();

        sessions.forEach(session => {
            // FIX: Using session.completedAt based on your Firestore structure.
            const utcTimeMs = session?.completedAt?.toDate?.()?.getTime();
            
            // Skip session if the completedAt field is missing or not a Timestamp.
            if (typeof utcTimeMs !== 'number' || isNaN(utcTimeMs)) {
                return; 
            }

            // Normalize: Shift the UTC time by the user's offset to get local day start.
            const localDayStartMs = utcTimeMs - userOffsetMs;
            
            // Extract the YYYY-MM-DD string from this normalized time. 
            const localDayString = new Date(localDayStartMs).toISOString().substring(0, 10);
            
            uniqueStudyDays.add(localDayString);
        });

        const sortedDays = Array.from(uniqueStudyDays).sort().reverse();
        
        // Define 'today' using the same normalization process
        const todayMs = new Date().getTime();
        const todayLocalDay = new Date(todayMs - userOffsetMs).toISOString().substring(0, 10);
        
        let currentStreak = 0;
        let expectedDay = todayLocalDay;

        for (const day of sortedDays) {
            if (day === expectedDay) {
                currentStreak++;
                // Move expected day back by one day using moment for reliable date math
                expectedDay = moment(expectedDay).subtract(1, 'days').format('YYYY-MM-DD');
            } else if (moment(day).isBefore(expectedDay, 'day')) {
                // Gap found (session day is before the expected previous day)
                break;
            }
        }
        
        return currentStreak;
    };

    return { 
        streak, 
        loading 
    };
};

export default useStudyStreak;