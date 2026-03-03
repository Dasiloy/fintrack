/**
 * Smoke tests for Auth Service.
 */
describe('Auth Service — smoke', () => {
  it('test runner is operational', () => {
    expect(1 + 1).toBe(2);
  });

  it('default auth service port is a valid port number', () => {
    const port = Number(process.env.AUTH_SERVICE_PORT ?? 4002);
    expect(port).toBeGreaterThan(0);
    expect(port).toBeLessThan(65536);
  });

  it('NODE_ENV is defined', () => {
    expect(process.env.NODE_ENV).toBeDefined();
  });
});
