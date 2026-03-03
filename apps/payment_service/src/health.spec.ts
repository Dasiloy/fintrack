/**
 * Smoke tests for Payment Service.
 */
describe('Payment Service — smoke', () => {
  it('test runner is operational', () => {
    expect(1 + 1).toBe(2);
  });

  it('default payment service port is a valid port number', () => {
    const port = Number(process.env.PAYMENT_SERVICE_PORT ?? 4008);
    expect(port).toBeGreaterThan(0);
    expect(port).toBeLessThan(65536);
  });

  it('NODE_ENV is defined', () => {
    expect(process.env.NODE_ENV).toBeDefined();
  });
});
