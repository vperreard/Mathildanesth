import { NextRouter } from 'next/router';

// Mock du router Next.js pour les tests
export function createMockRouter(props: Partial<NextRouter>): NextRouter {
    return {
        basePath: '',
        pathname: '/',
        route: '/',
        query: {},
        asPath: '/',
        back: jest.fn(),
        beforePopState: jest.fn(),
        prefetch: jest.fn(() => Promise.resolve()),
        push: jest.fn(() => Promise.resolve(true)),
        reload: jest.fn(),
        replace: jest.fn(() => Promise.resolve(true)),
        events: {
            on: jest.fn(),
            off: jest.fn(),
            emit: jest.fn(),
        },
        isFallback: false,
        isLocaleDomain: false,
        isReady: true,
        isPreview: false,
        ...props,
    };
}

// Mock pour next/navigation
export const mockUsePathname = (pathname = '/') => {
    const usePathname = jest.requireMock('next/navigation').usePathname;
    usePathname.mockImplementation(() => pathname);
    return usePathname;
};

export const mockUseRouter = () => {
    const useRouter = jest.requireMock('next/navigation').useRouter;
    useRouter.mockImplementation(() => ({
        push: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn(),
        back: jest.fn(),
    }));
    return useRouter;
}; 