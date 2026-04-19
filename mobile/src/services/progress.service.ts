import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
  doc,
  setDoc,
  updateDoc,
  getDoc,
} from 'firebase/firestore';
import { FIREBASE_DB } from '../config/firebase';
import {
  StudentProgress,
  ProgressStats,
  ClassProgressSummary,
  StudentProgressSummary,
  ProgressStatus,
  ActivityTimelineItem,
  TopicProgressSummary,
  ActivityTypeSummary,
  ActivityType,
} from '../types/progress';
import { getStudentsByClass, getClassroomById } from './classroom.service';
import { getLessonModulesByClass, getLessonModuleById, LessonModule } from './lesson.service';
import { calculateLevel } from '../utils/leveling';

/**
 * Get progress for a specific student
 */
export async function getStudentProgress(
  studentID: string,
  classID?: string
): Promise<StudentProgress[]> {
  try {
    const progressRef = collection(FIREBASE_DB, 'student_progress');
    let q;

    if (classID) {
      // Query order must match index: classID, studentID, lastAttemptAt, __name__
      q = query(
        progressRef,
        where('classID', '==', classID),
        where('studentID', '==', studentID),
        orderBy('lastAttemptAt', 'desc')
      );
    } else {
      // For queries without classID, fetch without orderBy to avoid index requirement
      q = query(
        progressRef,
        where('studentID', '==', studentID)
      );
    }

    const querySnapshot = await getDocs(q);
    const progress: StudentProgress[] = [];

    querySnapshot.forEach((doc) => {
      progress.push({
        id: doc.id,
        ...doc.data(),
      } as StudentProgress);
    });

    // Sort manually if we didn't use orderBy (for queries without classID)
    if (!classID) {
      progress.sort((a, b) => {
        if (!a.lastAttemptAt && !b.lastAttemptAt) return 0;
        if (!a.lastAttemptAt) return 1;
        if (!b.lastAttemptAt) return -1;
        const aTime = a.lastAttemptAt.toMillis ? a.lastAttemptAt.toMillis() : a.lastAttemptAt;
        const bTime = b.lastAttemptAt.toMillis ? b.lastAttemptAt.toMillis() : b.lastAttemptAt;
        return bTime - aTime; // Descending order
      });
    }

    return progress;
  } catch (error) {
    console.error('Error fetching student progress:', error);
    throw new Error('Failed to fetch student progress. Please try again.');
  }
}

/**
 * Get progress for all students in a class
 */
export async function getClassProgress(classID: string): Promise<StudentProgress[]> {
  try {
    const progressRef = collection(FIREBASE_DB, 'student_progress');
    const q = query(
      progressRef,
      where('classID', '==', classID),
      orderBy('lastAttemptAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const progress: StudentProgress[] = [];

    querySnapshot.forEach((doc) => {
      progress.push({
        id: doc.id,
        ...doc.data(),
      } as StudentProgress);
    });

    return progress;
  } catch (error) {
    console.error('Error fetching class progress:', error);
    throw new Error('Failed to fetch class progress. Please try again.');
  }
}

/**
 * Get progress for a specific lesson module
 */
export async function getProgressByModule(moduleID: string): Promise<StudentProgress[]> {
  try {
    const progressRef = collection(FIREBASE_DB, 'student_progress');
    const q = query(
      progressRef,
      where('moduleID', '==', moduleID),
      orderBy('score', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const progress: StudentProgress[] = [];

    querySnapshot.forEach((doc) => {
      progress.push({
        id: doc.id,
        ...doc.data(),
      } as StudentProgress);
    });

    return progress;
  } catch (error) {
    console.error('Error fetching module progress:', error);
    throw new Error('Failed to fetch module progress. Please try again.');
  }
}

/**
 * Calculate aggregate statistics for a class
 */
export async function getProgressStats(classID: string): Promise<ProgressStats> {
  try {
    // Get all students in the class
    const students = await getStudentsByClass(classID);
    const totalStudents = students.length;

    // Get all lesson modules for the class
    const modules = await getLessonModulesByClass(classID);
    const totalModules = modules.length;

    // Get all progress records for the class
    const allProgress = await getClassProgress(classID);

    // Calculate statistics
    const completedProgress = allProgress.filter((p) => p.status === 'completed');
    const completedModules = new Set(completedProgress.map((p) => p.moduleID)).size;

    // Use bestScore when available so averages reflect the best attempt
    const totalScores = completedProgress.reduce((sum, p) => {
      const scoreForAverage = p.bestScore ?? p.score;
      return sum + scoreForAverage;
    }, 0);
    const averageScore =
      completedProgress.length > 0 ? totalScores / completedProgress.length : 0;

    const totalPossibleCompletions = totalModules * totalStudents;
    const completionRate =
      totalPossibleCompletions > 0
        ? (completedProgress.length / totalPossibleCompletions) * 100
        : 0;

    const totalTimeSpent = allProgress.reduce((sum, p) => sum + p.timeSpent, 0);
    const averageTimeSpent =
      allProgress.length > 0 ? totalTimeSpent / allProgress.length : 0;

    return {
      totalStudents,
      totalModules,
      completedModules,
      averageScore: Math.round(averageScore * 10) / 10, // Round to 1 decimal
      completionRate: Math.round(completionRate * 10) / 10, // Round to 1 decimal
      averageTimeSpent: Math.round(averageTimeSpent),
    };
  } catch (error) {
    console.error('Error calculating progress stats:', error);
    throw new Error('Failed to calculate progress statistics. Please try again.');
  }
}

/**
 * Get class progress summary
 */
export async function getClassProgressSummary(
  classID: string
): Promise<ClassProgressSummary> {
  try {
    const classroom = await getClassroomById(classID);
    if (!classroom) {
      throw new Error('Classroom not found');
    }

    const stats = await getProgressStats(classID);
    const progress = await getClassProgress(classID);

    return {
      classID,
      className: classroom.className,
      stats,
      studentProgress: progress,
    };
  } catch (error) {
    console.error('Error fetching class progress summary:', error);
    throw new Error('Failed to fetch class progress summary. Please try again.');
  }
}

/**
 * Get student progress summary
 * Enhanced to include lesson details
 */
export async function getStudentProgressSummary(
  studentID: string,
  studentName: string,
  classID: string
): Promise<StudentProgressSummary> {
  try {
    const progress = await getStudentProgress(studentID, classID);
    const modules = await getLessonModulesByClass(classID);
    const totalModules = modules.length;

    // Enrich progress with lesson data
    const enrichedProgress = await enrichProgressWithLessons(progress, modules);

    const completedProgress = enrichedProgress.filter((p) => p.status === 'completed');
    const completedModules = completedProgress.length;

    const totalScores = completedProgress.reduce((sum, p) => {
      const scoreForAverage = p.bestScore ?? p.score;
      return sum + scoreForAverage;
    }, 0);
    const averageScore =
      completedProgress.length > 0 ? totalScores / completedProgress.length : 0;

    const completionRate =
      totalModules > 0 ? (completedModules / totalModules) * 100 : 0;

    // Get most recent activity
    const lastActivity =
      enrichedProgress.length > 0 && enrichedProgress[0].lastAttemptAt
        ? enrichedProgress[0].lastAttemptAt
        : null;

    return {
      studentID,
      studentName,
      totalModules,
      completedModules,
      averageScore: Math.round(averageScore * 10) / 10,
      completionRate: Math.round(completionRate * 10) / 10,
      lastActivity,
      progress: enrichedProgress,
    };
  } catch (error) {
    console.error('Error fetching student progress summary:', error);
    throw new Error('Failed to fetch student progress summary. Please try again.');
  }
}

/**
 * Calculate stars earned based on score
 * Unified system: 1-3 stars matching visual rating display
 * - Score ≥ 80% → 3 stars
 * - Score ≥ 50% → 2 stars
 * - Score < 50% → 1 star (if score > 0)
 * - Score = 0 → 0 stars
 */
export function calculateStarsEarned(score: number): number {
  if (score < 0) return 0;
  if (score === 0) return 0;
  
  // Unified star system: 1-3 stars based on percentage
  if (score >= 80) return 3;
  if (score >= 50) return 2;
  return 1; // Score > 0 but < 50
}

/**
 * Join lesson module data with progress records
 */
async function enrichProgressWithLessons(
  progress: StudentProgress[],
  modules: LessonModule[]
): Promise<StudentProgress[]> {
  const moduleMap = new Map<string, LessonModule>();
  modules.forEach((module) => {
    moduleMap.set(module.id, module);
  });

  return progress.map((p) => {
    const module = moduleMap.get(p.moduleID);
    // Use bestScore if available (for new records), otherwise use score (for backward compatibility)
    const scoreForStars = p.bestScore ?? p.score;
    if (module) {
      return {
        ...p,
        lessonTitle: module.title,
        topicCategory: module.topicCategory,
        activityType: module.activityType,
        starsEarned: calculateStarsEarned(scoreForStars),
      };
    }
    return {
      ...p,
      starsEarned: calculateStarsEarned(scoreForStars),
    };
  });
}

/**
 * Save or update student progress for a lesson module
 * Also updates the child profile stars in the user document
 */
export async function saveStudentProgress(data: {
  studentID: string;
  moduleID: string;
  classID: string;
  score: number; // 0-100
  timeSpent: number; // seconds
  isCompleted?: boolean; // If true, marks as completed
}): Promise<{ progressId: string; starsEarned: number; leveledUp: boolean; newLevel?: number; oldLevel?: number }> {
  try {
    const { studentID, moduleID, classID, score, timeSpent, isCompleted = false } = data;

    // Log at start of saveStudentProgress
    console.log('📝 [ProgressService] Saving progress:', {
      studentID,
      moduleID,
      classID,
      score,
      timeSpent,
      isCompleted,
    });

    // Validate score range
    if (score < 0 || score > 100) {
      throw new Error('Score must be between 0 and 100');
    }

    // Check if progress already exists
    const progressRef = collection(FIREBASE_DB, 'student_progress');
    const existingProgressQuery = query(
      progressRef,
      where('studentID', '==', studentID),
      where('moduleID', '==', moduleID),
      where('classID', '==', classID)
    );

    console.log('🔍 [ProgressService] Checking for existing progress...');
    const existingDocs = await getDocs(existingProgressQuery);
    const now = Timestamp.now();

    let progressId: string;
    let currentAttempts = 1;
    let currentStatus: ProgressStatus = isCompleted ? 'completed' : 'in_progress';
    let pointsToAward = 0; // Points to add to childProfile.points (incremental, 1 star = 1 point)
    let starsEarned = 0; // Stars for this attempt (for display/return - visual rating only)

    if (!existingDocs.empty) {
      // Update existing progress
      const existingDoc = existingDocs.docs[0];
      progressId = existingDoc.id;
      const existingData = existingDoc.data() as StudentProgress;
      
      currentAttempts = (existingData.attempts || 0) + 1;
      
      // Get existing bestScore (or use current score if bestScore doesn't exist yet - migration support)
      const existingBestScore = existingData.bestScore ?? existingData.score;
      
      // Determine status: if isCompleted is true, always mark as completed
      // If already completed, keep it as completed
      if (isCompleted) {
        currentStatus = 'completed';
      } else if (existingData.status === 'completed') {
        // Keep existing completed status
        currentStatus = 'completed';
      } else {
        currentStatus = 'in_progress';
      }

      // Calculate stars for current attempt
      starsEarned = calculateStarsEarned(score);
      
      // Calculate incremental points (only award if score improved)
      // 1 star = 1 point (direct conversion)
      if (score > existingBestScore) {
        const newStars = calculateStarsEarned(score);
        const oldStars = calculateStarsEarned(existingBestScore);
        pointsToAward = newStars - oldStars; // Direct conversion: 1 star = 1 point
        
        console.log('⭐ [ProgressService] Score improved!', {
          oldBestScore: existingBestScore,
          newScore: score,
          oldStars,
          newStars,
          incrementalPoints: pointsToAward,
        });
      } else {
        pointsToAward = 0;
        console.log('📊 [ProgressService] Score did not improve, no points awarded', {
          currentScore: score,
          bestScore: existingBestScore,
        });
      }

      console.log('✅ [ProgressService] Setting status:', currentStatus);
      console.log('📋 [ProgressService] Existing data:', {
        existingStatus: existingData.status,
        existingCompletedAt: existingData.completedAt,
        isCompleted,
        newStatus: currentStatus,
      });

      // Update progress document
      const updateData: Partial<StudentProgress> = {
        score,
        attempts: currentAttempts,
        timeSpent: existingData.timeSpent + timeSpent, // Accumulate time
        lastAttemptAt: now,
        status: currentStatus,
      };

      // Update bestScore if new score is better
      if (score > existingBestScore) {
        updateData.bestScore = score;
      } else {
        // Keep existing bestScore (explicitly set to prevent loss)
        updateData.bestScore = existingBestScore;
      }

      // Only update completedAt if marking as completed
      if (isCompleted && !existingData.completedAt) {
        updateData.completedAt = now;
      } else if (existingData.completedAt) {
        // Keep existing completedAt if already set
        updateData.completedAt = existingData.completedAt;
      }

      console.log('💾 [ProgressService] Writing to Firestore (update):', updateData);
      await updateDoc(doc(FIREBASE_DB, 'student_progress', progressId), updateData);
      
      console.log('✅ [ProgressService] Updated progress successfully:', {
        progressId,
        moduleID,
        studentID,
        status: currentStatus,
        isCompleted,
        score,
        bestScore: updateData.bestScore,
        pointsAwarded: pointsToAward,
      });
    } else {
      // Create new progress document
      const newProgressRef = doc(progressRef);
      progressId = newProgressRef.id;

      // Calculate stars for new attempt (visual rating)
      starsEarned = calculateStarsEarned(score);
      pointsToAward = starsEarned; // First attempt gets full points (1 star = 1 point)

      const progressData: Omit<StudentProgress, 'id'> = {
        studentID,
        moduleID,
        classID,
        score,
        bestScore: score, // First attempt: bestScore = score
        attempts: 1,
        timeSpent,
        completedAt: isCompleted ? now : null,
        status: currentStatus,
        lastAttemptAt: now,
      };

      console.log('💾 [ProgressService] Writing to Firestore (create):', progressData);
      await setDoc(newProgressRef, progressData);
      
      console.log('✅ [ProgressService] Created new progress successfully:', {
        progressId,
        moduleID,
        studentID,
        status: currentStatus,
        isCompleted,
        score,
        bestScore: score,
        pointsAwarded: pointsToAward,
      });
    }

    // Track level-up information
    let leveledUp = false;
    let oldLevel: number | undefined;
    let newLevel: number | undefined;

    // Update child profile points in user document (only if points to award)
    if (pointsToAward > 0) {
      const userRef = doc(FIREBASE_DB, 'users', studentID);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Only update if user is a student with student profile
        if (userData.role === 'student' && userData.studentProfile) {
          // Support both old 'stars' field (for migration) and new 'points' field
          const currentPoints = userData.studentProfile.points ?? (userData.studentProfile as any).stars ?? 0;
          const newPoints = currentPoints + pointsToAward;
          
          // Get old level before updating
          oldLevel = userData.studentProfile.level ?? calculateLevel(currentPoints);
          
          // Calculate new level based on updated points
          newLevel = calculateLevel(newPoints);
          
          // Check if level increased
          leveledUp = newLevel > oldLevel;

          console.log('⭐ [ProgressService] Updating student points and level:', {
            currentPoints,
            pointsToAdd: pointsToAward,
            newTotal: newPoints,
            oldLevel,
            newLevel,
            leveledUp,
          });

          // Update both fields during migration period
          const updateData: any = {
            'studentProfile.points': newPoints,
            'studentProfile.level': newLevel,
          };
          
          // Also migrate old field if it exists
          if ((userData.studentProfile as any).stars !== undefined) {
            updateData['studentProfile.stars'] = newPoints;
          }

          await updateDoc(userRef, updateData);
        }
      }
    }

    return {
      progressId,
      starsEarned, // Return stars for this attempt (for display purposes)
      leveledUp,
      newLevel,
      oldLevel,
    };
  } catch (error) {
    console.error('Error saving student progress:', error);
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Failed to save student progress. Please try again.'
    );
  }
}

/**
 * Get progress grouped by topic category
 */
export async function getProgressByTopic(
  studentID: string,
  classID: string
): Promise<TopicProgressSummary[]> {
  try {
    const progress = await getStudentProgress(studentID, classID);
    const modules = await getLessonModulesByClass(classID);
    const enrichedProgress = await enrichProgressWithLessons(progress, modules);

    // Group by topic category
    const topicMap = new Map<string, StudentProgress[]>();
    const topicModuleCount = new Map<string, Set<string>>();

    // Count modules per topic
    modules.forEach((module) => {
      if (!topicModuleCount.has(module.topicCategory)) {
        topicModuleCount.set(module.topicCategory, new Set());
      }
      topicModuleCount.get(module.topicCategory)!.add(module.id);
    });

    // Group progress by topic
    enrichedProgress.forEach((p) => {
      if (p.topicCategory) {
        if (!topicMap.has(p.topicCategory)) {
          topicMap.set(p.topicCategory, []);
        }
        topicMap.get(p.topicCategory)!.push(p);
      }
    });

    // Build summary for each topic
    const summaries: TopicProgressSummary[] = [];
    topicMap.forEach((progressList, topic) => {
      const totalModules = topicModuleCount.get(topic)?.size || 0;
      const completedProgress = progressList.filter((p) => p.status === 'completed');
      const completedModules = new Set(completedProgress.map((p) => p.moduleID)).size;

      const totalScores = completedProgress.reduce((sum, p) => sum + p.score, 0);
      const averageScore = completedProgress.length > 0 ? totalScores / completedProgress.length : 0;

      const completionRate = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;
      const totalStars = progressList.reduce((sum, p) => sum + (p.starsEarned || 0), 0);
      const totalTime = progressList.reduce((sum, p) => sum + p.timeSpent, 0);
      const averageTimeSpent = progressList.length > 0 ? totalTime / progressList.length : 0;

      summaries.push({
        topicCategory: topic,
        totalModules,
        completedModules,
        averageScore: Math.round(averageScore * 10) / 10,
        completionRate: Math.round(completionRate * 10) / 10,
        totalStars,
        averageTimeSpent: Math.round(averageTimeSpent),
        progress: progressList,
      });
    });

    return summaries.sort((a, b) => a.topicCategory.localeCompare(b.topicCategory));
  } catch (error) {
    console.error('Error fetching progress by topic:', error);
    throw new Error('Failed to fetch progress by topic. Please try again.');
  }
}

/**
 * Get progress grouped by activity type
 */
export async function getProgressByActivityType(
  studentID: string,
  classID: string
): Promise<ActivityTypeSummary[]> {
  try {
    const progress = await getStudentProgress(studentID, classID);
    const modules = await getLessonModulesByClass(classID);
    const enrichedProgress = await enrichProgressWithLessons(progress, modules);

    // Group by activity type
    const typeMap = new Map<ActivityType, StudentProgress[]>();
    const typeModuleCount = new Map<ActivityType, Set<string>>();

    // Count modules per type
    modules.forEach((module) => {
      if (!typeModuleCount.has(module.activityType)) {
        typeModuleCount.set(module.activityType, new Set());
      }
      typeModuleCount.get(module.activityType)!.add(module.id);
    });

    // Group progress by type
    enrichedProgress.forEach((p) => {
      if (p.activityType) {
        if (!typeMap.has(p.activityType)) {
          typeMap.set(p.activityType, []);
        }
        typeMap.get(p.activityType)!.push(p);
      }
    });

    // Build summary for each type
    const summaries: ActivityTypeSummary[] = [];
    typeMap.forEach((progressList, activityType) => {
      const totalModules = typeModuleCount.get(activityType)?.size || 0;
      const completedProgress = progressList.filter((p) => p.status === 'completed');
      const completedModules = new Set(completedProgress.map((p) => p.moduleID)).size;

      const totalScores = completedProgress.reduce((sum, p) => sum + p.score, 0);
      const averageScore = completedProgress.length > 0 ? totalScores / completedProgress.length : 0;

      const completionRate = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;
      const totalAttempts = progressList.reduce((sum, p) => sum + p.attempts, 0);
      const totalTimeSpent = progressList.reduce((sum, p) => sum + p.timeSpent, 0);
      const totalStars = progressList.reduce((sum, p) => sum + (p.starsEarned || 0), 0);

      summaries.push({
        activityType,
        totalModules,
        completedModules,
        averageScore: Math.round(averageScore * 10) / 10,
        completionRate: Math.round(completionRate * 10) / 10,
        totalAttempts,
        totalTimeSpent,
        totalStars,
        progress: progressList,
      });
    });

    // Return in consistent order
    const typeOrder: ActivityType[] = ['quiz', 'drag_drop', 'ordering'];
    return typeOrder
      .map((type) => summaries.find((s) => s.activityType === type))
      .filter((s): s is ActivityTypeSummary => s !== undefined)
      .concat(summaries.filter((s) => !typeOrder.includes(s.activityType)));
  } catch (error) {
    console.error('Error fetching progress by activity type:', error);
    throw new Error('Failed to fetch progress by activity type. Please try again.');
  }
}

/**
 * Get chronological activity timeline
 */
export async function getActivityTimeline(
  studentID: string,
  classID: string,
  limit?: number
): Promise<ActivityTimelineItem[]> {
  try {
    const progress = await getStudentProgress(studentID, classID);
    const modules = await getLessonModulesByClass(classID);
    const enrichedProgress = await enrichProgressWithLessons(progress, modules);

    // Filter and map to timeline items
    const timelineItems: ActivityTimelineItem[] = enrichedProgress
      .filter((p) => p.lessonTitle && p.activityType && p.lastAttemptAt)
      .map((p) => {
        // Use bestScore if available, otherwise use score
        const scoreForStars = p.bestScore ?? p.score;
        return {
          id: p.id,
          lessonTitle: p.lessonTitle!,
          topicCategory: p.topicCategory || 'Unknown',
          activityType: p.activityType!,
          score: p.score,
          attempts: p.attempts,
          timeSpent: p.timeSpent,
          starsEarned: p.starsEarned || calculateStarsEarned(scoreForStars),
          status: p.status,
          completedAt: p.completedAt,
          lastAttemptAt: p.lastAttemptAt!,
          moduleID: p.moduleID,
        };
      })
      .sort((a, b) => {
        const aTime = a.lastAttemptAt.toMillis ? a.lastAttemptAt.toMillis() : 0;
        const bTime = b.lastAttemptAt.toMillis ? b.lastAttemptAt.toMillis() : 0;
        return bTime - aTime; // Descending order (most recent first)
      });

    return limit ? timelineItems.slice(0, limit) : timelineItems;
  } catch (error) {
    console.error('Error fetching activity timeline:', error);
    throw new Error('Failed to fetch activity timeline. Please try again.');
  }
}

