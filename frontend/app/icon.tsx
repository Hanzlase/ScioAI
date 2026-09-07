// Branded ScioAI favicon — served as /icon.svg by Next.js
// Uses Next.js route segment config for proper content-type
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "#1a1a1a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Sparkles icon reimplemented as SVG paths */}
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3L13.5 7.5H18L14.25 10.5L15.75 15L12 12L8.25 15L9.75 10.5L6 7.5H10.5L12 3Z" />
          <path d="M5 3L5.5 4.5H7L5.75 5.5L6.25 7L5 6.25L3.75 7L4.25 5.5L3 4.5H4.5L5 3Z" />
          <path d="M19 14L19.5 15.5H21L19.75 16.5L20.25 18L19 17.25L17.75 18L18.25 16.5L17 15.5H18.5L19 14Z" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
