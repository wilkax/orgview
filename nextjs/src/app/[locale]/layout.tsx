import type { Metadata } from "next";
import "../globals.css";
import { Analytics } from '@vercel/analytics/next';
import CookieConsent from "@/components/Cookies";
import { GoogleAnalytics } from '@next/third-parties/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_PRODUCTNAME,
  description: "The best way to build your SaaS product.",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  let theme = process.env.NEXT_PUBLIC_THEME;
  if (!theme) {
    theme = "theme-sass3";
  }
  const gaID = process.env.NEXT_PUBLIC_GOOGLE_TAG;

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={theme}>
        <NextIntlClientProvider messages={messages}>
          {children}
          <Analytics />
          <CookieConsent />
          {gaID && <GoogleAnalytics gaId={gaID} />}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

