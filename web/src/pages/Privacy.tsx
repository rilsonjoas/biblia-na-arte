import { Link } from 'react-router';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Shield } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 shadow-golden">
            <Shield className="w-4 h-4 mr-2" />
            Política de Privacidade
          </Badge>
          <h1 className="text-display text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
            Política de Privacidade e Cookies
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Última atualização: 22 de agosto de 2026.
          </p>
        </div>

        <Card className="gradient-card border-0 max-w-3xl mx-auto">
          <CardContent className="p-6 md:p-10 space-y-8 text-foreground/80 leading-relaxed">
            <section>
              <h2 className="text-display text-xl font-semibold mb-3 text-foreground">
                1. Introdução
              </h2>
              <p>
                A <strong>Bíblia na Arte</strong> respeita sua privacidade e está comprometida
                em proteger seus dados pessoais. Esta política descreve como coletamos, usamos
                e protegemos suas informações quando você utiliza nosso site.
              </p>
            </section>

            <section>
              <h2 className="text-display text-xl font-semibold mb-3 text-foreground">
                2. Dados que coletamos
              </h2>
              <p className="mb-3">Podemos coletar os seguintes tipos de informações:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Dados de uso:</strong> páginas visitadas, obras e livros bíblicos
                  consultados, tempo de permanência e termos buscados.
                </li>
                <li>
                  <strong>Dados técnicos:</strong> endereço IP, tipo de navegador, sistema
                  operacional, provedor de internet e informações do dispositivo.
                </li>
                <li>
                  <strong>Preferências:</strong> configurações como tema (claro/escuro/sistema)
                  armazenadas localmente no seu navegador.
                </li>
              </ul>
              <p className="mt-3">
                <strong>Importante:</strong> não exigimos cadastro para navegar, buscar ou ler o
                catálogo. Não coletamos dados pessoais além do que é gerado automaticamente pelo
                seu navegador ao acessar o site.
              </p>
            </section>

            <section>
              <h2 className="text-display text-xl font-semibold mb-3 text-foreground">
                3. Cookies e tecnologias similares
              </h2>
              <p className="mb-3">Utilizamos cookies e tecnologias similares para:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Cookies essenciais:</strong> necessários para o funcionamento básico
                  do site, como salvar sua preferência de tema.
                </li>
                <li>
                  <strong>Cookies de publicidade:</strong> utilizados por parceiros de
                  publicidade (Google AdSense) para exibir anúncios relevantes com base nos
                  seus interesses.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-display text-xl font-semibold mb-3 text-foreground">
                4. Google AdSense e publicidade
              </h2>
              <p className="mb-3">
                Este site utiliza o Google AdSense para exibir anúncios. O Google e seus
                parceiros podem usar cookies para exibir anúncios com base em visitas anteriores
                a este ou outros sites. Isso ajuda a manter o projeto gratuito e sustentável.
              </p>
              <p>
                Você pode desativar a publicidade personalizada visitando as{' '}
                <a
                  href="https://www.google.com/settings/ads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Configurações de Anúncios do Google
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-display text-xl font-semibold mb-3 text-foreground">
                5. Doações via Pix
              </h2>
              <p>
                A página <Link to="/contribuir" className="text-primary hover:underline">Como
                Contribuir</Link> oferece um código Pix estático (gerado localmente, sem
                intermediário) para quem deseja apoiar o projeto. O pagamento em si é processado
                inteiramente pelo seu banco — não temos acesso a dados de pagamento, e o
                site não armazena nem transmite nenhuma informação da doação.
              </p>
            </section>

            <section>
              <h2 className="text-display text-xl font-semibold mb-3 text-foreground">
                6. Seus direitos (LGPD)
              </h2>
              <p className="mb-3">
                De acordo com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018),
                você tem os seguintes direitos:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Confirmar a existência de tratamento de dados</li>
                <li>Acessar seus dados pessoais</li>
                <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
                <li>Solicitar a anonimização, bloqueio ou eliminação de dados</li>
                <li>Revogar o consentimento a qualquer momento</li>
                <li>Solicitar a portabilidade dos dados</li>
              </ul>
            </section>

            <section>
              <h2 className="text-display text-xl font-semibold mb-3 text-foreground">
                7. Como gerenciar cookies
              </h2>
              <p>
                Você pode gerenciar ou desativar cookies através das configurações do seu
                navegador. Note que desativar certos cookies pode afetar a funcionalidade do
                site ou a personalização dos anúncios exibidos.
              </p>
            </section>

            <section>
              <h2 className="text-display text-xl font-semibold mb-3 text-foreground">
                8. Alterações nesta política
              </h2>
              <p>
                Podemos atualizar esta política periodicamente. Recomendamos revisar esta página
                de tempos em tempos para se manter informado sobre como protegemos suas
                informações.
              </p>
            </section>

            <section>
              <h2 className="text-display text-xl font-semibold mb-3 text-foreground">
                9. Contato
              </h2>
              <p>
                Dúvidas sobre esta Política de Privacidade ou sobre o tratamento de dados podem
                ser enviadas para{' '}
                <a
                  href="mailto:biblianaarte@narniano.com"
                  className="text-primary hover:underline"
                >
                  biblianaarte@narniano.com
                </a>
                .
              </p>
            </section>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
          <Link to="/" className="text-primary hover:underline text-sm">
            ← Voltar para o início
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
