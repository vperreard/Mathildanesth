// Mock complet pour date-fns
const mockDate = new Date('2024-08-19T10:00:00.000Z');

const mockFunctions = {
  // Fonctions de formatage
  format: jest.fn((date, formatStr) => {
    if (!date) return '';
    const d = new Date(date);
    if (formatStr === 'yyyy-MM-dd') return d.toISOString().split('T')[0];
    if (formatStr === 'dd/MM/yyyy') return d.toLocaleDateString('fr-FR');
    if (formatStr === 'HH:mm') return d.toTimeString().substring(0, 5);
    return d.toISOString();
  }),
  
  formatISO: jest.fn((date) => new Date(date).toISOString()),
  formatDistance: jest.fn(() => '2 heures'),
  formatRelative: jest.fn(() => 'aujourd\'hui à 10:00'),
  
  // Fonctions de parsing
  parse: jest.fn((dateString) => new Date(dateString)),
  parseISO: jest.fn((dateString) => new Date(dateString)),
  
  // Fonctions de date
  addDays: jest.fn((date, amount) => {
    const result = new Date(date);
    result.setDate(result.getDate() + amount);
    return result;
  }),
  
  addMonths: jest.fn((date, amount) => {
    const result = new Date(date);
    result.setMonth(result.getMonth() + amount);
    return result;
  }),
  
  addYears: jest.fn((date, amount) => {
    const result = new Date(date);
    result.setFullYear(result.getFullYear() + amount);
    return result;
  }),
  
  subDays: jest.fn((date, amount) => {
    const result = new Date(date);
    result.setDate(result.getDate() - amount);
    return result;
  }),
  
  // Fonctions de comparaison
  isAfter: jest.fn((date1, date2) => new Date(date1) > new Date(date2)),
  isBefore: jest.fn((date1, date2) => new Date(date1) < new Date(date2)),
  isEqual: jest.fn((date1, date2) => new Date(date1).getTime() === new Date(date2).getTime()),
  isSameDay: jest.fn((date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.toDateString() === d2.toDateString();
  }),
  
  // Fonctions de validation
  isValid: jest.fn((date) => !isNaN(new Date(date).getTime())),
  isWeekend: jest.fn((date) => {
    const day = new Date(date).getDay();
    return day === 0 || day === 6;
  }),
  
  // Fonctions d'extraction
  getYear: jest.fn((date) => new Date(date).getFullYear()),
  getMonth: jest.fn((date) => new Date(date).getMonth()),
  getDate: jest.fn((date) => new Date(date).getDate()),
  getDay: jest.fn((date) => new Date(date).getDay()),
  getHours: jest.fn((date) => new Date(date).getHours()),
  getMinutes: jest.fn((date) => new Date(date).getMinutes()),
  
  // Fonctions de début/fin
  startOfDay: jest.fn((date) => {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }),
  
  endOfDay: jest.fn((date) => {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  }),
  
  startOfWeek: jest.fn((date) => {
    const result = new Date(date);
    const day = result.getDay();
    const diff = result.getDate() - day + (day === 0 ? -6 : 1);
    result.setDate(diff);
    result.setHours(0, 0, 0, 0);
    return result;
  }),
  
  endOfWeek: jest.fn((date) => {
    const result = new Date(date);
    const day = result.getDay();
    const diff = result.getDate() - day + (day === 0 ? 0 : 7);
    result.setDate(diff);
    result.setHours(23, 59, 59, 999);
    return result;
  }),
  
  startOfMonth: jest.fn((date) => {
    const result = new Date(date);
    result.setDate(1);
    result.setHours(0, 0, 0, 0);
    return result;
  }),
  
  endOfMonth: jest.fn((date) => {
    const result = new Date(date);
    result.setMonth(result.getMonth() + 1, 0);
    result.setHours(23, 59, 59, 999);
    return result;
  }),
  
  // Fonctions de différence
  differenceInDays: jest.fn((date1, date2) => {
    const diffTime = new Date(date1).getTime() - new Date(date2).getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }),
  
  differenceInHours: jest.fn((date1, date2) => {
    const diffTime = new Date(date1).getTime() - new Date(date2).getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60));
  }),
  
  differenceInMinutes: jest.fn((date1, date2) => {
    const diffTime = new Date(date1).getTime() - new Date(date2).getTime();
    return Math.ceil(diffTime / (1000 * 60));
  }),
  
  // Fonctions de plage
  eachDayOfInterval: jest.fn(({ start, end }) => {
    const days = [];
    const current = new Date(start);
    const endDate = new Date(end);
    
    while (current <= endDate) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  }),

  // Fonctions d'intervalle
  isWithinInterval: jest.fn((date, interval) => {
    const checkDate = new Date(date);
    const start = new Date(interval.start);
    const end = new Date(interval.end);
    return checkDate >= start && checkDate <= end;
  }),

  areIntervalsOverlapping: jest.fn((interval1, interval2) => {
    const start1 = new Date(interval1.start);
    const end1 = new Date(interval1.end);
    const start2 = new Date(interval2.start);
    const end2 = new Date(interval2.end);
    return start1 <= end2 && start2 <= end1;
  }),
  
  // Utilitaires
  max: jest.fn((...dates) => new Date(Math.max(...dates.map(d => new Date(d).getTime())))),
  min: jest.fn((...dates) => new Date(Math.min(...dates.map(d => new Date(d).getTime())))),
  
  // Constantes
  __esModule: true,
  default: {}
};

// Export as both CommonJS and ES6 module
module.exports = mockFunctions;
module.exports.isWeekend = mockFunctions.isWeekend;
module.exports.format = mockFunctions.format;
module.exports.addDays = mockFunctions.addDays;
module.exports.isSameDay = mockFunctions.isSameDay;
module.exports.isWithinInterval = mockFunctions.isWithinInterval;
module.exports.areIntervalsOverlapping = mockFunctions.areIntervalsOverlapping;
module.exports.differenceInDays = mockFunctions.differenceInDays;

// Create individual exports for ES6 destructured imports
Object.keys(mockFunctions).forEach(key => {
  if (key !== '__esModule' && key !== 'default') {
    module.exports[key] = mockFunctions[key];
  }
});