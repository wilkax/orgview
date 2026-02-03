import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from '@vercel/analytics/next';
import CookieConsent from "@/components/Cookies";
import { GoogleAnalytics } from '@next/third-parties/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';


export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_PRODUCTNAME,
  description: "The best way to build your SaaS product.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let theme = process.env.NEXT_PUBLIC_THEME
  if(!theme) {
    theme = "theme-sass3"
  }
  const gaID = process.env.NEXT_PUBLIC_GOOGLE_TAG;
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
    <body className={theme}>
      <NextIntlClientProvider messages={messages}>
        {children}
        <Analytics />
        <CookieConsent />
        { gaID && (
            <GoogleAnalytics gaId={gaID}/>
        )}
      </NextIntlClientProvider>
    </body>
    </html>
  );
}
