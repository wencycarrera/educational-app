import { Timestamp } from 'firebase/firestore';

/**
 * Age Calculator Utility
 * Calculates age from a birthday timestamp
 */

/**
 * Calculate age from a birthday timestamp
 * @param birthday - Firestore Timestamp or Date object
 * @returns Age in years, or null if birthday is invalid
 */
export function calculateAge(birthday: Timestamp | Date | null | undefined): number | null {
  if (!birthday) return null;

  try {
    // Convert Firestore Timestamp to Date if needed
    const birthDate = birthday instanceof Timestamp 
      ? birthday.toDate() 
      : birthday instanceof Date 
      ? birthday 
      : new Date(birthday);

    // Check if date is valid
    if (isNaN(birthDate.getTime())) {
      return null;
    }

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    // Adjust age if birthday hasn't occurred this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    // Return null for invalid ages (negative or too large)
    if (age < 0 || age > 150) {
      return null;
    }

    return age;
  } catch (error) {
    console.error('Error calculating age:', error);
    return null;
  }
}

/**
 * Get age with months (e.g., "5 years, 3 months")
 * @param birthday - Firestore Timestamp or Date object
 * @returns Formatted age string, or null if birthday is invalid
 */
export function getAgeWithMonths(birthday: Timestamp | Date | null | undefined): string | null {
  if (!birthday) return null;

  try {
    const birthDate = birthday instanceof Timestamp 
      ? birthday.toDate() 
      : birthday instanceof Date 
      ? birthday 
      : new Date(birthday);

    if (isNaN(birthDate.getTime())) {
      return null;
    }

    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();

    if (months < 0) {
      years--;
      months += 12;
    }

    if (today.getDate() < birthDate.getDate()) {
      months--;
      if (months < 0) {
        years--;
        months += 12;
      }
    }

    if (years < 0 || years > 150) {
      return null;
    }

    if (years === 0) {
      return months === 1 ? '1 month' : `${months} months`;
    }

    if (months === 0) {
      return years === 1 ? '1 year' : `${years} years`;
    }

    return `${years} ${years === 1 ? 'year' : 'years'}, ${months} ${months === 1 ? 'month' : 'months'}`;
  } catch (error) {
    console.error('Error calculating age with months:', error);
    return null;
  }
}

/**
 * Check if birthday represents a child (typically ages 0-18)
 */
export function isChildAge(birthday: Timestamp | Date | null | undefined): boolean {
  const age = calculateAge(birthday);
  return age !== null && age >= 0 && age <= 18;
}

/**
 * Format age for display
 * @param birthday - Firestore Timestamp or Date object
 * @returns Formatted string like "5 years old" or null
 */
export function formatAge(birthday: Timestamp | Date | null | undefined): string | null {
  const age = calculateAge(birthday);
  if (age === null) return null;
  return age === 1 ? '1 year old' : `${age} years old`;
}

