import type { Metadata, Viewport } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";

const prompt = Prompt({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "Care Companion",
  description: "เว็บแอปพลิเคชันช่วยเหลือและอำนวยความสะดวกในการเดินทางและการทำธุระ",
  keywords: ["Help, Companion, Travel, Business, Application, ช่วยเหลือ, เพื่อน, ท่องเที่ยว, ธุระ, แอปพลิเคชัน"],
  icons: {
    icon: "/images/favicon-96.png",
    apple: "/images/logo-icon.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${prompt.className} h-full antialiased overflow-x-hidden`}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden w-full max-w-full">{children}</body>
    </html>
  );
}
