export function TypingIndicator() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="bg-primary/15 flex size-7 shrink-0 items-center justify-center rounded-full">
        <span className="text-primary text-[10px] font-bold">AI</span>
      </div>
      <div className="bg-bg-surface flex items-center gap-1 rounded-2xl rounded-tl-sm px-4 py-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="bg-text-disabled size-1.5 animate-bounce rounded-full"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
