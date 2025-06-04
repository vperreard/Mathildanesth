// Mock for next-auth/next - CENTRALISÉ ET STABILISÉ
const mockUser = {
  id: '1',
  email: 'test@example.com',
  role: 'USER',
  name: 'Test User'
};

const mockSession = {
  user: mockUser,
  expires: '9999-12-31T23:59:59.999Z'
};

module.exports = {
  getServerSession: jest.fn().mockResolvedValue(mockSession),
  getSession: jest.fn().mockResolvedValue(mockSession),
  signIn: jest.fn().mockResolvedValue({ url: '/dashboard' }),
  signOut: jest.fn().mockResolvedValue({ url: '/auth/signin' }),
  useSession: jest.fn(() => ({
    data: mockSession,
    status: 'authenticated',
    update: jest.fn()
  })),
  
  // Providers et configuration
  providers: {
    Credentials: jest.fn(),
  },
  
  // Session callbacks
  callbacks: {
    session: jest.fn(({ session }) => session),
    jwt: jest.fn(({ token }) => token),
  },
  
  // Pages config
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  
  // NextAuth default export
  default: jest.fn(),
  
  // Utilities
  getToken: jest.fn().mockResolvedValue({ 
    sub: '1', 
    email: 'test@example.com',
    role: 'USER'
  }),
  encode: jest.fn().mockResolvedValue('mock-jwt-token'),
  decode: jest.fn().mockResolvedValue({ 
    sub: '1', 
    email: 'test@example.com' 
  }),
};