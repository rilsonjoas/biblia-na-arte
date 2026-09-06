import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { LoadingCard } from '@/components/ui/loading';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { listUsers, createPanelUser, deletePanelUser, AdminApiError } from '@/lib/admin-api';
import { ArrowLeft, UserPlus, Trash2 } from 'lucide-react';

const createUserFormSchema = z.object({
  email: z.string().trim().email('E-mail inválido'),
  password: z.string().min(12, 'Senha precisa ter pelo menos 12 caracteres'),
  role: z.enum(['admin', 'revisor']),
});

type CreateUserForm = z.infer<typeof createUserFormSchema>;

/** Gestão de usuários do painel (roadmap, 2026-09-06) — só admin
 *  (rota protegida com requireAdminRole em App.tsx). Sem edição de
 *  papel/senha de propósito: revogar acesso é apagar e recriar, menos
 *  superfície de erro pro volume de contas que esse painel vai ter
 *  (a promessa pro Efeito Prisma é justamente essa simplicidade — ver
 *  ROADMAP). */
export default function AdminUsers() {
  const { user: currentUser } = useAdminAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: listUsers,
  });

  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserFormSchema),
    defaultValues: { email: '', password: '', role: 'revisor' },
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateUserForm) => createPanelUser(input.email, input.password, input.role),
    onSuccess: () => {
      toast({ title: 'Usuário criado' });
      form.reset({ email: '', password: '', role: 'revisor' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (err) => {
      toast({
        title: 'Erro ao criar usuário',
        description: err instanceof AdminApiError ? err.message : undefined,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePanelUser(id),
    onSuccess: () => {
      toast({ title: 'Usuário apagado' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (err) => {
      toast({
        title: 'Erro ao apagar usuário',
        description: err instanceof AdminApiError ? err.message : undefined,
        variant: 'destructive',
      });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Usuários do Painel" />
      <Header />

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Link
          to="/admin/submissoes"
          className="inline-flex items-center text-sm text-muted-foreground mb-6 hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Voltar pra fila
        </Link>

        <h1 className="text-display text-2xl sm:text-3xl font-bold mb-2">Usuários do Painel</h1>
        <p className="text-muted-foreground mb-8">
          Quem tem acesso ao painel de revisão. Revogar acesso é apagar a conta abaixo — sem edição de
          papel ou senha, por simplicidade.
        </p>

        <Card className="gradient-card border-0 mb-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <UserPlus className="w-5 h-5 mr-2 text-primary" />
              Criar novo usuário
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={form.handleSubmit((data) => createMutation.mutate(data))}
              className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-4 items-start"
            >
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" {...form.register('email')} />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive mt-1">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" {...form.register('password')} />
                {form.formState.errors.password && (
                  <p className="text-xs text-destructive mt-1">{form.formState.errors.password.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="role">Papel</Label>
                <Select
                  defaultValue="revisor"
                  onValueChange={(v) => form.setValue('role', v as CreateUserForm['role'])}
                >
                  <SelectTrigger id="role" className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revisor">Revisor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={createMutation.isPending} className="self-end">
                Criar
              </Button>
            </form>
          </CardContent>
        </Card>

        {isLoading && <LoadingCard text="Carregando usuários..." />}

        {users && (
          <Card className="gradient-card border-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Desde</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>{u.role}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(u.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            disabled={u.id === currentUser?.id}
                            title={u.id === currentUser?.id ? 'Não é possível apagar a própria conta' : undefined}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Apagar {u.email}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Perde acesso ao painel imediatamente. Essa ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(u.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Apagar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      <Footer />
    </div>
  );
}
