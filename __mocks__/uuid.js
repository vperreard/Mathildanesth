// Mock for uuid library
export const v4 = jest.fn(() => 'mock-uuid-v4');
export const v1 = jest.fn(() => 'mock-uuid-v1');

export default {
  v4,
  v1,
};