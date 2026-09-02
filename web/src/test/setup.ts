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

// cmdk (usado por CommandPalette e, desde 2026-09-01, MultiSelect) chama
// scrollIntoView ao destacar um item — jsdom não implementa. Sem isso,
// qualquer teste que selecione/navegue um item de <Command> quebra com
// "e.scrollIntoView is not a function", mesmo sem bug nenhum no componente.
if (typeof Element.prototype.scrollIntoView !== 'function') {
  Element.prototype.scrollIntoView = () => {};
}
