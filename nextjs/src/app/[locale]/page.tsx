import React from 'react';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import AuthAwareButtons from '@/components/AuthAwareButtons';
import { getTranslations } from 'next-intl/server';

export default async function Home() {
  const t = await getTranslations('home');
  const productName = process.env.NEXT_PUBLIC_PRODUCTNAME || 'OrgView';

  return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
        <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-sm z-50 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                  {productName}
                </span>
              </div>
              <div className="hidden md:flex items-center space-x-8">
                <AuthAwareButtons variant="nav" />
              </div>
            </div>
          </div>
        </nav>

        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
          </div>

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-32">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-100 rounded-full mb-6">
              <Sparkles className="h-3 w-3 text-primary-600" />
              <span className="text-xs font-medium text-primary-700">{t('comingSoon')}</span>
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6">
              <span className="block text-gray-900">{t('heroTitle')}</span>
              <span className="block bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 bg-clip-text text-transparent mt-2">
                {t('heroSubtitle')}
              </span>
            </h1>

            <p className="mt-6 text-base md:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              {t('heroDescription')}
            </p>

            <div className="mt-12">
              <p className="text-xl md:text-2xl font-semibold text-primary-600 animate-pulse">
                {t('stayTuned')}
              </p>
            </div>
          </div>
        </section>

        <footer className="relative bg-white/50 backdrop-blur-sm border-t border-gray-200">
          <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-gray-600">
              © {new Date().getFullYear()} {productName}. {t('footerAllRightsReserved')}
            </p>
          </div>
        </footer>
      </div>
  );
}