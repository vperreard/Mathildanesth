/**
 * Test d'infrastructure Jest pour diagnostiquer les problèmes
 */

import React from 'react';
import { render } from '@testing-library/react';

// Test basique de React rendering
describe('Infrastructure Jest - Tests Basiques', () => {
  it('should render a basic React component', () => {
    const TestComponent = () => <div data-testid="test">Hello Jest</div>;
    const { getByTestId } = render(<TestComponent />);
    expect(getByTestId('test')).toHaveTextContent('Hello Jest');
  });

  it('should have access to DOM APIs', () => {
    expect(document).toBeDefined();
    expect(window).toBeDefined();
    expect(performance).toBeDefined();
  });

  it('should mock console functions', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    console.log('test');
    expect(spy).toHaveBeenCalledWith('test');
    spy.mockRestore();
  });

  it('should handle fetch mocks', async () => {
    expect(global.fetch).toBeDefined();
    expect(typeof global.fetch).toBe('function');
  });

  it('should have Prisma mocked', async () => {
    const { prisma } = await import('@/lib/prisma');
    expect(prisma).toBeDefined();
    expect(typeof prisma.user.findMany).toBe('function');
  });
});

// Test des mocks Next.js
describe('Next.js Mocks', () => {
  it('should mock next/router', async () => {
    const { useRouter } = await import('next/navigation');
    expect(useRouter).toBeDefined();
  });

  it('should mock next/image', async () => {
    const NextImage = (await import('next/image')).default;
    const { render } = await import('@testing-library/react');
    const { container } = render(<NextImage src="/test.jpg" alt="test" width={100} height={100} />);
    expect(container.querySelector('img')).toBeTruthy();
  });
});

// Test des timers
describe('Timer Tests', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should handle setTimeout correctly', () => {
    const callback = jest.fn();
    setTimeout(callback, 100);
    
    expect(callback).not.toHaveBeenCalled();
    
    jest.advanceTimersByTime(100);
    
    expect(callback).toHaveBeenCalled();
  });
});