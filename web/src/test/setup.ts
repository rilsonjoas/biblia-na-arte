import '@testing-library/jest-dom/vitest';

// Radix UI (ex. AspectRatio) depende de ResizeObserver, que o jsdom não
// implementa. Mock mínimo o suficiente pros testes de render.
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
}
