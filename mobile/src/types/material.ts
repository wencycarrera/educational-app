import { Timestamp } from 'firebase/firestore';

/**
 * Material posted by a teacher (e.g., GDrive link + metadata).
 */
export interface Material {
  id: string;
  title: string;
  link: string;
  notes?: string;
  classID: string;
  classCode?: string;
  teacherID: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Input used when creating a new material.
 */
export interface NewMaterialInput {
  title: string;
  link: string;
  notes?: string;
  classID: string;
  classCode?: string;
  teacherID: string;
}

