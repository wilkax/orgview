import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'
import { defaultLocale, locales, type Locale } from '@/i18n/request'

export async function proxy(request: NextRequest) {
    // First, handle Supabase session
    const response = await updateSession(request)

    // Then, handle locale
    const locale = (request.cookies.get('NEXT_LOCALE')?.value as Locale) || defaultLocale

    // Validate locale
    if (!locales.includes(locale)) {
        response.cookies.set('NEXT_LOCALE', defaultLocale)
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}