// Phase 4: Supabase Client Helpers for Organization-Scoped Operations
// File: nextjs/src/lib/supabase/organization-helpers.ts

import { SupabaseClient } from '@supabase/supabase-js';

export type OrganizationRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface Organization {
    id: string;
    name: string;
    slug: string;
    created_at: string;
    updated_at: string;
    settings: Record<string, any>;
    is_active: boolean;
}

export interface OrganizationMembership {
    id: string;
    organization_id: string;
    user_id: string;
    role: OrganizationRole;
    created_at: string;
    updated_at: string;
}

export interface Questionnaire {
    id: string;
    organization_id: string;
    title: string;
    description: string | null;
    status: 'draft' | 'published' | 'archived';
    settings: Record<string, any>;
    created_by: string | null;
    created_at: string;
    updated_at: string;
}

export interface Question {
    id: string;
    questionnaire_id: string;
    type: 'text' | 'textarea' | 'radio' | 'checkbox' | 'scale' | 'date' | 'number';
    title: string;
    description: string | null;
    options: any;
    required: boolean;
    order_index: number;
    settings: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface Submission {
    id: string;
    questionnaire_id: string;
    organization_id: string;
    submitted_by: string | null;
    status: 'in_progress' | 'completed';
    submitted_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface Answer {
    id: string;
    submission_id: string;
    question_id: string;
    value: any;
    created_at: string;
    updated_at: string;
}

export class OrganizationService {
    constructor(private client: SupabaseClient) {}

    // Get all organizations for the current user
    async getOrganizations() {
        return this.client
            .from('organizations')
            .select(`
                *,
                organization_memberships!inner(role)
            `)
            .order('created_at', { ascending: true });
    }

    // Get a specific organization
    async getOrganization(orgId: string) {
        return this.client
            .from('organizations')
            .select('*')
            .eq('id', orgId)
            .single();
    }

    // Get organization members
    async getOrganizationMembers(orgId: string) {
        return this.client
            .from('organization_memberships')
            .select(`
                *,
                user:auth.users(id, email, raw_user_meta_data)
            `)
            .eq('organization_id', orgId);
    }

    // Update organization
    async updateOrganization(orgId: string, updates: Partial<Organization>) {
        return this.client
            .from('organizations')
            .update(updates)
            .eq('id', orgId);
    }

    // Get questionnaires for an organization
    async getQuestionnaires(orgId: string) {
        return this.client
            .from('questionnaires')
            .select('*')
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false });
    }

    // Create a questionnaire
    async createQuestionnaire(data: Omit<Questionnaire, 'id' | 'created_at' | 'updated_at'>) {
        return this.client
            .from('questionnaires')
            .insert(data)
            .select()
            .single();
    }

    // Get questions for a questionnaire
    async getQuestions(questionnaireId: string) {
        return this.client
            .from('questions')
            .select('*')
            .eq('questionnaire_id', questionnaireId)
            .order('order_index', { ascending: true });
    }

    // Get submissions for an organization
    async getSubmissions(orgId: string) {
        return this.client
            .from('submissions')
            .select(`
                *,
                questionnaire:questionnaires(title),
                user:auth.users(email)
            `)
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false });
    }

    // Create a submission
    async createSubmission(data: Omit<Submission, 'id' | 'created_at' | 'updated_at'>) {
        return this.client
            .from('submissions')
            .insert(data)
            .select()
            .single();
    }

    // Get answers for a submission
    async getAnswers(submissionId: string) {
        return this.client
            .from('answers')
            .select('*')
            .eq('submission_id', submissionId);
    }

    // Invite user to organization
    async inviteUser(orgId: string, email: string, role: OrganizationRole) {
        return this.client
            .from('organization_invitations')
            .insert({
                organization_id: orgId,
                email,
                role,
            })
            .select()
            .single();
    }
}

