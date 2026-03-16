export function Progress({ value, max }: { value: number; max: number }) {
  return (
    <div className="bg-bg-surface-hover relative h-2 w-full overflow-hidden rounded-full">
      <div
        className="bg-primary duration-smooth h-full w-full rounded-full transition-all"
        style={{ width: `${(value / max) * 100}%` }}
      />
    </div>
  );
}
