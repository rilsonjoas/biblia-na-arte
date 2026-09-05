import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingCard } from '@/components/ui/loading';
import { ErrorDisplay } from '@/components/ui/error-display';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { listSubmissions, type Submission } from '@/lib/admin-api';
import { LogOut, ImageOff } from 'lucide-react';

const STATUS_LABEL: Record<Submission['status'], string> = {
  pendente: 'Pendente',
  aprovado: 'Aprovado',
  rejeitado: 'Rejeitado',
};

const STATUS_VARIANT: Record<Submission['status'], 'default' | 'secondary' | 'destructive'> = {
  pendente: 'default',
  aprovado: 'secondary',
  rejeitado: 'destructive',
};

export default function AdminSubmissions() {
  const [statusFilter, setStatusFilter] = useState<Submission['status'] | 'todas'>('pendente');
  const { user, logout } = useAdminAuth();

  const { data: submissions, isLoading, error } = useQuery({
    queryKey: ['admin', 'submissions', statusFilter],
    queryFn: () => listSubmissions(statusFilter === 'todas' ? undefined : statusFilter),
  });

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Fila de Submissões" />
      <Header />

      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-display text-2xl sm:text-3xl font-bold mb-1">Submissões de Artistas</h1>
            <p className="text-muted-foreground">
              Logado como <strong>{user?.email}</strong> ({user?.role})
            </p>
          </div>
          <Button variant="outline" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>

        <Tabs
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as Submission['status'] | 'todas')}
          className="mb-6"
        >
          <TabsList>
            <TabsTrigger value="pendente">Pendentes</TabsTrigger>
            <TabsTrigger value="aprovado">Aprovadas</TabsTrigger>
            <TabsTrigger value="rejeitado">Rejeitadas</TabsTrigger>
            <TabsTrigger value="todas">Todas</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading && <LoadingCard text="Carregando submissões..." />}
        {error && <ErrorDisplay error={error as Error} title="Não foi possível carregar as submissões" />}

        {submissions && submissions.length === 0 && (
          <Card className="gradient-card border-0">
            <CardContent className="p-12 text-center text-muted-foreground">
              <ImageOff className="w-10 h-10 mx-auto mb-4 opacity-50" />
              Nenhuma submissão {statusFilter !== 'todas' ? STATUS_LABEL[statusFilter].toLowerCase() : ''}{' '}
              no momento.
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {submissions?.map((submission) => (
            <Link key={submission.id} to={`/admin/submissoes/${submission.id}`}>
              <Card className="gradient-card border-0 h-full hover:shadow-classical transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-lg leading-tight">{submission.title}</h3>
                    <Badge variant={STATUS_VARIANT[submission.status]}>{STATUS_LABEL[submission.status]}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {submission.artistName || 'Artista não informado'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Enviado por {submission.submitterName} —{' '}
                    {new Date(submission.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
