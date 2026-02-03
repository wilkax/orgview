import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';
import { locales, defaultLocale } from './config';

export const routing = defineRouting({
  locales: [...locales],
  defaultLocale,
  // Use 'as-needed' - default locale (en) has no prefix, others do (e.g. /de/app)
  localePrefix: 'as-needed'
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);

