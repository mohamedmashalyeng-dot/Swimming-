import { ImageResponse } from "next/og";

export const alt = "Captain Amir Salami — Professional Swimming Coach";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center",
          padding: "80px", color: "white",
          background: "linear-gradient(150deg, #061B35 0%, #0B2A4F 55%, #0877B9 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <svg width="120" height="120" viewBox="0 0 48 48">
            <rect width="48" height="48" rx="14" fill="#031024" />
            <path d="M11 30 L22 11 Q24 8 26 11 L37 30" fill="none" stroke="#20C6C8" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="31.5" cy="14.5" r="3.2" fill="#20C6C8" />
            <path d="M8 34.5c3.3 0 3.3-2.5 6.6-2.5s3.3 2.5 6.6 2.5 3.3-2.5 6.6-2.5 3.3 2.5 6.6 2.5 3.3-2.5 6.6-2.5" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 72, fontWeight: 800 }}>Captain Amir Salami</div>
            <div style={{ fontSize: 34, color: "#7FE3E4" }}>Professional Swimming Coach</div>
          </div>
        </div>
        <div style={{ marginTop: 48, fontSize: 32, color: "rgba(255,255,255,.8)" }}>
          Lessons for kids, teens &amp; adults · Private coaching · Training videos
        </div>
      </div>
    ),
    size,
  );
}
