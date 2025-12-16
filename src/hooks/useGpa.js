import { useState, useEffect } from 'react';
import { db } from '../firebase/firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../components/context/AuthContext'; // Corrected path assumption

const useGpa = () => {
    const { currentUser } = useAuth();
    const [currentGpa, setCurrentGpa] = useState('N/A');
    const [loadingGpa, setLoadingGpa] = useState(true);

    useEffect(() => {
        if (!currentUser) {
            setCurrentGpa('N/A');
            setLoadingGpa(false);
            return;
        }

        const userDocRef = doc(db, 'users', currentUser.uid);

        // Set up a real-time listener
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                
                // Prioritize latest CGPA, then latest Semester GPA
                const latestGPA = data.latestCGPA || data.latestSemesterGPA;
                
                if (latestGPA) {
                    const gpaValue = parseFloat(latestGPA);
                    setCurrentGpa(isNaN(gpaValue) ? 'N/A' : gpaValue.toFixed(2));
                } else {
                    setCurrentGpa('N/A');
                }
            } else {
                setCurrentGpa('N/A');
            }
            setLoadingGpa(false);
        }, (error) => {
            console.error("Error fetching GPA data:", error);
            setCurrentGpa('Error');
            setLoadingGpa(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    return { currentGpa, loadingGpa };
};

export default useGpa;