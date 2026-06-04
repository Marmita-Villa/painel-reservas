import { ImageResponse } from "next/og";

export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 192,
          height: 192,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
        }}
      >
        {/* Circular gradient ring */}
        <div style={{
          width: 180,
          height: 180,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #f07316, #8b2500)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}>
          {/* Inner white circle */}
          <div style={{
            width: 130,
            height: 130,
            borderRadius: "50%",
            background: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            {/* Table icon simplified */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
            }}>
              {/* Table top */}
              <div style={{
                width: 80,
                height: 10,
                borderRadius: 5,
                background: "#1a1a2e",
              }} />
              {/* Table leg */}
              <div style={{
                width: 8,
                height: 30,
                borderRadius: 4,
                background: "#1a1a2e",
              }} />
              {/* Chair row */}
              <div style={{
                display: "flex",
                gap: 12,
              }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{
                    width: 20,
                    height: 24,
                    borderRadius: 4,
                    background: "#1a1a2e",
                  }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 192, height: 192 }
  );
}
