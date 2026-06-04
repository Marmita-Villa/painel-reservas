interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  variant?: "full" | "icon";
  className?: string;
}

const sizes = {
  xs: { icon: 24, text: 13, gap: 7, radius: 6 },
  sm: { icon: 30, text: 16, gap: 8, radius: 7 },
  md: { icon: 36, text: 19, gap: 10, radius: 9 },
  lg: { icon: 48, text: 26, gap: 12, radius: 12 },
  xl: { icon: 64, text: 34, gap: 14, radius: 16 },
};

export default function Logo({ size = "md", variant = "full", className }: LogoProps) {
  const s = sizes[size];

  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: s.gap,
        fontFamily: "system-ui, -apple-system, sans-serif",
        userSelect: "none",
      }}
    >
      {/* Icon — circular arrow + R */}
      <div
        style={{
          width: s.icon,
          height: s.icon,
          borderRadius: s.radius,
          background: "linear-gradient(135deg, #f07316, #d95f0a)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow: "0 2px 8px rgba(240,115,22,0.35)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Circular arc (decorative) */}
        <svg
          width={s.icon}
          height={s.icon}
          viewBox="0 0 40 40"
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          <circle
            cx="20" cy="20" r="14"
            fill="none"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="2.5"
            strokeDasharray="60 28"
            strokeLinecap="round"
          />
          {/* Arrow tip */}
          <polygon
            points="33,13 37,17 30,17"
            fill="rgba(255,255,255,0.35)"
          />
        </svg>
        {/* Letter */}
        <span
          style={{
            color: "#fff",
            fontWeight: 800,
            fontSize: s.icon * 0.46,
            letterSpacing: "-0.02em",
            lineHeight: 1,
            position: "relative",
            zIndex: 1,
          }}
        >
          R
        </span>
      </div>

      {/* Text — only in "full" variant */}
      {variant === "full" && (
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
          <span
            style={{
              fontSize: s.text,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1,
            }}
          >
            <span style={{ color: "#18181b" }}>Reserva</span>
            <span style={{ color: "#f07316" }}>360</span>
          </span>
          {size !== "xs" && size !== "sm" && (
            <span
              style={{
                fontSize: s.text * 0.52,
                color: "#a1a1aa",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                marginTop: 2,
                fontWeight: 500,
              }}
            >
              Sua Reserva. Nossa Solução.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
