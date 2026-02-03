'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Globe } from 'lucide-react';
import { useState, useTransition } from 'react';
import { locales, type Locale } from '@/i18n/config';
import { useRouter, usePathname } from '@/i18n/routing';

export default function LanguageSwitcher() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const changeLanguage = (newLocale: Locale) => {
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
      setIsOpen(false);
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
        <span>{t(`languages.${locale}`)}</span>
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
              {locales.map((loc) => (
                <button
                  key={loc}
                  onClick={() => changeLanguage(loc)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                    loc === locale ? 'bg-gray-50 font-medium' : ''
                  }`}
                  disabled={isPending}
                >
                  {t(`languages.${loc}`)}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

