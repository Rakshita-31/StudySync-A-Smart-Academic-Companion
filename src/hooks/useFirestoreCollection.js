import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from 'firebase/firestore'; 
import { db } from '../firebase/firebaseConfig';

const useFirestoreCollection = (col, uid, options = {}) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { 
        where: whereOption, 
        orderBy: orderByOption, 
        limit: limitOption 
    } = options;

    const whereField = whereOption?.field;
    const whereOperator = whereOption?.operator;
    const whereValue = whereOption?.value; 
    
    const orderByField = orderByOption?.field;
    const orderByDirection = orderByOption?.direction;

    useEffect(() => {
        if (!uid) {
            setLoading(false);
            setData([]);
            return;
        }

        setLoading(true);
        let q = query(collection(db, col));

        q = query(q, where('uid', '==', uid));

        let finalWhereValue = whereValue;
        if (whereValue && whereValue instanceof Date) {
            finalWhereValue = Timestamp.fromDate(whereValue);
        }

        if (whereField && whereOperator) {
            q = query(q, where(whereField, whereOperator, finalWhereValue)); 
        }
        
        if (orderByField && orderByDirection) {
            q = query(q, orderBy(orderByField, orderByDirection));
        }

        if (limitOption) {
            q = query(q, limit(limitOption));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            // FINAL GUARD: Prevent state update if UID somehow changes during transition
            if (!uid) {
                setData([]);
                setLoading(false);
                return;
            }
            
            const docs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setData(docs);
            setLoading(false);
        }, (err) => {
            console.error("Firestore error:", err);
            setError(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [
        col, 
        uid, 
        whereField, 
        whereOperator, 
        whereValue, 
        orderByField, 
        orderByDirection, 
        limitOption 
    ]); 

    return { data, loading, error };
};

export default useFirestoreCollection;