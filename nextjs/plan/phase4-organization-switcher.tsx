// Phase 4: Organization Switcher Component
// File: nextjs/src/components/OrganizationSwitcher.tsx

'use client';

import { useGlobal } from '@/lib/context/GlobalContext';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Building2 } from 'lucide-react';

export function OrganizationSwitcher() {
    const { currentOrganization, organizations, setCurrentOrganization } = useGlobal();

    if (organizations.length === 0) {
        return null;
    }

    return (
        <Select
            value={currentOrganization?.id}
            onValueChange={(value) => {
                const org = organizations.find((o) => o.id === value);
                if (org) {
                    setCurrentOrganization(org);
                }
            }}
        >
            <SelectTrigger className="w-[200px]">
                <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <SelectValue placeholder="Select organization" />
                </div>
            </SelectTrigger>
            <SelectContent>
                {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                        <div className="flex flex-col">
                            <span className="font-medium">{org.name}</span>
                            <span className="text-xs text-muted-foreground capitalize">
                                {org.role}
                            </span>
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

