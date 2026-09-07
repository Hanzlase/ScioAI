// ScioAI Open Graph image — served as /opengraph-image by Next.js
// Rendered as 1200×630 PNG for social sharing
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ScioAI – Autonomous Research Platform powered by multi-agent AI";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#ffffff",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px 96px",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background subtle grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle at 80% 20%, rgba(163,163,163,0.12) 0%, transparent 50%), radial-gradient(circle at 10% 80%, rgba(26,26,26,0.06) 0%, transparent 50%)",
          }}
        />

        {/* Logo mark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 48,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "#1a1a1a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              width="28"
              height="28"
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
          <span
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "#1a1a1a",
              letterSpacing: "-0.5px",
            }}
          >
            ScioAI
          </span>
        </div>

        {/* Headline */}
        <h1
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: "#1a1a1a",
            lineHeight: 1.1,
            margin: 0,
            letterSpacing: "-1.5px",
            maxWidth: 800,
          }}
        >
          Deep research,{" "}
          <span style={{ color: "#737373" }}>fully autonomous.</span>
        </h1>

        {/* Description */}
        <p
          style={{
            fontSize: 22,
            color: "#737373",
            marginTop: 24,
            marginBottom: 0,
            lineHeight: 1.5,
            maxWidth: 700,
          }}
        >
          A coordinated team of AI agents — Researcher, Writer, Critic — delivers
          citation-grounded reports in seconds.
        </p>

        {/* Pills at bottom */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 56,
          }}
        >
          {["Researcher Agent", "Writer Agent", "Critic Agent"].map((tag) => (
            <div
              key={tag}
              style={{
                padding: "8px 18px",
                borderRadius: 9999,
                border: "1px solid #e5e5e5",
                background: "#fafafa",
                fontSize: 16,
                fontWeight: 500,
                color: "#595959",
              }}
            >
              {tag}
            </div>
          ))}
        </div>

        {/* Bottom domain watermark */}
        <div
          style={{
            position: "absolute",
            bottom: 48,
            right: 96,
            fontSize: 16,
            color: "#a3a3a3",
            fontWeight: 500,
          }}
        >
          scioai.up.railway.app
        </div>
      </div>
    ),
    { ...size }
  );
}
