import React from 'react'

interface BottomBarProps {
  children?: React.ReactNode
}

export function BottomBar({ children }: BottomBarProps) {
  return <div className="bottom-bar fixed bottom-0 left-0 right-0">{children}</div>
}
