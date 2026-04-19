import { Timestamp } from 'firebase/firestore';

/**
 * Format a timestamp to a readable date string
 */
export function formatDate(timestamp: Timestamp | null | undefined): string {
  if (!timestamp) return 'N/A';
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'N/A';
  }
}

/**
 * Format a timestamp to a readable date and time string
 */
export function formatDateTime(timestamp: Timestamp | null | undefined): string {
  if (!timestamp) return 'N/A';
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return 'N/A';
  }
}

/**
 * Format time in seconds to a readable string (e.g., "5m 30s" or "1h 15m")
 */
export function formatTimeSpent(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

/**
 * Format activity type to a readable label
 */
export function formatActivityType(type: string): string {
  switch (type) {
    case 'quiz':
      return 'Quiz';
    case 'drag_drop':
      return 'Drag & Drop';
    case 'ordering':
      return 'Ordering';
    default:
      return type;
  }
}

/**
 * Get icon name for activity type
 */
export function getActivityTypeIcon(type: string): string {
  switch (type) {
    case 'quiz':
      return 'help-circle';
    case 'drag_drop':
      return 'move';
    case 'ordering':
      return 'list';
    default:
      return 'puzzle';
  }
}

/**
 * Get color for score range
 */
export function getScoreColor(score: number): string {
  if (score >= 90) return '#10b981'; // green-500
  if (score >= 80) return '#3b82f6'; // blue-500
  if (score >= 70) return '#f59e0b'; // amber-500
  if (score >= 60) return '#ef4444'; // red-500
  return '#6b7280'; // gray-500
}

/**
 * Format topic category to readable label
 */
export function formatTopicCategory(topic: string): string {
  // Convert "lesson_01" to "Lesson 1" or keep as is if already formatted
  if (topic.startsWith('lesson_')) {
    const number = topic.replace('lesson_', '');
    return `Lesson ${number}`;
  }
  return topic;
}

/**
 * Get relative time string (e.g., "2 hours ago", "3 days ago")
 */
export function getRelativeTime(timestamp: Timestamp | null | undefined): string {
  if (!timestamp) return 'N/A';
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    return formatDate(timestamp);
  } catch {
    return 'N/A';
  }
}

