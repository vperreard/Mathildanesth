module.exports = {
  ToastContainer: ({ children, ...props }) => children,
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
    dark: jest.fn(),
    warn: jest.fn(),
  },
};