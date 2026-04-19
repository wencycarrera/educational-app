import { Timestamp } from 'firebase/firestore';
import {
  StudentProgress,
  TimeAnalytics,
  DailyActivity,
  WeeklyActivity,
  PerformanceTrend,
  PerformanceAnalysis,
} from '../types/progress';
import { getStudentProgress, getStudentProgressSummary } from './progress.service';
import { getLessonModulesByClass } from './lesson.service';

/**
 * Get time-based analytics for a student
 */
export async function getTimeAnalytics(
  studentID: string,
  classID: string
): Promise<TimeAnalytics> {
  try {
    const progress = await getStudentProgress(studentID, classID);

    if (progress.length === 0) {
      return {
        totalTimeSpent: 0,
        averageTimePerActivity: 0,
        averageTimePerCompleted: 0,
        dailyActivity: [],
        weeklySummary: [],
      };
    }

    const totalTimeSpent = progress.reduce((sum, p) => sum + p.timeSpent, 0);
    const averageTimePerActivity = totalTimeSpent / progress.length;

    const completedProgress = progress.filter((p) => p.status === 'completed');
    const completedTimeSpent = completedProgress.reduce((sum, p) => sum + p.timeSpent, 0);
    const averageTimePerCompleted =
      completedProgress.length > 0 ? completedTimeSpent / completedProgress.length : 0;

    // Group by day
    const dailyMap = new Map<string, DailyActivity>();

    progress.forEach((p) => {
      if (!p.lastAttemptAt) return;

      const date = p.lastAttemptAt.toDate();
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD

      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, {
          date: dateKey,
          dateTimestamp: p.lastAttemptAt,
          activityCount: 0,
          completedCount: 0,
          totalTimeSpent: 0,
          averageScore: 0,
          starsEarned: 0,
        });
      }

      const day = dailyMap.get(dateKey)!;
      day.activityCount += 1;
      if (p.status === 'completed') {
        day.completedCount += 1;
      }
      day.totalTimeSpent += p.timeSpent;
      day.starsEarned += p.starsEarned || 0;
    });

    // Calculate averages for each day
    const dailyActivity: DailyActivity[] = Array.from(dailyMap.values())
      .map((day) => {
        // Find all progress items for this day to calculate average score
        const dayProgress = progress.filter((p) => {
          if (!p.lastAttemptAt) return false;
          const date = p.lastAttemptAt.toDate();
          const dateKey = date.toISOString().split('T')[0];
          return dateKey === day.date;
        });
        const completedDayProgress = dayProgress.filter((p) => p.status === 'completed');
        const totalScores = completedDayProgress.reduce((sum, p) => sum + p.score, 0);
        day.averageScore =
          completedDayProgress.length > 0 ? totalScores / completedDayProgress.length : 0;

        return day;
      })
      .sort((a, b) => b.date.localeCompare(a.date)); // Most recent first

    // Group by week
    const weeklyMap = new Map<string, WeeklyActivity>();

    dailyActivity.forEach((day) => {
      const date = day.dateTimestamp.toDate();
      const weekStart = getWeekStart(date);
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeklyMap.has(weekKey)) {
        weeklyMap.set(weekKey, {
          weekStart: weekKey,
          weekStartTimestamp: Timestamp.fromDate(weekStart),
          activityCount: 0,
          completedCount: 0,
          totalTimeSpent: 0,
          averageScore: 0,
          starsEarned: 0,
        });
      }

      const week = weeklyMap.get(weekKey)!;
      week.activityCount += day.activityCount;
      week.completedCount += day.completedCount;
      week.totalTimeSpent += day.totalTimeSpent;
      week.starsEarned += day.starsEarned;
    });

    // Calculate averages for each week
    const weeklySummary: WeeklyActivity[] = Array.from(weeklyMap.values())
      .map((week) => {
        // Find all progress items for this week to calculate average score
        const weekProgress = progress.filter((p) => {
          if (!p.lastAttemptAt) return false;
          const date = p.lastAttemptAt.toDate();
          const weekStart = getWeekStart(date);
          const weekKey = weekStart.toISOString().split('T')[0];
          return weekKey === week.weekStart;
        });
        const completedWeekProgress = weekProgress.filter((p) => p.status === 'completed');
        const totalScores = completedWeekProgress.reduce((sum, p) => sum + p.score, 0);
        week.averageScore =
          completedWeekProgress.length > 0 ? totalScores / completedWeekProgress.length : 0;

        return week;
      })
      .sort((a, b) => b.weekStart.localeCompare(a.weekStart)); // Most recent first

    // Find most active day
    const dayOfWeekCounts = new Map<number, number>(); // 0 = Sunday, 1 = Monday, etc.
    const hourCounts = new Map<number, number>(); // 0-23

    progress.forEach((p) => {
      if (!p.lastAttemptAt) return;
      const date = p.lastAttemptAt.toDate();
      const dayOfWeek = date.getDay();
      const hour = date.getHours();

      dayOfWeekCounts.set(dayOfWeek, (dayOfWeekCounts.get(dayOfWeek) || 0) + 1);
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let mostActiveDay: string | undefined;
    let maxDayCount = 0;
    dayOfWeekCounts.forEach((count, dayOfWeek) => {
      if (count > maxDayCount) {
        maxDayCount = count;
        mostActiveDay = dayNames[dayOfWeek];
      }
    });

    // Find most active time (convert hour to time range)
    let mostActiveTime: string | undefined;
    let maxHourCount = 0;
    hourCounts.forEach((count, hour) => {
      if (count > maxHourCount) {
        maxHourCount = count;
        const startHour = hour.toString().padStart(2, '0');
        const endHour = ((hour + 1) % 24).toString().padStart(2, '0');
        mostActiveTime = `${startHour}:00 - ${endHour}:00`;
      }
    });

    return {
      totalTimeSpent,
      averageTimePerActivity: Math.round(averageTimePerActivity),
      averageTimePerCompleted: Math.round(averageTimePerCompleted),
      dailyActivity,
      weeklySummary,
      mostActiveDay,
      mostActiveTime,
    };
  } catch (error) {
    console.error('Error calculating time analytics:', error);
    throw new Error('Failed to calculate time analytics. Please try again.');
  }
}

/**
 * Get performance trends for a student
 */
export async function getPerformanceTrends(
  studentID: string,
  classID: string
): Promise<PerformanceAnalysis> {
  try {
    const progress = await getStudentProgress(studentID, classID);

    if (progress.length === 0) {
      return {
        trends: [],
        strengths: [],
        areasForImprovement: [],
        scoreImprovement: 0,
        topicsMastered: [],
        topicsInProgress: [],
      };
    }

    // Filter completed progress for trends
    const completedProgress = progress.filter((p) => p.status === 'completed' && p.completedAt);

    // Group by date
    const dateMap = new Map<string, PerformanceTrend>();

    completedProgress.forEach((p) => {
      if (!p.completedAt) return;
      const date = p.completedAt.toDate();
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD

      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, {
          date: dateKey,
          dateTimestamp: p.completedAt,
          averageScore: 0,
          completedCount: 0,
        });
      }

      const trend = dateMap.get(dateKey)!;
      trend.completedCount += 1;
    });

    // Calculate average scores per date
    dateMap.forEach((trend, dateKey) => {
      const dateProgress = completedProgress.filter((p) => {
        if (!p.completedAt) return false;
        const date = p.completedAt.toDate();
        const key = date.toISOString().split('T')[0];
        return key === dateKey;
      });
      const totalScores = dateProgress.reduce((sum, p) => sum + p.score, 0);
      trend.averageScore = dateProgress.length > 0 ? totalScores / dateProgress.length : 0;
    });

    const trends = Array.from(dateMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    ); // Chronological order

    // Calculate score improvement (compare first half vs second half)
    let scoreImprovement = 0;
    if (trends.length >= 2) {
      const midPoint = Math.floor(trends.length / 2);
      const firstHalf = trends.slice(0, midPoint);
      const secondHalf = trends.slice(midPoint);

      const firstHalfAvg =
        firstHalf.reduce((sum, t) => sum + t.averageScore, 0) / firstHalf.length;
      const secondHalfAvg =
        secondHalf.reduce((sum, t) => sum + t.averageScore, 0) / secondHalf.length;

      if (firstHalfAvg > 0) {
        scoreImprovement = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
      }
    }

    // Get topic breakdown for strengths/weaknesses
    const modules = await getLessonModulesByClass(classID);
    const topicMap = new Map<string, { scores: number[]; completed: number; total: number }>();

    // Count modules per topic
    modules.forEach((module) => {
      if (!topicMap.has(module.topicCategory)) {
        topicMap.set(module.topicCategory, { scores: [], completed: 0, total: 0 });
      }
      topicMap.get(module.topicCategory)!.total += 1;
    });

    // Aggregate scores by topic from progress
    progress.forEach((p) => {
      // Find the module to get topic category
      const module = modules.find((m) => m.id === p.moduleID);
      if (module && p.status === 'completed') {
        const topic = topicMap.get(module.topicCategory);
        if (topic) {
          topic.scores.push(p.score);
          topic.completed += 1;
        }
      }
    });

    // Identify strengths (high average score >= 80) and areas for improvement (low average score < 70)
    const strengths: string[] = [];
    const areasForImprovement: string[] = [];
    const topicsMastered: string[] = [];
    const topicsInProgress: string[] = [];

    topicMap.forEach((data, topic) => {
      const avgScore =
        data.scores.length > 0
          ? data.scores.reduce((sum, s) => sum + s, 0) / data.scores.length
          : 0;
      const completionRate = data.total > 0 ? (data.completed / data.total) * 100 : 0;

      if (completionRate === 100) {
        topicsMastered.push(topic);
      } else if (data.completed > 0) {
        topicsInProgress.push(topic);
      }

      if (data.scores.length >= 2 && avgScore >= 80) {
        strengths.push(topic);
      } else if (data.scores.length >= 2 && avgScore < 70) {
        areasForImprovement.push(topic);
      }
    });

    return {
      trends,
      strengths,
      areasForImprovement,
      scoreImprovement: Math.round(scoreImprovement * 10) / 10,
      topicsMastered,
      topicsInProgress,
    };
  } catch (error) {
    console.error('Error calculating performance trends:', error);
    throw new Error('Failed to calculate performance trends. Please try again.');
  }
}

/**
 * Helper function to get the start of the week (Sunday)
 */
function getWeekStart(date: Date): Date {
  const day = date.getDay();
  const diff = date.getDate() - day; // Subtract days to get to Sunday
  const weekStart = new Date(date);
  weekStart.setDate(diff);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

