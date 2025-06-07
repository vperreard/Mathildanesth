// Mock for bcrypt module
module.exports = {
  compare: jest.fn((plainPassword, hashedPassword) => {
    // Simple mock implementation
    return Promise.resolve(plainPassword === 'password123' && hashedPassword.startsWith('$2b$10$'));
  }),
  hash: jest.fn((password, rounds) => {
    return Promise.resolve('$2b$10$hashedpassword');
  }),
  compareSync: jest.fn((plainPassword, hashedPassword) => {
    return plainPassword === 'password123' && hashedPassword.startsWith('$2b$10$');
  }),
  hashSync: jest.fn((password, rounds) => {
    return '$2b$10$hashedpassword';
  }),
  genSalt: jest.fn(() => Promise.resolve('$2b$10$salt')),
  genSaltSync: jest.fn(() => '$2b$10$salt'),
  getRounds: jest.fn(() => 10),
};