import { useState, useEffect } from 'react';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

const useFirestoreCount = (col, uid, options = {}) => {
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const whereField = options.where?.field;
    const whereOperator = options.where?.operator;
    const whereValue = options.where?.value;

    useEffect(() => {
        if (!uid) {
            setLoading(false);
            return;
        }

        let isCancelled = false;
        
        const fetchCount = async () => {
            // FINAL GUARD: If UID is not present when the async operation runs, stop.
            if (isCancelled || !uid) return; 
            
            setLoading(true);
            setError(null);
            
            try {
                let q = query(collection(db, col), where('uid', '==', uid));
                
                if (whereField && whereOperator) {
                    q = query(q, where(whereField, whereOperator, whereValue));
                }

                const snapshot = await getCountFromServer(q);

                if (!isCancelled) {
                    setCount(snapshot.data().count);
                }
            } catch (err) {
                if (!isCancelled) {
                    console.error("Failed to fetch count:", err);
                    setError(err);
                }
            } finally {
                if (!isCancelled) {
                    setLoading(false);
                }
            }
        };

        fetchCount();
        
        return () => {
            isCancelled = true;
        };
    }, [
        col, 
        uid, 
        whereField, 
        whereOperator, 
        whereValue
    ]); 

    return { count, loading, error };
};

export default useFirestoreCount;