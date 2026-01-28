// Phase 4: Update GlobalContext for Organization Context
// File: nextjs/src/lib/context/GlobalContext.tsx

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/unified';

type OrganizationRole = 'owner' | 'admin' | 'member' | 'viewer';

type Organization = {
    id: string;
    name: string;
    slug: string;
    role: OrganizationRole;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

interface GlobalContextType {
    loading: boolean;
    user: User | null;
    currentOrganization: Organization | null;
    organizations: Organization[];
    setCurrentOrganization: (org: Organization) => void;
    refreshOrganizations: () => Promise<void>;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export function GlobalProvider({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [currentOrganization, setCurrentOrganizationState] = useState<Organization | null>(null);
    
    const supabase = createClient();

    // Load organizations for the current user
    const loadOrganizations = async () => {
        if (!user) {
            setOrganizations([]);
            setCurrentOrganizationState(null);
            return;
        }

        const { data, error } = await supabase
            .from('organizations')
            .select(`
                *,
                organization_memberships!inner(role)
            `)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Error loading organizations:', error);
            return;
        }

        const orgs = data.map((org: any) => ({
            id: org.id,
            name: org.name,
            slug: org.slug,
            is_active: org.is_active,
            created_at: org.created_at,
            updated_at: org.updated_at,
            role: org.organization_memberships.role as OrganizationRole,
        }));

        setOrganizations(orgs);

        // Load saved organization from localStorage or use first one
        const savedOrgId = localStorage.getItem('currentOrganizationId');
        const savedOrg = orgs.find((org) => org.id === savedOrgId);
        
        if (savedOrg) {
            setCurrentOrganizationState(savedOrg);
        } else if (orgs.length > 0) {
            setCurrentOrganizationState(orgs[0]);
            localStorage.setItem('currentOrganizationId', orgs[0].id);
        }
    };

    // Set current organization and persist to localStorage
    const setCurrentOrganization = (org: Organization) => {
        setCurrentOrganizationState(org);
        localStorage.setItem('currentOrganizationId', org.id);
    };

    // Initialize auth state
    useEffect(() => {
        const initAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            setLoading(false);
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Load organizations when user changes
    useEffect(() => {
        if (user) {
            loadOrganizations();
        } else {
            setOrganizations([]);
            setCurrentOrganizationState(null);
        }
    }, [user]);

    return (
        <GlobalContext.Provider
            value={{
                loading,
                user,
                currentOrganization,
                organizations,
                setCurrentOrganization,
                refreshOrganizations: loadOrganizations,
            }}
        >
            {children}
        </GlobalContext.Provider>
    );
}

export function useGlobal() {
    const context = useContext(GlobalContext);
    if (context === undefined) {
        throw new Error('useGlobal must be used within a GlobalProvider');
    }
    return context;
}

