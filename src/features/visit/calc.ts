// Rumus terjual dan stok setelah
export interface CalcVisitParams {
  initialStock: number
  returnedQty: number
  newStockAdded: number
}

export interface CalcVisitResult {
  soldQty: number
  finalStock: number
}

export function calculateVisit(params: CalcVisitParams): CalcVisitResult {
  const soldQty = Math.max(0, params.initialStock - params.returnedQty)
  const finalStock = params.returnedQty + params.newStockAdded
  return {
    soldQty,
    finalStock,
  }
}
