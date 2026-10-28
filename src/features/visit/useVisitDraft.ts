import { useState } from 'react'
import type { VisitDraftSchema } from './schema'

export function useVisitDraft() {
  const [draft, setDraft] = useState<VisitDraftSchema | null>(null)

  return {
    draft,
    setDraft,
  }
}
