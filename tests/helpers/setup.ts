import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './msw-server';

// Start MSW for all unit/integration tests so no real network is ever hit.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
