interface WordmarkProps {
  size?: "default" | "sm";
  dark?: boolean;
}

export function Wordmark({ size = "default", dark = false }: WordmarkProps) {
  const sm = size === "sm";
  const markSize = sm ? 24 : 30;
  const markRadius = sm ? 6 : 8;
  const textSize = sm ? 18 : 20;

  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <span
        aria-hidden
        className="grid overflow-hidden"
        style={{
          width: markSize,
          height: markSize,
          borderRadius: markRadius,
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
        }}
      >
        <span style={{ background: "var(--orange)" }} />
        <span style={{ background: "var(--pink)" }} />
        <span style={{ background: "var(--cyan)" }} />
        <span style={{ background: "var(--green)" }} />
      </span>
      <span
        className="font-[family-name:var(--font-montserrat)] font-extrabold leading-none tracking-tight"
        style={{
          fontSize: textSize,
          color: dark ? "#ffffff" : "var(--ink)",
        }}
      >
        Prop<span style={{ color: "var(--pink)" }}>Vault</span>
      </span>
    </span>
  );
}
