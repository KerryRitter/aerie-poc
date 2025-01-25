import { vi, beforeEach } from 'vitest';
import 'reflect-metadata';

// Mock fetch
global.fetch = vi.fn();

// Mock Request/Response
if (!global.Request) {
  (global as any).Request = class Request {
    constructor(public url: string) {}
  };
}

if (!global.Response) {
  (global as any).Response = class Response {
    constructor() {}
  };
}

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});
