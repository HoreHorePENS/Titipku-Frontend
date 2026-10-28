// Skema validasi kunjungan (Zod / validator)
export interface VisitDraftSchema {
  outletId: string
  items: Array<{
    productId: string
    initialStock: number
    returnedQty: number
    newStockAdded: number
  }>
}
