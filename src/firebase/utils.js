import { db } from './firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Note: I've updated the parameter name to 'uid' for clarity and consistency
export const logRecentActivity = async (uid, type, description) => {
    if (!uid) {
        console.warn("Attempted to log activity without a valid user ID.");
        return;
    }
    
    try {
        await addDoc(collection(db, 'recentActivity'), {
            uid, // <-- CORRECTED: Saves the field as 'uid' to match 'tasks' collection
            type, // Assuming 'type' is the 'title' you were passing (e.g., "New Task Added")
            description,
            timestamp: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error logging recent activity:", error);
    }
};