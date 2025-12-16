// src/hooks/useRecentActivity.js

import { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { useAuth } from '../components/context/AuthContext';
import { collection, query, onSnapshot, where, orderBy, limit } from 'firebase/firestore';

export const useRecentActivity = () => {
    const { currentUser } = useAuth();
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser || !currentUser.uid) {
            setActivity([]);
            setLoading(false);
            return;
        }

        const activityQuery = query(
            collection(db, 'recentActivity'),
            where('uid', '==', currentUser.uid), // Ensure you only fetch the current user's activity
            orderBy('timestamp', 'desc'),        // Sort by newest first
            limit(5)                            // Limit to the last 5 activities for the dashboard
        );

        const unsubscribe = onSnapshot(activityQuery, (querySnapshot) => {
            const activityArray = querySnapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            }));
            setActivity(activityArray);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching recent activity:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    return { activity, loading };
};