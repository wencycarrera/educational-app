import { FIREBASE_DB } from '../config/firebase';
import { collection, addDoc } from 'firebase/firestore';

export const testFirebase = async () => {
  try {
    // Try to add a test document
    const docRef = await addDoc(collection(FIREBASE_DB, 'test'), {
      message: 'Firebase is working!',
      timestamp: new Date()
    });
    console.log('✅ Firebase connected! Document ID:', docRef.id);
    return true;
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
    return false;
  }
};