import {
  addDoc,
  collection,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  Unsubscribe,
  where,
} from 'firebase/firestore';
import { FIREBASE_DB } from '../config/firebase';
import { Material, NewMaterialInput } from '../types/material';
import { getClassroomById } from './classroom.service';

function mapMaterial(doc: any, id: string): Material {
  return {
    id,
    title: doc.title,
    link: doc.link,
    notes: doc.notes,
    classID: doc.classID,
    classCode: doc.classCode,
    teacherID: doc.teacherID,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  } as Material;
}

function validateUrl(link: string): boolean {
  if (!link) return false;
  try {
    const url = new URL(link);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function createMaterial(input: NewMaterialInput): Promise<Material> {
  if (!input.title.trim()) {
    throw new Error('Title is required');
  }
  if (!validateUrl(input.link)) {
    throw new Error('Valid link is required (http/https)');
  }
  if (!input.classID) {
    throw new Error('Classroom is required');
  }
  if (!input.teacherID) {
    throw new Error('Teacher ID is required');
  }

  // Resolve classCode if not provided to avoid extra reads downstream.
  let classCode = input.classCode;
  if (!classCode) {
    const classroom = await getClassroomById(input.classID);
    classCode = classroom?.classCode;
  }

  const materialsRef = collection(FIREBASE_DB, 'materials');
  const payload = {
    title: input.title.trim(),
    link: input.link.trim(),
    notes: input.notes?.trim() || '',
    classID: input.classID,
    classCode: classCode || '',
    teacherID: input.teacherID,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  const docRef = await addDoc(materialsRef, payload);

  const createdMaterial = mapMaterial(payload, docRef.id);

  // Trigger notifications asynchronously (don't block on errors)
  triggerMaterialNotifications(createdMaterial, input.classID).catch((error) => {
    console.error('Error sending material notifications (non-blocking):', error);
    // Notifications failed but material was created successfully
  });

  return createdMaterial;
}

export async function getMaterialsByClass(classID: string): Promise<Material[]> {
  const materialsRef = collection(FIREBASE_DB, 'materials');
  const q = query(
    materialsRef,
    where('classID', '==', classID),
    orderBy('createdAt', 'desc')
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => mapMaterial(docSnap.data(), docSnap.id));
}

export function subscribeToMaterialsForClass(
  classID: string,
  callback: (materials: Material[]) => void
): Unsubscribe {
  const materialsRef = collection(FIREBASE_DB, 'materials');
  const q = query(
    materialsRef,
    where('classID', '==', classID),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const materials = snapshot.docs.map((docSnap) =>
        mapMaterial(docSnap.data(), docSnap.id)
      );
      callback(materials);
    },
    (error) => {
      console.error('Error subscribing to materials:', error);
      callback([]);
    }
  );
}

/**
 * Trigger notifications when a new material is created
 * This runs asynchronously and doesn't block material creation
 */
async function triggerMaterialNotifications(
  material: Material,
  classID: string
): Promise<void> {
  try {
    // Import services dynamically to avoid circular dependencies
    const { sendNotificationToClass } = await import('./notification.service');
    const { sendEmailToClass } = await import('./email.service');
    const { getMaterialEmailTemplate } = await import('../utils/email-templates');
    const { doc, getDoc } = await import('firebase/firestore');
    const { FIREBASE_DB } = await import('../config/firebase');
    const { getClassroomById } = await import('./classroom.service');

    // Get teacher name (optional, for personalization)
    let teacherName: string | undefined;
    try {
      const classroom = await getClassroomById(classID);
      if (classroom?.teacherID) {
        const teacherRef = doc(FIREBASE_DB, 'users', classroom.teacherID);
        const teacherSnap = await getDoc(teacherRef);
        if (teacherSnap.exists()) {
          const teacherData = teacherSnap.data();
          if (teacherData.teacherProfile?.name) {
            teacherName = teacherData.teacherProfile.name;
          } else if (teacherData.name) {
            teacherName = teacherData.name;
          }
        }
      }
    } catch (error) {
      console.warn('Could not fetch teacher name for notification:', error);
      // Continue without teacher name
    }

    // Create in-app notifications for all students in the class
    await sendNotificationToClass(
      classID,
      `New Material: ${material.title}`,
      `A new material "${material.title}" is now available. Check it out!`,
      'material_post',
      {
        classID,
        materialID: material.id,
        link: material.link,
      }
    );

    // Send email notifications
    const emailTemplate = getMaterialEmailTemplate(material.title, teacherName);
    await sendEmailToClass(classID, emailTemplate);
  } catch (error) {
    // Log error but don't throw - this is a fire-and-forget operation
    console.error('Error in triggerMaterialNotifications:', error);
  }
}

