import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Skeleton, SkeletonContainer } from './Skeleton'

describe('Skeleton Primitive Component', () => {
  it('merender dengan variant text, rect, dan circle serta aria-hidden', () => {
    const htmlText = renderToStaticMarkup(<Skeleton variant="text" className="h-4 w-32" />)
    expect(htmlText).toContain('aria-hidden="true"')
    expect(htmlText).toContain('rounded-md')
    expect(htmlText).toContain('animate-pulse')

    const htmlCircle = renderToStaticMarkup(<Skeleton variant="circle" className="w-12 h-12" />)
    expect(htmlCircle).toContain('rounded-full')

    const htmlRect = renderToStaticMarkup(<Skeleton variant="rect" className="w-full h-20" />)
    expect(htmlRect).toContain('rounded-xl')
  })

  it('SkeletonContainer memiliki role status, aria-busy, dan teks screen reader tersembunyi', () => {
    const html = renderToStaticMarkup(
      <SkeletonContainer screenReaderText="Memuat daftar warung...">
        <Skeleton variant="text" />
      </SkeletonContainer>
    )

    expect(html).toContain('role="status"')
    expect(html).toContain('aria-busy="true"')
    expect(html).toContain('Memuat daftar warung...')
    expect(html).toContain('class="sr-only"')
  })

  it('menghormati prefers-reduced-motion dengan utility motion-reduce:animate-none', () => {
    const html = renderToStaticMarkup(<Skeleton />)
    expect(html).toContain('motion-reduce:animate-none')
  })
})
