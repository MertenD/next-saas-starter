import { ImageResponse } from "next/og"
import { APP_DESCRIPTION, APP_NAME } from "@/config/constants"

export const alt = APP_NAME
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

/** Social preview image (Open Graph / Twitter) in the DESIGN.md palette: canvas, ink and Rausch. */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 96,
        background: "#ffffff",
        color: "#222222",
      }}
    >
      <div
        style={{
          width: 96,
          height: 96,
          borderRadius: 48,
          background: "#ff385c",
          marginBottom: 48,
        }}
      />
      <div style={{ fontSize: 88, fontWeight: 700 }}>{APP_NAME}</div>
      <div style={{ fontSize: 36, color: "#6a6a6a", marginTop: 24 }}>
        {APP_DESCRIPTION}
      </div>
    </div>,
    size,
  )
}
