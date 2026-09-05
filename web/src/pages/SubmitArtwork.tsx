import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { submitArtwork, SubmissionApiError } from '@/lib/submission-api';
import { UploadCloud, CheckCircle2 } from 'lucide-react';

// Espelha createSubmissionSchema do servidor (server/src/schemas/
// submission.schema.ts) — mesma régua, mensagens em português direto
// pro usuário final em vez de reaproveitar o schema do backend (que
// lida com string bruta de multipart, não com o File já tipado do
// input).
const formSchema = z.object({
  submitterName: z.string().trim().min(1, 'Seu nome é obrigatório').max(200),
  submitterEmail: z.string().trim().email('E-mail inválido'),
  submitterContact: z.string().trim().max(200).optional(),
  rightsConfirmed: z.literal(true, {
    errorMap: () => ({ message: 'É preciso confirmar que você tem direito sobre a imagem' }),
  }),
  title: z.string().trim().min(1, 'Título da obra é obrigatório').max(300),
  subtitle: z.string().trim().max(300).optional(),
  artistName: z.string().trim().max(200).optional(),
  year: z.string().trim().max(50).optional(),
  description: z.string().trim().max(5000).optional(),
  location: z.string().trim().max(300).optional(),
  sourceUrl: z.string().trim().url('URL inválida').optional().or(z.literal('')),
  suggestedBook: z.string().trim().max(100).optional(),
  suggestedChapter: z.coerce.number().int().positive().optional().or(z.literal('')),
  suggestedVerses: z.string().trim().max(50).optional(),
  suggestedPassageText: z.string().trim().max(3000).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function SubmitArtwork() {
  const navigate = useNavigate();
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      submitterName: '',
      submitterEmail: '',
      submitterContact: '',
      title: '',
      subtitle: '',
      artistName: '',
      year: '',
      description: '',
      location: '',
      sourceUrl: '',
      suggestedBook: '',
      suggestedVerses: '',
      suggestedPassageText: '',
    },
  });

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImage(file);
    setImagePreview(file ? URL.createObjectURL(file) : null);
  }

  async function onSubmit(values: FormValues) {
    if (!image) {
      setSubmitError('Selecione uma imagem da obra');
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await submitArtwork({
        ...values,
        suggestedChapter: values.suggestedChapter === '' ? undefined : values.suggestedChapter,
        image,
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof SubmissionApiError ? err.message : 'Erro inesperado. Tente de novo.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <SEO title="Obra enviada" />
        <Header />
        <div className="container mx-auto px-4 py-20 max-w-lg text-center">
          <CheckCircle2 className="w-16 h-16 mx-auto mb-6 text-green-600" />
          <h1 className="text-display text-2xl sm:text-3xl font-bold mb-4">Obra enviada!</h1>
          <p className="text-muted-foreground mb-8">
            Recebemos sua submissão. Ela entra na fila de revisão — o mesmo curador que cuida do
            restante do acervo confere fonte, licença e referência bíblica antes de publicar. Isso
            pode levar alguns dias.
          </p>
          <Button onClick={() => navigate('/')}>Voltar ao início</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Enviar Obra"
        description="Envie uma obra de arte com tema bíblico pra revisão do curador do Bíblia na Arte."
      />
      <Header />

      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="text-display text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Enviar uma Obra</h1>
          <p className="text-muted-foreground">
            Preencha o que souber — os campos existem pra você preencher com o máximo de detalhe
            possível, mas nenhum é bloqueante além do essencial. A régua de qualidade final é
            aplicada na revisão, não aqui.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card className="gradient-card border-0">
              <CardHeader>
                <CardTitle className="text-lg">Seus dados</CardTitle>
                <CardDescription>Pra podermos entrar em contato sobre a submissão.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="submitterName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seu nome</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="submitterEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="submitterContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp ou Instagram (opcional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="gradient-card border-0">
              <CardHeader>
                <CardTitle className="text-lg">A obra</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label htmlFor="image" className="text-sm font-medium block mb-2">
                    Imagem da obra
                  </label>
                  <div className="flex items-center gap-4">
                    <label
                      htmlFor="image"
                      className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-muted transition-colors shadow-card"
                    >
                      <UploadCloud className="w-4 h-4" />
                      Escolher arquivo
                    </label>
                    <input
                      id="image"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    {image && <span className="text-sm text-muted-foreground">{image.name}</span>}
                  </div>
                  {imagePreview && (
                    <img src={imagePreview} alt="Pré-visualização" className="mt-4 max-h-64 rounded-lg shadow-card" />
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título da obra</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subtitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título original / subtítulo (opcional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="artistName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Artista (opcional)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ano (opcional)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Localização (opcional)</FormLabel>
                      <FormDescription>Ex.: "Museu do Louvre, Paris, França"</FormDescription>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sourceUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link da fonte (opcional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição (opcional)</FormLabel>
                      <FormControl>
                        <Textarea rows={4} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="gradient-card border-0">
              <CardHeader>
                <CardTitle className="text-lg">Referência bíblica (opcional)</CardTitle>
                <CardDescription>
                  Se você souber a passagem exata que a obra retrata, ótimo — se não souber, deixe em
                  branco, o revisor confirma isso antes de publicar.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="suggestedBook"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Livro</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex.: João" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="suggestedChapter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capítulo</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="suggestedVerses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Versículo(s)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex.: 17-18" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="md:col-span-2">
                  <FormField
                    control={form.control}
                    name="suggestedPassageText"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Texto da passagem</FormLabel>
                        <FormControl>
                          <Textarea rows={3} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <FormField
              control={form.control}
              name="rightsConfirmed"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-4 shadow-card">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Confirmo que tenho direito sobre esta imagem (sou o autor, ou ela é de domínio
                      público, ou tenho licença/autorização pra publicá-la aqui)
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            {submitError && (
              <Alert variant="destructive">
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full shadow-card" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Enviando...
                </>
              ) : (
                'Enviar pra revisão'
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              <Link to="/contribuir" className="underline">
                Voltar pra outras formas de contribuir
              </Link>
            </p>
          </form>
        </Form>
      </div>

      <Footer />
    </div>
  );
}
