import React from 'react'
import { cn } from '@/lib/utils'

interface FlatWrapperProps {
  children: React.ReactNode
  className?: string
  as?: React.ElementType
}

export function FlatWrapper({ 
  children, 
  className, 
  as: Component = 'div' 
}: FlatWrapperProps) {
  return (
    <Component className={cn('rounded-none shadow-none', className)}>
      {children}
    </Component>
  )
}

// Higher-order component for flat styling
export function withFlatStyling<P extends object>(
  Component: React.ComponentType<P>
) {
  return function FlatStyledComponent(props: P) {
    return (
      <div className="rounded-none shadow-none">
        <Component {...props} />
      </div>
    )
  }
} 