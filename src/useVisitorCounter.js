import { useState, useEffect, useRef } from 'react';
import { doc, updateDoc, increment, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

const useVisitorCounter = () => {
  const [isNewVisitor, setIsNewVisitor] = useState(false);
  const hasTracked = useRef(false); // Prevent double execution

  useEffect(() => {
    const trackVisitor = async () => {
      // Prevent double execution in React Strict Mode
      if (hasTracked.current) {
        return;
      }
      
      try {
        // Check if user has visited before using localStorage
        const hasVisited = localStorage.getItem('hasVisited');
        const visitDate = localStorage.getItem('lastVisit');
        const sessionTracked = sessionStorage.getItem('sessionTracked'); // Session flag
        const today = new Date().toDateString();

        // Only track if it's a new visitor/day AND not already tracked in this session
        if ((!hasVisited || visitDate !== today) && !sessionTracked) {
          hasTracked.current = true; // Set ref flag
          
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

          // Mark as visited in localStorage and session
          localStorage.setItem('hasVisited', 'true');
          localStorage.setItem('lastVisit', today);
          sessionStorage.setItem('sessionTracked', 'true');
          
          console.log('âœ… New visitor tracked successfully');
        } else {
          hasTracked.current = true; // Still set the ref to prevent re-runs
          setIsNewVisitor(false);
          console.log('ðŸ‘‹ Returning visitor - not tracking');
        }
      } catch (error) {
        console.error('Error tracking visitor:', error);
        // Reset the flag on error so it can try again
        hasTracked.current = false;
      }
    };

    trackVisitor();
  }, []); // Empty dependency array

  return { isNewVisitor };
};

export default useVisitorCounter;