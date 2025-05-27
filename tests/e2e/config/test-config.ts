export const testConfig = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3000',
  websocketUrl: process.env.TEST_WS_URL || 'ws://localhost:3001',
  apiUrl: process.env.TEST_API_URL || 'http://localhost:3000/api',
  
  // Test timeouts
  timeouts: {
    default: 30000,
    long: 60000,
    navigation: 30000,
    element: 10000
  },
  
  // Test user credentials
  defaultUsers: {
    admin: {
      email: 'admin@test.com',
      password: 'Admin123!'
    },
    practitioner: {
      email: 'practitioner@test.com',
      password: 'Test123!'
    }
  },
  
  // Performance thresholds
  performance: {
    FCP: 1500,
    LCP: 2500,
    TTI: 3500,
    TBT: 300,
    CLS: 0.1
  },
  
  // Browser options
  browser: {
    headless: process.env.HEADLESS !== 'false',
    slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0,
    devtools: process.env.DEVTOOLS === 'true',
    defaultViewport: {
      width: 1280,
      height: 720
    }
  },
  
  // Database
  database: {
    url: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/mathildanesth_test'
  }
};