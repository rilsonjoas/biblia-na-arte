import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Link } from 'react-router-dom'

interface ErrorDisplayProps {
  error: Error | null
  onRetry?: () => void
  title?: string
  className?: string
}

export function ErrorDisplay({ 
  error, 
  onRetry, 
  title = "Ops! Algo deu errado", 
  className 
}: ErrorDisplayProps) {
  const errorMessage = error?.message || 'Erro desconhecido'
  
  return (
    <Alert className={className} variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-2">
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{errorMessage}</p>
          {onRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry}
              className="mt-2"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  )
}

export function ErrorCard({ 
  error, 
  onRetry, 
  title = "Falha ao Carregar Dados",
  className 
}: ErrorDisplayProps) {
  const errorMessage = error?.message || 'Não foi possível conectar ao servidor'
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center text-destructive">
          <AlertTriangle className="w-5 h-5 mr-2" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-muted-foreground">{errorMessage}</p>
          <div className="flex gap-2">
            {onRetry && (
              <Button onClick={onRetry} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </Button>
            )}
            <Button asChild variant="outline">
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Voltar ao Início
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ErrorBoundary({ 
  error, 
  onRetry,
  showDetails = false 
}: ErrorDisplayProps & { showDetails?: boolean }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">Oops! Algo deu errado</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Encontramos um problema inesperado. Nossa equipe foi notificada.
          </p>
          
          {showDetails && error && (
            <details className="text-left">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                Detalhes técnicos
              </summary>
              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                {error.message}
              </pre>
            </details>
          )}
          
          <div className="flex gap-2 justify-center">
            {onRetry && (
              <Button onClick={onRetry}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </Button>
            )}
            <Button asChild variant="outline">
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Página Inicial
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorCard
      error={new Error('Falha na conexão com o servidor. Verifique sua conexão com a internet.')}
      onRetry={onRetry}
      title="Erro de Conexão"
    />
  )
}

export function NotFoundError() {
  return (
    <Card>
      <CardContent className="p-12 text-center">
        <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Conteúdo não encontrado</h3>
        <p className="text-muted-foreground mb-6">
          O item que você está procurando não existe ou foi removido.
        </p>
        <Button asChild>
          <Link to="/">
            <Home className="w-4 h-4 mr-2" />
            Voltar ao Início
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}