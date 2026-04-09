import type { Metadata } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import CustomCursor from '@/components/CustomCursor';
import ParallaxProvider from '@/components/ParallaxProvider';
import SoundProvider from '@/components/SoundProvider';
import SmoothScrollProvider from '@/components/SmoothScrollProvider';

const outfit = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Wall Calendar — Interactive Date Planner",
  description:
    "A premium interactive wall calendar with day range selection, integrated notes, GSAP animations, and theme switching. Built with Next.js.",
  keywords: ["calendar", "wall calendar", "date picker", "planner", "react"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" className={`${outfit.variable} ${inter.variable}`}>
      <body>
        <SmoothScrollProvider>
          <SoundProvider>
            <ParallaxProvider>
              <CustomCursor>
                {children}
              </CustomCursor>
            </ParallaxProvider>
          </SoundProvider>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
