export function BrandStripe() {
  return (
    <div aria-hidden className="flex h-1.5 w-full">
      <div className="flex-1" style={{ background: "var(--orange)" }} />
      <div className="flex-1" style={{ background: "var(--cyan)" }} />
      <div className="flex-1" style={{ background: "var(--pink)" }} />
      <div className="flex-1" style={{ background: "var(--green)" }} />
    </div>
  );
}
