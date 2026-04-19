import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  arrayUnion,
  Timestamp,
} from 'firebase/firestore';
import { FIREBASE_DB } from '../config/firebase';
import { UserWithStudentProfile } from '../types/user';

/**
 * Classroom Interface
 * Matches Firestore schema for classrooms collection
 */
export interface Classroom {
  id: string;
  teacherID: string;
  className: string;
  classCode: string; // Unique 6-char code
  studentIDs: string[]; // Array of parent IDs
  createdAt?: Timestamp;
}

/**
 * Student Info Interface
 * Combined parent and child profile for display
 */
export interface StudentInfo {
  studentID: string;
  parentName: string;
  studentName: string;
  studentProfile: {
    name: string;
    birthday: Timestamp;
    gender: 'male' | 'female' | 'other';
    points: number; // Renamed from stars
    level: number; // Current level (stored in Firebase)
  };
}

/**
 * Get all classrooms for a specific teacher
 */
export async function getClassroomsByTeacher(
  teacherID: string
): Promise<Classroom[]> {
  try {
    const classroomsRef = collection(FIREBASE_DB, 'classrooms');
    const q = query(classroomsRef, where('teacherID', '==', teacherID));

    const querySnapshot = await getDocs(q);
    const classrooms: Classroom[] = [];

    querySnapshot.forEach((doc) => {
      classrooms.push({
        id: doc.id,
        ...doc.data(),
      } as Classroom);
    });

    return classrooms;
  } catch (error) {
    console.error('Error fetching classrooms:', error);
    throw new Error('Failed to fetch classrooms. Please try again.');
  }
}

/**
 * Get classroom by ID
 */
export async function getClassroomById(classID: string): Promise<Classroom | null> {
  try {
    const classroomRef = doc(FIREBASE_DB, 'classrooms', classID);
    const classroomSnap = await getDoc(classroomRef);

    if (!classroomSnap.exists()) {
      return null;
    }

    return {
      id: classroomSnap.id,
      ...classroomSnap.data(),
    } as Classroom;
  } catch (error) {
    console.error('Error fetching classroom:', error);
    throw new Error('Failed to fetch classroom. Please try again.');
  }
}

/**
 * Get all students (parents) in a class
 * Returns student info with parent and child profiles
 */
export async function getStudentsByClass(classID: string): Promise<StudentInfo[]> {
  try {
    // First get the classroom to get studentIDs
    const classroom = await getClassroomById(classID);
    if (!classroom || !classroom.studentIDs || classroom.studentIDs.length === 0) {
      return [];
    }

    // Fetch user data for each student (parent) ID
    const students: StudentInfo[] = [];

    for (const parentID of classroom.studentIDs) {
      try {
        const userRef = doc(FIREBASE_DB, 'users', parentID);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data() as UserWithStudentProfile;
          
          // Only include if it's a student with student profile
          if (userData.role === 'student' && userData.studentProfile) {
            students.push({
              studentID: parentID,
              parentName: userData.studentProfile.parentInfo.parentName,
              studentName: userData.studentProfile.name,
              studentProfile: {
                name: userData.studentProfile.name,
                birthday: userData.studentProfile.birthday,
                gender: userData.studentProfile.gender,
                // Support migration: use points if available, otherwise fallback to stars
                points: (userData.studentProfile as any).points ?? (userData.studentProfile as any).stars ?? 0,
                // Support migration: use level if available, otherwise calculate from points
                level: userData.studentProfile.level ?? 1,
              },
            });
          }
        }
      } catch (error) {
        console.error(`Error fetching student ${parentID}:`, error);
        // Continue with other students even if one fails
      }
    }

    return students;
  } catch (error) {
    console.error('Error fetching students:', error);
    throw new Error('Failed to fetch students. Please try again.');
  }
}

/**
 * Generate a unique class code
 * Format: 3 letters + 3 numbers (e.g., "ABC123")
 */
function generateClassCode(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  
  let code = '';
  // Add 3 random letters
  for (let i = 0; i < 3; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  // Add 3 random numbers
  for (let i = 0; i < 3; i++) {
    code += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  
  return code;
}

/**
 * Check if a class code already exists
 */
async function classCodeExists(classCode: string): Promise<boolean> {
  try {
    const classroomsRef = collection(FIREBASE_DB, 'classrooms');
    const q = query(classroomsRef, where('classCode', '==', classCode));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking class code:', error);
    return false;
  }
}

/**
 * Create a new classroom
 * Generates a unique class code automatically
 * Note: Each teacher can only have one classroom
 */
export async function createClassroom(
  teacherID: string,
  className: string
): Promise<Classroom> {
  try {
    // Validate inputs
    if (!teacherID || !className || !className.trim()) {
      throw new Error('Teacher ID and class name are required');
    }

    // Check if teacher already has a classroom (one classroom per teacher restriction)
    const existingClassrooms = await getClassroomsByTeacher(teacherID);
    if (existingClassrooms.length > 0) {
      throw new Error('You already have a classroom. Each teacher can only have one classroom.');
    }

    // Generate a unique class code
    let classCode: string;
    let attempts = 0;
    const maxAttempts = 10;
    
    do {
      classCode = generateClassCode();
      attempts++;
      
      if (attempts >= maxAttempts) {
        throw new Error('Failed to generate a unique class code. Please try again.');
      }
    } while (await classCodeExists(classCode));

    // Create the classroom document
    const classroomsRef = collection(FIREBASE_DB, 'classrooms');
    const newClassroom = {
      teacherID,
      className: className.trim(),
      classCode,
      studentIDs: [],
      createdAt: Timestamp.now(),
    };

    const docRef = await addDoc(classroomsRef, newClassroom);

    return {
      id: docRef.id,
      ...newClassroom,
    } as Classroom;
  } catch (error) {
    console.error('Error creating classroom:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create classroom. Please try again.');
  }
}

/**
 * Join a class by class code
 * Finds classroom by code, validates, and updates both student and classroom documents
 */
export async function joinClassByCode(
  classCode: string,
  studentID: string
): Promise<Classroom> {
  try {
    // Validate inputs
    if (!classCode || !classCode.trim()) {
      throw new Error('Class code is required');
    }

    if (!studentID) {
      throw new Error('Student ID is required');
    }

    const trimmedCode = classCode.trim().toUpperCase();

    // Find classroom by class code
    const classroomsRef = collection(FIREBASE_DB, 'classrooms');
    const q = query(classroomsRef, where('classCode', '==', trimmedCode));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('Class code not found. Please check the code and try again.');
    }

    // Get the classroom document (should only be one)
    const classroomDoc = querySnapshot.docs[0];
    const classroomData = classroomDoc.data() as Omit<Classroom, 'id'>;
    const classroomID = classroomDoc.id;

    // Check if student is already in the class
    if (classroomData.studentIDs && classroomData.studentIDs.includes(studentID)) {
      throw new Error('You are already a member of this class.');
    }

    // Verify student user exists and is a student
    const userRef = doc(FIREBASE_DB, 'users', studentID);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      throw new Error('User not found. Please try again.');
    }

    const userData = userSnap.data();
    if (userData.role !== 'student') {
      throw new Error('Only student accounts can join classes.');
    }

    // Update student's joinedClassID
    await updateDoc(userRef, {
      'studentProfile.joinedClassID': classroomID,
    });

    // Add studentID to classroom's studentIDs array
    const classroomRef = doc(FIREBASE_DB, 'classrooms', classroomID);
    await updateDoc(classroomRef, {
      studentIDs: arrayUnion(studentID),
    });

    // Return the updated classroom
    return {
      id: classroomID,
      ...classroomData,
      studentIDs: [...(classroomData.studentIDs || []), studentID],
    } as Classroom;
  } catch (error) {
    console.error('Error joining class:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to join class. Please try again.');
  }
}

