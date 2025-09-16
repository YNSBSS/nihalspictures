import { useState, useEffect } from 'react';
import { doc, updateDoc, increment, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

const useVisitorCounter = () => {
  const [isNewVisitor, setIsNewVisitor] = useState(false);

  useEffect(() => {
    const trackVisitor = async () => {
      try {
        // Check if user has visited before using localStorage
        const hasVisited = localStorage.getItem('hasVisited');
        const visitDate = localStorage.getItem('lastVisit');
        const today = new Date().toDateString();

        if (!hasVisited || visitDate !== today) {
          // New visitor or returning after a day
          setIsNewVisitor(true);
          
          // Update Firebase counter
          const statsRef = doc(db, 'siteStats', 'visitors');
          
          // Check if document exists
          const statsDoc = await getDoc(statsRef);
          
          if (statsDoc.exists()) {
            // Update existing counter
            await updateDoc(statsRef, {
              totalVisitors: increment(1),
              lastUpdated: new Date(),
              [`visits_${new Date().getFullYear()}_${new Date().getMonth() + 1}`]: increment(1)
            });
          } else {
            // Create new counter document
            await setDoc(statsRef, {
              totalVisitors: 1,
              lastUpdated: new Date(),
              [`visits_${new Date().getFullYear()}_${new Date().getMonth() + 1}`]: 1
            });
          }

          // Mark as visited in localStorage
          localStorage.setItem('hasVisited', 'true');
          localStorage.setItem('lastVisit', today);
        } else {
          setIsNewVisitor(false);
        }
      } catch (error) {
        console.error('Error tracking visitor:', error);
      }
    };

    trackVisitor();
  }, []);

  return { isNewVisitor };
};

export default useVisitorCounter;