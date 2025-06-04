// Mock pour date-fns/locale
module.exports = {
  fr: {
    localize: {
      day: jest.fn((index) => ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][index]),
      month: jest.fn((index) => ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'][index])
    },
    formatLong: {
      date: jest.fn(() => 'dd/MM/yyyy'),
      time: jest.fn(() => 'HH:mm'),
      dateTime: jest.fn(() => 'dd/MM/yyyy HH:mm')
    },
    match: {
      day: jest.fn(() => ({ value: 1 })),
      month: jest.fn(() => ({ value: 0 }))
    },
    options: {
      weekStartsOn: 1,
      firstWeekContainsDate: 4
    }
  },
  enUS: {
    localize: {
      day: jest.fn((index) => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][index]),
      month: jest.fn((index) => ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][index])
    },
    formatLong: {
      date: jest.fn(() => 'MM/dd/yyyy'),
      time: jest.fn(() => 'h:mm a'),
      dateTime: jest.fn(() => 'MM/dd/yyyy h:mm a')
    },
    match: {
      day: jest.fn(() => ({ value: 1 })),
      month: jest.fn(() => ({ value: 0 }))
    },
    options: {
      weekStartsOn: 0,
      firstWeekContainsDate: 1
    }
  },
  __esModule: true
};