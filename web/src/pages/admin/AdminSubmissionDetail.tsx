import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingCard } from '@/components/ui/loading';
import { useToast } from '@/components/ui/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  getSubmission,
  fetchSubmissionImageUrl,
  updateSubmission,
  approveSubmission,
  rejectSubmission,
  AdminApiError,
  type UpdateSubmissionInput,
} from '@/lib/admin-api';
import { ArrowLeft, Save, CheckCircle2, XCircle } from 'lucide-react';

export default function AdminSubmissionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAdminAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [form, setForm] = useState<UpdateSubmissionInput>({});
  const [rejectReason, setRejectReason] = useState('');

  const { data: submission, isLoading } = useQuery({
    queryKey: ['admin', 'submissions', id],
    queryFn: () => getSubmission(id!),
    enabled: !!id,
  });

  // Imagem exige fetch autenticado (token no header, não dá pra usar
  // <img src> direto) — ver comentário em lib/admin-api.ts. Revoga a
  // object URL ao desmontar/trocar de submissão pra não vazar memória.
  useEffect(() => {
    if (!id) return;
    let objectUrl: string | null = null;
    fetchSubmissionImageUrl(id).then((url) => {
      objectUrl = url;
      setImageUrl(url);
    });
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);

  useEffect(() => {
    if (submission) {
      setForm({
        title: submission.title,
        subtitle: submission.subtitle ?? undefined,
        artistName: submission.artistName ?? undefined,
        year: submission.year ?? undefined,
        description: submission.description ?? undefined,
        location: submission.location ?? undefined,
        sourceUrl: submission.sourceUrl ?? undefined,
        suggestedBook: submission.suggestedBook ?? undefined,
        suggestedChapter: submission.suggestedChapter ?? undefined,
        suggestedVerses: submission.suggestedVerses ?? undefined,
        suggestedPassageText: submission.suggestedPassageText ?? undefined,
        reviewerNotes: submission.reviewerNotes ?? undefined,
      });
    }
  }, [submission]);

  const saveMutation = useMutation({
    mutationFn: () => updateSubmission(id!, form),
    onSuccess: () => {
      toast({ title: 'Alterações salvas' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'submissions', id] });
    },
    onError: (err) => {
      toast({
        title: 'Erro ao salvar',
        description: err instanceof AdminApiError ? err.message : undefined,
        variant: 'destructive',
      });
    },
  });

  const approveMutation = useMutation({
    mutationFn: () => approveSubmission(id!),
    onSuccess: ({ artworkId }) => {
      toast({ title: 'Obra publicada!' });
      navigate(`/obra/${artworkId}`);
    },
    onError: (err) => {
      toast({
        title: 'Erro ao aprovar',
        description: err instanceof AdminApiError ? err.message : undefined,
        variant: 'destructive',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectSubmission(id!, rejectReason || undefined),
    onSuccess: () => {
      toast({ title: 'Submissão rejeitada' });
      navigate('/admin/submissoes');
    },
  });

  if (isLoading || !submission) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <LoadingCard text="Carregando submissão..." />
        </div>
        <Footer />
      </div>
    );
  }

  const canApprove = user?.role === 'admin';
  const isDecided = submission.status !== 'pendente';

  return (
    <div className="min-h-screen bg-background">
      <SEO title={`Revisar: ${submission.title}`} />
      <Header />

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Link to="/admin/submissoes" className="inline-flex items-center text-sm text-muted-foreground mb-6 hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar pra fila
        </Link>

        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-display text-2xl sm:text-3xl font-bold mb-2">{submission.title}</h1>
            <p className="text-sm text-muted-foreground">
              Enviado por {submission.submitterName} ({submission.submitterEmail})
              {submission.submitterContact && ` — ${submission.submitterContact}`}
            </p>
          </div>
          <Badge>{submission.status}</Badge>
        </div>

        {isDecided && (
          <Alert className="mb-6">
            <AlertDescription>
              Esta submissão já foi {submission.status === 'aprovado' ? 'aprovada' : 'rejeitada'} — os
              campos abaixo não podem mais ser editados.
              {submission.approvedArtworkId && (
                <>
                  {' '}
                  <Link to={`/obra/${submission.approvedArtworkId}`} className="underline">
                    Ver obra publicada
                  </Link>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="font-semibold mb-3">Imagem enviada</h2>
            {imageUrl ? (
              <img src={imageUrl} alt={submission.title} className="w-full rounded-lg shadow-card" />
            ) : (
              <div className="aspect-square bg-muted rounded-lg animate-pulse" />
            )}
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={form.title ?? ''}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                disabled={isDecided}
              />
            </div>
            <div>
              <Label htmlFor="subtitle">Título original / subtítulo</Label>
              <Input
                id="subtitle"
                value={form.subtitle ?? ''}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                disabled={isDecided}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="artistName">Artista</Label>
                <Input
                  id="artistName"
                  value={form.artistName ?? ''}
                  onChange={(e) => setForm({ ...form, artistName: e.target.value })}
                  disabled={isDecided}
                />
              </div>
              <div>
                <Label htmlFor="year">Ano</Label>
                <Input
                  id="year"
                  value={form.year ?? ''}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                  disabled={isDecided}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="location">Localização</Label>
              <Input
                id="location"
                value={form.location ?? ''}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                disabled={isDecided}
              />
            </div>
            <div>
              <Label htmlFor="sourceUrl">Fonte (URL)</Label>
              <Input
                id="sourceUrl"
                value={form.sourceUrl ?? ''}
                onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })}
                disabled={isDecided}
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                rows={5}
                value={form.description ?? ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                disabled={isDecided}
              />
            </div>
          </div>
        </div>

        <Card className="gradient-card border-0 mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Referência bíblica</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="suggestedBook">Livro</Label>
              <Input
                id="suggestedBook"
                value={form.suggestedBook ?? ''}
                onChange={(e) => setForm({ ...form, suggestedBook: e.target.value })}
                placeholder="Ex.: João"
                disabled={isDecided}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Precisa bater exatamente com o nome do livro no sistema, ou a referência não é criada na
                aprovação (a obra ainda assim é publicada).
              </p>
            </div>
            <div>
              <Label htmlFor="suggestedChapter">Capítulo</Label>
              <Input
                id="suggestedChapter"
                type="number"
                value={form.suggestedChapter ?? ''}
                onChange={(e) => setForm({ ...form, suggestedChapter: Number(e.target.value) || undefined })}
                disabled={isDecided}
              />
            </div>
            <div>
              <Label htmlFor="suggestedVerses">Versículo(s)</Label>
              <Input
                id="suggestedVerses"
                value={form.suggestedVerses ?? ''}
                onChange={(e) => setForm({ ...form, suggestedVerses: e.target.value })}
                placeholder="Ex.: 17-18"
                disabled={isDecided}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="suggestedPassageText">Texto da passagem</Label>
              <Textarea
                id="suggestedPassageText"
                rows={3}
                value={form.suggestedPassageText ?? ''}
                onChange={(e) => setForm({ ...form, suggestedPassageText: e.target.value })}
                disabled={isDecided}
              />
            </div>
          </CardContent>
        </Card>

        <div>
          <Label htmlFor="reviewerNotes" className="mt-6 block">
            Notas internas de revisão
          </Label>
          <Textarea
            id="reviewerNotes"
            rows={2}
            value={form.reviewerNotes ?? ''}
            onChange={(e) => setForm({ ...form, reviewerNotes: e.target.value })}
            disabled={isDecided}
            className="mt-2"
          />
        </div>

        {!isDecided && (
          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <Button variant="outline" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              <Save className="w-4 h-4 mr-2" />
              Salvar alterações
            </Button>

            <Button
              onClick={() => approveMutation.mutate()}
              disabled={!canApprove || approveMutation.isPending}
              title={!canApprove ? 'Só administradores podem aprovar' : undefined}
              className="sm:ml-auto"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {canApprove ? 'Aprovar e publicar' : 'Só admin pode aprovar'}
            </Button>

            <Button variant="destructive" onClick={() => rejectMutation.mutate()} disabled={rejectMutation.isPending}>
              <XCircle className="w-4 h-4 mr-2" />
              Rejeitar
            </Button>
          </div>
        )}

        {!isDecided && (
          <div className="mt-4">
            <Label htmlFor="rejectReason">Motivo da rejeição (opcional, some no e-mail de resposta futuro)</Label>
            <Input
              id="rejectReason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="mt-2"
            />
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
