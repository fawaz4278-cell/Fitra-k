import type { Metadata, Viewport } from "next";
import "./globals.css";

// iPhone screens (CSS width, height, pixel ratio) with a matching startup image in public/splash/.
const SPLASH_DEVICES: [number, number, number][] = [
  [440, 956, 3], [402, 874, 3], [420, 912, 3], [430, 932, 3], [393, 852, 3],
  [428, 926, 3], [390, 844, 3], [375, 812, 3], [414, 896, 3], [414, 896, 2], [375, 667, 2],
];

export const metadata: Metadata = {
  title: "Fitrack",
  description: "IPPT, weight and daily training tracker",
  applicationName: "Fitrack",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Fitrack",
    statusBarStyle: "black-translucent",
    startupImage: SPLASH_DEVICES.map(([w, h, r]) => ({
      url: `/splash/splash-${w * r}x${h * r}.png`,
      media: `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${r}) and (orientation: portrait)`,
    })),
  },
  formatDetection: { telephone: false },
  other: {
    // Next emits only `mobile-web-app-capable` for appleWebApp.capable; iOS standalone needs the apple-prefixed tag.
    "apple-mobile-web-app-capable": "yes",
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-[100dvh] font-sans text-white">
        {/* Same layout as the iOS startup image, so the hand-off is seamless; it then eases away. Installed app only. */}
        <div id="splash" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/splash/mark.png" alt="" width={96} height={96} className="splash-mark" />
          <div className="splash-word">Fitrack</div>
          <div className="splash-tag">IPPT · WEIGHT · TRAINING</div>
        </div>
        {children}
      </body>
    </html>
  );
}
