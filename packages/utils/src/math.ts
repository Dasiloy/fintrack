export function calculateInterest(principal: number, rate: number, time: number): number {
  return (principal * rate * time) / 100;
}
