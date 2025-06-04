// Mock pour @vercel/analytics/react
const React = require('react');

const Analytics = ({ children, ...props }) => {
  return React.createElement('div', { 'data-testid': 'analytics-mock', ...props }, children);
};

const track = jest.fn();

module.exports = {
  __esModule: true,
  Analytics,
  track,
  default: Analytics,
};