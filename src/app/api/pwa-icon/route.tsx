import { ImageResponse } from "next/og"
import type { NextRequest } from "next/server"
import { APP_NAME } from "@/config/constants"

/**
 * Placeholder PWA icon: the first letter of `APP_NAME` on the brand color
 * (`--primary` in `globals.css`). Referenced from `src/app/manifest.ts`.
 * Replace with static icons in `public/` for a real product.
 */
export function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const requested = Number.parseInt(searchParams.get("size") ?? "192", 10)
  const size = Math.min(
    Math.max(Number.isNaN(requested) ? 192 : requested, 48),
    512,
  )

  return new ImageResponse(
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#ff385c",
        borderRadius: size * 0.18,
      }}
    >
      <span
        style={{
          color: "white",
          fontSize: size * 0.55,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        {APP_NAME.charAt(0).toUpperCase()}
      </span>
    </div>,
    { width: size, height: size },
  )
}
