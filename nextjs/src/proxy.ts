import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'

// Create the next-intl middleware
const handleI18nRouting = createIntlMiddleware(routing)

export async function proxy(request: NextRequest) {
    // Step 1: Handle i18n routing
    const response = handleI18nRouting(request)

    // Step 2: Handle Supabase session (updateSession will modify the response)
    const finalResponse = await updateSession(request, response)

    return finalResponse
}

export const config = {
    matcher: [
        '/((?!api|trpc|_next|_vercel|.*\\..*).*)'
    ],
}

