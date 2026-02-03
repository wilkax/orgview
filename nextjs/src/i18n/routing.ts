import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['en', 'de'],
  defaultLocale: 'en',
  localePrefix: 'never' // We'll use cookies instead of URL prefixes
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);

