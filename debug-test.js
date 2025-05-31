// Debug simple pour comprendre pourquoi la fonction retourne null
const { calculateLeaveCountedDays } = require('./src/modules/leaves/services/leaveCalculator.ts');

const mockSchedule = {
    id: 1,
    userId: 1,
    frequency: 'FULLTIME',
    workDaysPerWeek: 5,
    hoursPerWeek: 40,
    isActive: true,
    startDate: '2024-01-01',
    endDate: null,
    patterns: [
        { dayOfWeek: 1, isWorking: true, startTime: '08:00', endTime: '17:00' },
        { dayOfWeek: 2, isWorking: true, startTime: '08:00', endTime: '17:00' },
        { dayOfWeek: 3, isWorking: true, startTime: '08:00', endTime: '17:00' },
        { dayOfWeek: 4, isWorking: true, startTime: '08:00', endTime: '17:00' },
        { dayOfWeek: 5, isWorking: true, startTime: '08:00', endTime: '17:00' },
        { dayOfWeek: 6, isWorking: false, startTime: null, endTime: null },
        { dayOfWeek: 0, isWorking: false, startTime: null, endTime: null }
    ]
};

async function test() {
    try {
        const result = await calculateLeaveCountedDays('2024-01-15', '2024-01-15', mockSchedule);
        console.log('Result:', result);
    } catch (error) {
        console.error('Error:', error);
    }
}

test();