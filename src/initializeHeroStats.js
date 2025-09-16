// Create this as a utility script: src/utils/initializeStats.js
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

export const initializeHeroStats = async () => {
  try {
    const statsDoc = doc(db, 'siteSettings', 'heroStats');
    const docSnapshot = await getDoc(statsDoc);
    
    // Only initialize if document doesn't exist
    if (!docSnapshot.exists()) {
      const defaultStats = [
        { 
          id: 'clients', 
          label: 'Clients Satisfaits', 
          value: 500, 
          suffix: '+', 
          icon: 'users' 
        },
        { 
          id: 'weddings', 
          label: 'Mariages Immortalisés', 
          value: 50, 
          suffix: '+', 
          icon: 'heart' 
        },
        { 
          id: 'photos', 
          label: 'Photos Professionnelles', 
          value: 1000, 
          suffix: '+', 
          icon: 'camera' 
        }
      ];

      await setDoc(statsDoc, {
        stats: defaultStats,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log('Hero stats initialized successfully');
      return true;
    } else {
      console.log('Hero stats already exist');
      return false;
    }
  } catch (error) {
    console.error('Error initializing hero stats:', error);
    return false;
  }
};

// Optional: Call this function when your app starts
// You can add this to your main App.js useEffect