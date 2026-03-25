/**
 * Smoke tests for Finance Service.
 */
describe('Finance Service — smoke', () => {
  it('test runner is operational', () => {
    expect(1 + 1).toBe(2);
  });

  it('default finance service port is a valid port number', () => {
    const port = Number(process.env.FINANCE_SERVICE_PORT ?? 4003);
    expect(port).toBeGreaterThan(0);
    expect(port).toBeLessThan(65536);
  });

  it('NODE_ENV is defined', () => {
    expect(process.env.NODE_ENV).toBeDefined();
  });
});
