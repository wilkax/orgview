'use client';

import { useTranslations } from 'next-intl';
import { Globe } from 'lucide-react';
import { useState, useTransition } from 'react';
import { locales, type Locale } from '@/i18n/request';

export default function LanguageSwitcher({ currentLocale }: { currentLocale: Locale }) {
  const t = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const changeLanguage = (locale: Locale) => {
    startTransition(() => {
      // Set cookie
      document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000`;
      // Reload page to apply new locale
      window.location.reload();
    });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        disabled={isPending}
      >
        <Globe size={16} />
        <span>{t(`languages.${currentLocale}`)}</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-200">
            <div className="py-1">
              {locales.map((locale) => (
                <button
                  key={locale}
                  onClick={() => {
                    changeLanguage(locale);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                    locale === currentLocale ? 'bg-gray-50 font-medium' : ''
                  }`}
                  disabled={isPending}
                >
                  {t(`languages.${locale}`)}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

