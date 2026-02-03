import { getTranslations } from 'next-intl/server';

export default async function InvalidTokenPage() {
  const t = await getTranslations('errors');

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            {t('invalidToken')}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {t('invalidTokenMessage')}
          </p>
          <p className="mt-4 text-sm text-gray-500">
            {t('contactAdmin')}
          </p>
        </div>
      </div>
    </div>
  )
}

