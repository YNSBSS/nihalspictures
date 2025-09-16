import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export const useHeroStats = () => {
  const [stats, setStats] = useState([
    { id: 'clients', label: 'Clients Satisfaits', value: 500, suffix: '+' },
    { id: 'weddings', label: 'Mariages Immortalisés', value: 50, suffix: '+' },
    { id: 'photos', label: 'Photos Professionnelles', value: 1000, suffix: '+' }
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const statsDoc = doc(db, 'siteSettings', 'heroStats');
    
    const unsubscribe = onSnapshot(statsDoc, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data.stats && Array.isArray(data.stats)) {
          setStats(data.stats);
        }
      }
      setLoading(false);
    }, (error) => {
      console.error('Error loading hero stats:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { stats, loading };
};