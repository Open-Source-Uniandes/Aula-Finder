/**
 * Time formatting utilities for the calendar view
 * Inspired by Mi-Horario-Uniandes formateadorTiempo.ts
 */

/**
 * Convert time number (e.g., 630, 1430) to pixel position
 * Time range: 600 (6:00 AM) to 2100 (9:00 PM)
 * Height: 750px
 * @param {number} tiempo - Time in format HHMM (e.g., 630 for 6:30 AM)
 * @returns {number} Pixel position from top
 */
export function tiempoAPixeles(tiempo) {
  // Map 600-2100 (15 hours = 900 minutes) to 0-750px with 18px offset
  return ((tiempo - 600) / 1500) * 750 + 18;
}

/**
 * Convert time string HH:MM to number format HHMM
 * @param {string} timeStr - Time in format "HH:MM"
 * @returns {number} Time as number (e.g., "06:30" -> 630)
 */
export function timeStringToNumber(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 100 + minutes;
}

/**
 * Convert time number to display text
 * @param {number} tiempo - Time in format HHMM
 * @returns {string} Formatted time string "H:MM" or "HH:MM"
 */
export function tiempoNumeroATexto(tiempo) {
  const horas = Math.floor(tiempo / 100);
  const minutos = tiempo % 100;
  return `${horas}:${minutos < 10 ? '0' + minutos : minutos}`;
}

/**
 * Calculate the height in pixels for a time block
 * @param {string} timeStart - Start time "HH:MM"
 * @param {string} timeEnd - End time "HH:MM"
 * @returns {number} Height in pixels
 */
export function calculateBlockHeight(timeStart, timeEnd) {
  const startNum = timeStringToNumber(timeStart);
  const endNum = timeStringToNumber(timeEnd);
  const startPixels = tiempoAPixeles(startNum);
  const endPixels = tiempoAPixeles(endNum);
  return endPixels - startPixels;
}

/**
 * Get display name for day code
 * @param {string} dayCode - Single letter day code (l, m, i, j, v, s, d)
 * @returns {string} Day name
 */
export function getDayName(dayCode) {
  const dayNames = {
    'l': 'Lunes',
    'm': 'Martes',
    'i': 'Miércoles',
    'j': 'Jueves',
    'v': 'Viernes',
    's': 'Sábado',
    'd': 'Domingo'
  };
  return dayNames[dayCode.toLowerCase()] || dayCode;
}

/**
 * Get all day codes for the calendar (Mon-Sat)
 * @returns {Array<string>} Array of day codes
 */
export function getCalendarDays() {
  return ['l', 'm', 'i', 'j', 'v', 's'];
}

/**
 * Generate hour markers for the calendar
 * @returns {Array<{time: number, label: string}>} Array of hour markers
 */
export function getHourMarkers() {
  const markers = [];
  for (let hour = 6; hour <= 21; hour++) {
    markers.push({
      time: hour * 100,
      label: `${hour}:00`
    });
  }
  return markers;
}
