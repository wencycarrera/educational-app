/**
 * Migration Utilities
 * Handles one-time data migrations for schema changes
 */

import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { FIREBASE_DB } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateLevel } from './leveling';

const MIGRATION_KEY_PREFIX = '@migration_';
const MIGRATION_STARS_TO_POINTS_KEY = `${MIGRATION_KEY_PREFIX}stars_to_points`;
const MIGRATION_PARENT_TO_STUDENT_KEY = `${MIGRATION_KEY_PREFIX}parent_to_student`;
const MIGRATION_CALCULATE_LEVEL_KEY = `${MIGRATION_KEY_PREFIX}calculate_level`;

/**
 * Migrate childProfile.stars to childProfile.points
 * This is a one-time migration that should be called on app start
 * It checks if migration has already been completed to avoid running multiple times
 */
export async function migrateStarsToPoints(): Promise<{ migrated: number; skipped: number }> {
  try {
    // Check if migration has already been completed
    const migrationCompleted = await AsyncStorage.getItem(MIGRATION_STARS_TO_POINTS_KEY);
    if (migrationCompleted === 'true') {
      console.log('📦 [Migration] Stars to points migration already completed');
      return { migrated: 0, skipped: 0 };
    }

    console.log('🔄 [Migration] Starting stars to points migration...');

    const usersRef = collection(FIREBASE_DB, 'users');
    const usersSnapshot = await getDocs(usersRef);

    let migrated = 0;
    let skipped = 0;

    const batch: Promise<void>[] = [];

    usersSnapshot.forEach((userDoc) => {
      const userData = userDoc.data();
      
      // Only migrate student users with studentProfile
      if (userData.role === 'student' && userData.studentProfile) {
        // Check if stars field exists and points doesn't
        if ((userData.studentProfile as any).stars !== undefined && userData.studentProfile.points === undefined) {
          const starsValue = (userData.studentProfile as any).stars || 0;
          
          batch.push(
            updateDoc(doc(FIREBASE_DB, 'users', userDoc.id), {
              'studentProfile.points': starsValue,
            }).then(() => {
              migrated++;
              console.log(`✅ [Migration] Migrated user ${userDoc.id}: ${starsValue} stars → ${starsValue} points`);
            })
          );
        } else {
          skipped++;
        }
      } else {
        skipped++;
      }
    });

    // Wait for all updates to complete
    await Promise.all(batch);

    // Mark migration as completed
    await AsyncStorage.setItem(MIGRATION_STARS_TO_POINTS_KEY, 'true');

    console.log(`✅ [Migration] Migration completed: ${migrated} users migrated, ${skipped} skipped`);
    return { migrated, skipped };
  } catch (error) {
    console.error('❌ [Migration] Error during migration:', error);
    throw new Error('Failed to migrate stars to points');
  }
}

/**
 * Migrate parent role accounts to student role
 * Converts parentProfile + childProfile structure to studentProfile with nested parentInfo
 * This is a one-time migration that should be called on app start
 */
export async function migrateParentToStudent(): Promise<{ migrated: number; skipped: number }> {
  try {
    // Check if migration has already been completed
    const migrationCompleted = await AsyncStorage.getItem(MIGRATION_PARENT_TO_STUDENT_KEY);
    if (migrationCompleted === 'true') {
      console.log('📦 [Migration] Parent to student migration already completed');
      return { migrated: 0, skipped: 0 };
    }

    console.log('🔄 [Migration] Starting parent to student migration...');

    const usersRef = collection(FIREBASE_DB, 'users');
    const usersSnapshot = await getDocs(usersRef);

    let migrated = 0;
    let skipped = 0;

    const batch: Promise<void>[] = [];

    usersSnapshot.forEach((userDoc) => {
      const userData = userDoc.data();
      
      // Only migrate parent users with parentProfile and childProfile
      if (userData.role === 'parent' && userData.parentProfile && userData.childProfile) {
        const parentProfile = userData.parentProfile;
        const childProfile = userData.childProfile;
        
        // Create new studentProfile structure
        const studentProfile = {
          name: childProfile.name,
          birthday: childProfile.birthday,
          gender: childProfile.gender,
          points: childProfile.points ?? (childProfile as any).stars ?? 0,
          parentInfo: {
            parentName: parentProfile.parentName,
            parentBirthday: parentProfile.parentBirthday,
            parentEmail: userData.email,
          },
          joinedClassID: parentProfile.joinedClassID,
        };
        
        batch.push(
          updateDoc(doc(FIREBASE_DB, 'users', userDoc.id), {
            role: 'student',
            studentProfile,
            // Remove old fields (Firestore will keep them but we don't reference them)
            // parentProfile: deleteField(), // Uncomment if you want to remove old fields
            // childProfile: deleteField(),  // Uncomment if you want to remove old fields
          }).then(() => {
            migrated++;
            console.log(`✅ [Migration] Migrated user ${userDoc.id}: parent → student`);
          })
        );
      } else {
        skipped++;
      }
    });

    // Wait for all updates to complete
    await Promise.all(batch);

    // Mark migration as completed
    await AsyncStorage.setItem(MIGRATION_PARENT_TO_STUDENT_KEY, 'true');

    console.log(`✅ [Migration] Parent to student migration completed: ${migrated} users migrated, ${skipped} skipped`);
    return { migrated, skipped };
  } catch (error) {
    console.error('❌ [Migration] Error during parent to student migration:', error);
    throw new Error('Failed to migrate parent to student');
  }
}

/**
 * Calculate and store level for all existing students based on their current points
 * This is a one-time migration that should be called on app start
 * It checks if migration has already been completed to avoid running multiple times
 */
export async function migrateCalculateLevel(): Promise<{ migrated: number; skipped: number }> {
  try {
    // Check if migration has already been completed
    const migrationCompleted = await AsyncStorage.getItem(MIGRATION_CALCULATE_LEVEL_KEY);
    if (migrationCompleted === 'true') {
      console.log('📦 [Migration] Calculate level migration already completed');
      return { migrated: 0, skipped: 0 };
    }

    console.log('🔄 [Migration] Starting calculate level migration...');

    const usersRef = collection(FIREBASE_DB, 'users');
    const usersSnapshot = await getDocs(usersRef);

    let migrated = 0;
    let skipped = 0;

    const batch: Promise<void>[] = [];

    usersSnapshot.forEach((userDoc) => {
      const userData = userDoc.data();
      
      // Only migrate student users with studentProfile
      if (userData.role === 'student' && userData.studentProfile) {
        // Get current points (support both old 'stars' field and new 'points' field)
        const currentPoints = userData.studentProfile.points ?? (userData.studentProfile as any).stars ?? 0;
        
        // Calculate level from points
        const calculatedLevel = calculateLevel(currentPoints);
        
        // Check if level field doesn't exist or is different from calculated value
        const existingLevel = userData.studentProfile.level;
        if (existingLevel === undefined || existingLevel !== calculatedLevel) {
          batch.push(
            updateDoc(doc(FIREBASE_DB, 'users', userDoc.id), {
              'studentProfile.level': calculatedLevel,
            }).then(() => {
              migrated++;
              console.log(`✅ [Migration] Updated level for user ${userDoc.id}: ${existingLevel ?? 'undefined'} → ${calculatedLevel} (points: ${currentPoints})`);
            })
          );
        } else {
          skipped++;
        }
      } else {
        skipped++;
      }
    });

    // Wait for all updates to complete
    await Promise.all(batch);

    // Mark migration as completed
    await AsyncStorage.setItem(MIGRATION_CALCULATE_LEVEL_KEY, 'true');

    console.log(`✅ [Migration] Calculate level migration completed: ${migrated} users migrated, ${skipped} skipped`);
    return { migrated, skipped };
  } catch (error) {
    console.error('❌ [Migration] Error during calculate level migration:', error);
    throw new Error('Failed to migrate calculate level');
  }
}

/**
 * Reset migration flag (for testing purposes)
 */
export async function resetMigrationFlag(): Promise<void> {
  await AsyncStorage.removeItem(MIGRATION_STARS_TO_POINTS_KEY);
  await AsyncStorage.removeItem(MIGRATION_PARENT_TO_STUDENT_KEY);
  await AsyncStorage.removeItem(MIGRATION_CALCULATE_LEVEL_KEY);
  console.log('🔄 [Migration] Migration flags reset');
}

