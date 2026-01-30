"use client";
import React from 'react';
import { useGlobal } from '@/lib/context/GlobalContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { CalendarDays, Settings, Shield, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function DashboardContent() {
    const { loading, user } = useGlobal();

    const getDaysSinceRegistration = () => {
        if (!user?.registered_at) return 0;
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - user.registered_at.getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    const daysSinceRegistration = getDaysSinceRegistration();

    return (
        <div className="space-y-6 p-6">
            <Card>
                <CardHeader>
                    <CardTitle>Welcome, {user?.email?.split('@')[0]}! 👋</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" />
                        Member for {daysSinceRegistration} days
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Frequently used features</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* System Admin - Organizations */}
                        {user?.roles?.isSystemAdmin && (
                            <Link
                                href="/app/admin/organizations"
                                className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <div className="p-2 bg-blue-50 rounded-full">
                                    <Building2 className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-medium">Organizations</h3>
                                    <p className="text-sm text-gray-500">Manage all organizations</p>
                                </div>
                            </Link>
                        )}

                        {/* Organization Links */}
                        {user?.roles?.organizationMemberships?.map((org) => (
                            <Link
                                key={org.organizationId}
                                href={`/app/org/${org.organizationSlug}`}
                                className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <div className="p-2 bg-green-50 rounded-full">
                                    <Building2 className="h-4 w-4 text-green-600" />
                                </div>
                                <div>
                                    <h3 className="font-medium capitalize">{org.organizationSlug}</h3>
                                    <p className="text-sm text-gray-500">
                                        {org.role === 'admin' ? 'Organization Admin' : 'Organization Auditor'}
                                    </p>
                                </div>
                            </Link>
                        ))}

                        {/* User Settings */}
                        <Link
                            href="/app/user-settings"
                            className="flex items-center gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <div className="p-2 bg-primary-50 rounded-full">
                                <Settings className="h-4 w-4 text-primary-600" />
                            </div>
                            <div>
                                <h3 className="font-medium">User Settings</h3>
                                <p className="text-sm text-gray-500">Manage your account preferences</p>
                            </div>
                        </Link>
                    </div>

                    {/* Info message if no roles */}
                    {!user?.roles?.isSystemAdmin &&
                     (!user?.roles?.organizationMemberships || user.roles.organizationMemberships.length === 0) && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800">
                                You don't have any organization memberships yet. Contact your system administrator to get access to organizations.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}