/**
 * Formats a date/time value for display in local timezone
 * @param dateValue - Can be a Date object, ISO string, or other date-like value
 * @returns Formatted date string in local timezone (e.g., "2026-01-30 14:30:45")
 */
export function formatDateTime(dateValue: Date | string | null | undefined): string {
  if (!dateValue) return "—";
  
  try {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "—";
    }
    
    // Format: YYYY-MM-DD HH:MM:SS in local timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return "—";
  }
}

/**
 * Formats a date/time value for display in a shorter format (HH:MM:SS)
 * @param dateValue - Can be a Date object, ISO string, or other date-like value
 * @returns Formatted time string (e.g., "14:30:45")
 */
export function formatTime(dateValue: Date | string | null | undefined): string {
  if (!dateValue) return "—";
  
  try {
    const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "—";
    }
    
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${hours}:${minutes}:${seconds}`;
  } catch (error) {
    console.error('Error formatting time:', error);
    return "—";
  }
}

