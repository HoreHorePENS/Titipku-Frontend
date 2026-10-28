// API endpoint kunjungan
import { apiClient } from '../../lib/api-client'
import type { VisitDraftSchema } from './schema'

export async function submitVisit(data: VisitDraftSchema) {
  return apiClient('/visits', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
