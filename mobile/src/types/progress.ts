import { Timestamp } from 'firebase/firestore';

/**
 * Student Progress Status
 */
export type ProgressStatus = 'completed' | 'in_progress' | 'not_started';

/**
 * Activity Type
 */
export type ActivityType = 'drag_drop' | 'ordering' | 'quiz' | 'number_line' | 'place_value' | 'comparison' | 'visual_counting' | 'sequential_counting' | 'ordinal_position' | 'matching' | 'word_problem' | 'demonstration';

/**
 * Student Progress Interface
 * Tracks detailed student performance on lesson modules
 */
export interface StudentProgress {
  id: string;
  studentID: string; // Student account ID (1 parent = 1 student account)
  moduleID: string; // lesson module reference
  classID: string;
  score: number; // 0-100
  bestScore?: number; // Highest score achieved for this module (0-100)
  attempts: number;
  timeSpent: number; // seconds
  completedAt: Timestamp | null;
  status: ProgressStatus;
  lastAttemptAt: Timestamp | null;
  // Enhanced fields (optional, populated when joined with lesson data)
  lessonTitle?: string;
  topicCategory?: string;
  activityType?: ActivityType;
  starsEarned?: number; // Calculated stars for this attempt
}

/**
 * Progress Statistics Interface
 * Aggregate statistics for a class or student
 */
export interface ProgressStats {
  totalStudents: number;
  totalModules: number;
  completedModules: number;
  averageScore: number;
  completionRate: number; // percentage 0-100
  averageTimeSpent: number; // seconds
}

/**
 * Class Progress Summary Interface
 * Summary of progress for all students in a class
 */
export interface ClassProgressSummary {
  classID: string;
  className: string;
  stats: ProgressStats;
  studentProgress: StudentProgress[];
}

/**
 * Student Progress Summary Interface
 * Summary of progress for a single student
 */
export interface StudentProgressSummary {
  studentID: string;
  studentName: string;
  totalModules: number;
  completedModules: number;
  averageScore: number;
  completionRate: number;
  lastActivity: Timestamp | null;
  progress: StudentProgress[];
}

/**
 * Activity Timeline Item Interface
 * Enhanced timeline entry with full lesson details
 */
export interface ActivityTimelineItem {
  id: string;
  lessonTitle: string;
  topicCategory: string;
  activityType: ActivityType;
  score: number;
  attempts: number;
  timeSpent: number;
  starsEarned: number;
  status: ProgressStatus;
  completedAt: Timestamp | null;
  lastAttemptAt: Timestamp;
  moduleID: string;
}

/**
 * Topic Progress Summary Interface
 * Progress grouped by topic category
 */
export interface TopicProgressSummary {
  topicCategory: string;
  totalModules: number;
  completedModules: number;
  averageScore: number;
  completionRate: number;
  totalStars: number;
  averageTimeSpent: number;
  progress: StudentProgress[];
}

/**
 * Activity Type Summary Interface
 * Progress grouped by activity type
 */
export interface ActivityTypeSummary {
  activityType: ActivityType;
  totalModules: number;
  completedModules: number;
  averageScore: number;
  completionRate: number;
  totalAttempts: number;
  totalTimeSpent: number;
  totalStars: number;
  progress: StudentProgress[];
}

/**
 * Time Analytics Interface
 * Time-based statistics for learning activities
 */
export interface TimeAnalytics {
  totalTimeSpent: number; // Total seconds
  averageTimePerActivity: number; // Average seconds per activity
  averageTimePerCompleted: number; // Average seconds per completed activity
  dailyActivity: DailyActivity[]; // Activities grouped by day
  weeklySummary: WeeklyActivity[]; // Weekly summaries
  mostActiveDay?: string; // Day of week
  mostActiveTime?: string; // Time of day range
}

/**
 * Daily Activity Interface
 */
export interface DailyActivity {
  date: string; // YYYY-MM-DD format
  dateTimestamp: Timestamp;
  activityCount: number;
  completedCount: number;
  totalTimeSpent: number;
  averageScore: number;
  starsEarned: number;
}

/**
 * Weekly Activity Interface
 */
export interface WeeklyActivity {
  weekStart: string; // YYYY-MM-DD format
  weekStartTimestamp: Timestamp;
  activityCount: number;
  completedCount: number;
  totalTimeSpent: number;
  averageScore: number;
  starsEarned: number;
}

/**
 * Performance Trend Interface
 */
export interface PerformanceTrend {
  date: string; // YYYY-MM-DD format
  dateTimestamp: Timestamp;
  averageScore: number;
  completedCount: number;
}

/**
 * Performance Analysis Interface
 */
export interface PerformanceAnalysis {
  trends: PerformanceTrend[];
  strengths: string[]; // Topic categories with high performance
  areasForImprovement: string[]; // Topic categories needing work
  scoreImprovement: number; // Percentage change in recent scores vs earlier
  topicsMastered: string[]; // Topics with 100% completion
  topicsInProgress: string[]; // Topics partially completed
}

