'use client'

import { useEffect, useState } from 'react'
import { createSPASassClient } from '@/lib/supabase/client'
import { Tables } from '@/lib/types'
import { Plus, X, Layers } from 'lucide-react'

type Approach = Tables<'approaches'>
type OrganizationApproach = Tables<'organization_approaches'>

interface OrganizationApproachesProps {
  organizationId: string
}

export default function OrganizationApproaches({ organizationId }: OrganizationApproachesProps) {
  const [allApproaches, setAllApproaches] = useState<Approach[]>([])
  const [assignedApproaches, setAssignedApproaches] = useState<OrganizationApproach[]>([])
  const [loading, setLoading] = useState(true)
  const [showAssignModal, setShowAssignModal] = useState(false)

  useEffect(() => {
    loadData()
  }, [organizationId])

  async function loadData() {
    const supabaseWrapper = await createSPASassClient()
    const supabase = supabaseWrapper.getSupabaseClient()

    // Load all active approaches
    const { data: approachesData } = await supabase
      .from('approaches')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (approachesData) {
      setAllApproaches(approachesData)
    }

    // Load assigned approaches
    const { data: assignedData } = await supabase
      .from('organization_approaches')
      .select('*')
      .eq('organization_id', organizationId)

    if (assignedData) {
      setAssignedApproaches(assignedData)
    }

    setLoading(false)
  }

  async function assignApproach(approachId: string) {
    const supabaseWrapper = await createSPASassClient()
    const supabase = supabaseWrapper.getSupabaseClient()

    const { error } = await supabase
      .from('organization_approaches')
      .insert([{
        organization_id: organizationId,
        approach_id: approachId,
      }])

    if (!error) {
      loadData()
    }
  }

  async function unassignApproach(approachId: string) {
    if (!confirm('Are you sure you want to unassign this approach?')) return

    const supabaseWrapper = await createSPASassClient()
    const supabase = supabaseWrapper.getSupabaseClient()

    await supabase
      .from('organization_approaches')
      .delete()
      .eq('organization_id', organizationId)
      .eq('approach_id', approachId)

    loadData()
  }

  const assignedApproachIds = assignedApproaches.map(a => a.approach_id)
  const assignedApproachDetails = allApproaches.filter(a => assignedApproachIds.includes(a.id))
  const availableApproaches = allApproaches.filter(a => !assignedApproachIds.includes(a.id))

  if (loading) {
    return <div className="text-sm text-gray-500">Loading approaches...</div>
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          Assigned Approaches
        </h3>
        {availableApproaches.length > 0 && (
          <button
            onClick={() => setShowAssignModal(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <Plus className="h-4 w-4" />
            Assign Approach
          </button>
        )}
      </div>

      {/* Assigned Approaches List */}
      <div className="px-4 py-5 sm:px-6">
        {assignedApproachDetails.length > 0 ? (
          <div className="space-y-3">
            {assignedApproachDetails.map((approach) => (
              <div
                key={approach.id}
                className="flex items-start justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Layers className="h-5 w-5 text-gray-400" />
                    <h4 className="text-sm font-medium text-gray-900">
                      {approach.name}
                    </h4>
                    {approach.category && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {approach.category}
                      </span>
                    )}
                  </div>
                  {approach.description && (
                    <p className="mt-1 text-sm text-gray-600 ml-7">
                      {approach.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => unassignApproach(approach.id)}
                  className="ml-4 inline-flex items-center gap-1 px-2 py-1 text-sm text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            No approaches assigned yet. Assign approaches to enable questionnaire templates for this organization.
          </p>
        )}
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-lg font-medium mb-4">Assign Approach</h2>
            <div className="space-y-2">
              {availableApproaches.map((approach) => (
                <button
                  key={approach.id}
                  onClick={() => {
                    assignApproach(approach.id)
                    setShowAssignModal(false)
                  }}
                  className="w-full text-left p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="font-medium">{approach.name}</div>
                  {approach.description && (
                    <div className="text-sm text-gray-600 mt-1">{approach.description}</div>
                  )}
                  {approach.category && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {approach.category}
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAssignModal(false)}
              className="mt-4 w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

