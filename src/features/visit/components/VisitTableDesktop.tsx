import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Money } from '@/components/shared/Money'
import { aggregateVisitItems } from '../calc'
import type { GroupedVisits, VisitRecord } from '../types'

export interface VisitTableDesktopProps {
  groups: GroupedVisits[]
  onSelect?: (visit: VisitRecord) => void
}

export function VisitTableDesktop({ groups, onSelect }: VisitTableDesktopProps) {
  return (
    <div className="w-full bg-surface rounded-2xl border border-line shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-caption font-sans border-collapse">
          <thead>
            <tr className="border-b border-line text-caption font-bold text-ink-soft tracking-wider bg-surface">
              <th className="py-3 px-4 w-[28%]">WARUNG</th>
              <th className="py-3 px-3 text-right">TERJUAL</th>
              <th className="py-3 px-3 text-right">RETUR</th>
              <th className="py-3 px-3 text-right">TITIP BARU</th>
              <th className="py-3 px-4 text-right">TAGIHAN</th>
              <th className="py-3 px-4 text-right">DIBAYAR</th>
              <th className="py-3 px-4">STATUS</th>
              <th className="py-3 px-4">NOTA</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <Fragment key={group.dateKey}>
                {/* Header Pemisah Tanggal */}
                <tr className="border-t border-b border-line bg-surface-raised/40">
                  <td
                    colSpan={8}
                    className="py-2.5 px-4 font-bold text-ink text-caption tracking-tight"
                  >
                    {group.dateHeaderDesktop}
                  </td>
                </tr>

                {/* Baris Kunjungan di Tanggal Tersebut */}
                {group.visits.map((visit) => {
                  const { sold, returned, newDrop } = aggregateVisitItems(visit.items)
                  const statusLabel =
                    visit.status === 'paid'
                      ? 'LUNAS'
                      : visit.status === 'partial'
                      ? 'SEBAGIAN'
                      : 'BELUM LUNAS'

                  const notaLink = `/n/${visit.publicToken || visit.number}`

                  return (
                    <tr
                      key={visit.id}
                      onClick={() => onSelect?.(visit)}
                      className="border-b border-line/70 hover:bg-surface-raised/60 transition-colors cursor-pointer group"
                    >
                      {/* Warung */}
                      <td className="py-3 px-4 font-bold text-ink truncate group-hover:text-primary transition-colors">
                        {visit.partnerName}{' '}
                        {visit.partnerArea && (
                          <span className="font-normal text-ink-soft">· {visit.partnerArea}</span>
                        )}
                      </td>

                      {/* Terjual */}
                      <td className="py-3 px-3 text-right tabular-nums font-medium text-ink">
                        {sold}
                      </td>

                      {/* Retur */}
                      <td className="py-3 px-3 text-right tabular-nums font-medium text-danger">
                        {returned}
                      </td>

                      {/* Titip Baru */}
                      <td className="py-3 px-3 text-right tabular-nums font-medium text-ink">
                        {newDrop}
                      </td>

                      {/* Tagihan */}
                      <td className="py-3 px-4 text-right font-bold text-ink tabular-nums">
                        <Money amount={visit.total} showPrefix={false} />
                      </td>

                      {/* Dibayar */}
                      <td className="py-3 px-4 text-right tabular-nums font-medium text-ink">
                        <Money amount={visit.paid} showPrefix={false} />
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <StatusBadge status={statusLabel} />
                      </td>

                      {/* Nota */}
                      <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                        <Link
                          to={notaLink}
                          className="font-mono text-caption font-semibold text-primary hover:underline"
                        >
                          {visit.number}
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
