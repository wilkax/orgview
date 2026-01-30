import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function RegisterPage() {
    return (
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    <ShieldAlert className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="mt-4 text-2xl font-bold text-gray-900">
                    Invite Only
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                    Registration is disabled. You can only join this platform by invitation.
                </p>
                <p className="mt-4 text-sm text-gray-600">
                    If you have received an invitation email, please click the link in the email to set up your account.
                </p>
                <div className="mt-6">
                    <Link
                        href="/auth/login"
                        className="font-medium text-primary-600 hover:text-primary-500"
                    >
                        ← Back to login
                    </Link>
                </div>
            </div>
        </div>
    );
}