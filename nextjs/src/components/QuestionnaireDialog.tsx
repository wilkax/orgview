'use client'

import { Sparkles } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import LandingQuestionnaire from '@/components/LandingQuestionnaire'

export default function QuestionnaireDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl hover:from-primary-700 hover:to-primary-600 shadow-lg shadow-primary-200 transition-all duration-200 hover:scale-105">
          <Sparkles className="h-4 w-4" />
          Schnellcheck starten
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
          <DialogTitle className="text-base font-bold text-gray-900">
            Wie adaptiv ist Ihre Organisation?
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500 mt-1">
            Fünf Fragen — sofortige Einschätzung zu Ihrer Entscheidungs- und Lernkultur.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 py-5 max-h-[75vh] overflow-y-auto">
          <LandingQuestionnaire />
        </div>
      </DialogContent>
    </Dialog>
  )
}

