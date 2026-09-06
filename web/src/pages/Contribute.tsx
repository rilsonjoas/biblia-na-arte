import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { PixDonationCard } from '@/components/apoiar/PixDonationCard';
import { Users, BookOpen, Heart, Mail, ArrowRight } from 'lucide-react';

export default function Contribute() {
  return (
    <div className="min-h-screen bg-background">
      {/* Sem <SEO>, a aba ficava com o título da última página com SEO
          visitada — achado real 2026-08-22. */}
      <SEO
        title="Como Contribuir"
        description="Envie uma obra pra Bíblia na Arte, fale direto com o curador ou apoie o projeto via Pix."
      />
      <Header />

      <div className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 shadow-golden">
            <Users className="w-4 h-4 mr-2" />
            Como Contribuir
          </Badge>

          <h1 className="text-display text-2xl sm:text-3xl md:text-4xl font-bold mb-6">
            Faça Parte do Projeto
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            A Bíblia na Arte é um projeto pessoal: uma pessoa só cuida da
            curadoria, do código e do conteúdo. Três formas simples de
            contribuir — sugerir uma obra, falar direto com o curador, ou
            apoiar com um Pix.
          </p>
        </div>

        {/* Sugerir Obras — ação principal, destacada */}
        <Card className="max-w-2xl mx-auto mb-8 gradient-card border-0 shadow-classical">
          <CardContent className="p-8 text-center">
            <div className="w-14 h-14 mx-auto gradient-hero rounded-lg flex items-center justify-center mb-4 shadow-golden">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-display text-xl sm:text-2xl font-bold mb-3">
              Sugerir uma Obra
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Conhece alguma pintura inspirada na Bíblia que ainda não está no
              acervo? Envie direto pelo formulário, com imagem e tudo — o
              curador revisa fonte, licença e referência bíblica antes de
              publicar.
            </p>
            <Button size="lg" className="shadow-golden" asChild>
              <Link to="/contribuir/enviar-obra">
                Enviar obra
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Fale com o projeto + Pix, lado a lado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-12 items-start">
          <Card className="gradient-card border-0">
            <CardHeader>
              <CardTitle className="text-display text-lg flex items-center">
                <Mail className="w-5 h-5 mr-2 text-primary" />
                Fale com o Projeto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4 text-sm">
                Pesquisa, revisão de conteúdo, proposta de artigo ou correção —
                o canal é direto, por e-mail.
              </p>
              <Button variant="outline" className="w-full" asChild>
                <a href="mailto:biblianaarte@narniano.com">
                  biblianaarte@narniano.com
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className="gradient-card border-0">
            <CardHeader>
              <CardTitle className="text-display text-lg flex items-center">
                <Heart className="w-5 h-5 mr-2 text-accent" />
                Apoie via Pix
              </CardTitle>
            </CardHeader>
            <CardContent>
              <PixDonationCard />
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
