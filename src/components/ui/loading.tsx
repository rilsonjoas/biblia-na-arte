import { Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface LoadingProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8'
}

export function Loading({ className, size = 'md', text }: LoadingProps) {
  return (
    <div className={cn("flex items-center justify-center p-4", className)}>
      <div className="flex items-center space-x-2">
        <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
        {text && <span className="text-muted-foreground">{text}</span>}
      </div>
    </div>
  )
}

export function LoadingCard({ className, text = "Carregando..." }: LoadingProps) {
  return (
    <Card className={cn("gradient-card border-0", className)}>
      <CardContent className="p-12">
        <Loading size="lg" text={text} className="text-center" />
      </CardContent>
    </Card>
  )
}

export function LoadingGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="gradient-card border-0 animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="h-48 bg-muted rounded-lg" />
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-muted rounded w-full mb-2" />
      <div className="h-4 bg-muted rounded w-3/4 mb-2" />
      <div className="h-4 bg-muted rounded w-1/2" />
    </div>
  )
}