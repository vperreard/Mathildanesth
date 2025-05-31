// Mock centralisé pour @tanstack/react-query
module.exports = {
  useQuery: jest.fn(() => ({
    data: null,
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
    isSuccess: true,
    status: 'success',
    fetchStatus: 'idle',
  })),
  
  useMutation: jest.fn(() => ({
    mutate: jest.fn(),
    mutateAsync: jest.fn().mockResolvedValue({}),
    isLoading: false,
    isError: false,
    error: null,
    isSuccess: false,
    data: null,
    reset: jest.fn(),
  })),
  
  useInfiniteQuery: jest.fn(() => ({
    data: { pages: [], pageParams: [] },
    isLoading: false,
    isError: false,
    error: null,
    fetchNextPage: jest.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
  })),
  
  QueryClient: jest.fn(() => ({
    clear: jest.fn(),
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
    invalidateQueries: jest.fn(),
    removeQueries: jest.fn(),
    cancelQueries: jest.fn(),
    refetchQueries: jest.fn(),
  })),
  
  QueryClientProvider: ({ children }) => children,
  
  useQueryClient: jest.fn(() => ({
    clear: jest.fn(),
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
    invalidateQueries: jest.fn(),
    removeQueries: jest.fn(),
    cancelQueries: jest.fn(),
    refetchQueries: jest.fn(),
  })),
  
  // Hydration utilities
  dehydrate: jest.fn(() => ({})),
  hydrate: jest.fn(),
  Hydrate: ({ children }) => children,
  
  // Query keys and utilities
  queryOptions: jest.fn((options) => options),
  keepPreviousData: Symbol('keepPreviousData'),
};