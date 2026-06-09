import type { ReactNode } from "react";
import { Playfair_Display, Inter } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export default function MenuLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${playfair.variable} ${inter.variable}`}>
      {children}
    </div>
  );
}
