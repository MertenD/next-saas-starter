import type { MetadataRoute } from "next"
import { APP_DESCRIPTION, APP_NAME } from "@/config/constants"

/**
 * Web app manifest, served at `/manifest.webmanifest` by Next.js. Together
 * with the service worker (`public/sw.js`, registered by
 * `src/components/pwa-register.tsx`) this makes the app installable.
 * Icons are generated on the fly by `src/app/api/pwa-icon/route.tsx` - swap
 * that route for static PNGs in `public/` once you have real brand assets.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: APP_DESCRIPTION,
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ff385c",
    orientation: "portrait",
    icons: [
      { src: "/api/pwa-icon?size=192", sizes: "192x192", type: "image/png" },
      {
        src: "/api/pwa-icon?size=512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
