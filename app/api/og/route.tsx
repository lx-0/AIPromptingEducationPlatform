import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") ?? "Prompting School";
  const subtitle = searchParams.get("subtitle") ?? "Master AI Prompting";
  const type = searchParams.get("type") ?? "platform";
  const stat = searchParams.get("stat") ?? "";

  const truncated =
    title.length > 60 ? title.slice(0, 57) + "…" : title;

  const bgColor =
    type === "certificate"
      ? "#1e40af"
      : type === "instructor"
        ? "#065f46"
        : "#1d4ed8";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "1200px",
          height: "630px",
          background: bgColor,
          padding: "60px 80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "auto",
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.15)",
              borderRadius: "8px",
              padding: "6px 16px",
              fontSize: "18px",
              color: "rgba(255,255,255,0.9)",
              fontWeight: 700,
              letterSpacing: "0.05em",
            }}
          >
            PROMPTING SCHOOL
          </div>
          {type && type !== "platform" && (
            <div
              style={{
                marginLeft: "12px",
                background: "rgba(255,255,255,0.2)",
                borderRadius: "6px",
                padding: "4px 12px",
                fontSize: "14px",
                color: "rgba(255,255,255,0.8)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              {type}
            </div>
          )}
        </div>

        {/* Main content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              fontSize: truncated.length > 40 ? "48px" : "56px",
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            {truncated}
          </div>

          {subtitle && (
            <div
              style={{
                fontSize: "24px",
                color: "rgba(255,255,255,0.75)",
                lineHeight: 1.4,
                maxWidth: "800px",
              }}
            >
              {subtitle.length > 100 ? subtitle.slice(0, 97) + "…" : subtitle}
            </div>
          )}

          {stat && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginTop: "8px",
              }}
            >
              <div
                style={{
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: "100px",
                  padding: "8px 20px",
                  fontSize: "16px",
                  color: "rgba(255,255,255,0.9)",
                  fontWeight: 600,
                }}
              >
                {stat}
              </div>
            </div>
          )}
        </div>

        {/* Bottom decoration */}
        <div
          style={{
            marginTop: "40px",
            height: "4px",
            background: "rgba(255,255,255,0.3)",
            borderRadius: "2px",
          }}
        />
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
