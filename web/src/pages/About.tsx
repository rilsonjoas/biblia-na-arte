import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SEO } from '@/components/SEO';
import { Book, Heart, Users, Target, Lightbulb, Globe, Instagram, Library } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      {/* Sem <SEO> aqui, a aba do navegador ficava com o título da ÚLTIMA
          página visitada que tinha SEO (ex.: uma obra) — document.title é
          mutação direta, sem reset ao trocar de rota via SPA. Achado real
          2026-08-22 ("Sobre" mostrando o título de uma obra na aba). */}
      <SEO
        title="Sobre o Projeto"
        description="Conheça a história e a missão da Bíblia na Arte: conectar as Escrituras à expressão artística da humanidade ao longo dos séculos."
      />
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4 shadow-golden">
            <Book className="w-4 h-4 mr-2" />
            Sobre o Projeto
          </Badge>
          
          <h1 className="text-display text-2xl sm:text-3xl md:text-4xl font-bold mb-6">
            A História da Bíblia na Arte
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Descobrindo as conexões sagradas entre a Palavra de Deus e a expressão 
            artística da humanidade através dos séculos.
          </p>
        </div>

        {/* Mission Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div className="space-y-6">
            <div>
              <h2 className="text-display text-2xl sm:text-3xl font-bold mb-4 flex items-center">
                <Heart className="w-6 h-6 mr-3 text-accent" />
                Nossa Missão
              </h2>
              <p className="text-foreground/80 leading-relaxed mb-4">
                Nossa missão é criar pontes entre as Escrituras e a expressão 
                artística da humanidade, oferecendo uma experiência contemplativa 
                e educativa única: buscar uma passagem bíblica e encontrar as 
                obras que ela inspirou ao longo dos séculos.
              </p>
              <p className="text-foreground/80 leading-relaxed">
                Acreditamos que cada pintura inspirada nas Escrituras 
                não é apenas uma obra de arte, mas uma janela para compreender como 
                diferentes culturas e épocas interpretaram as verdades eternas da Bíblia.
              </p>
            </div>
          </div>

          <Card className="gradient-card border-0">
            <CardHeader>
              <CardTitle className="text-display flex items-center">
                <Target className="w-5 h-5 mr-2 text-accent" />
                Nossos Objetivos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <Globe className="w-5 h-5 mt-1 text-accent" />
                <div>
                  <h4 className="font-semibold mb-1">Preservar o Patrimônio</h4>
                  <p className="text-base text-muted-foreground">
                    Catalogar e preservar obras de arte inspiradas nas Escrituras.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Users className="w-5 h-5 mt-1 text-accent" />
                <div>
                  <h4 className="font-semibold mb-1">Educar e Inspirar</h4>
                  <p className="text-base text-muted-foreground">
                    Promover compreensão profunda da Bíblia através da arte.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Lightbulb className="w-5 h-5 mt-1 text-accent" />
                <div>
                  <h4 className="font-semibold mb-1">Conectar Gerações</h4>
                  <p className="text-base text-muted-foreground">
                    Aproximar tradições antigas das expressões contemporâneas.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <h2 className="text-display text-2xl sm:text-3xl font-bold text-center mb-8">
            Nossos Valores
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center gradient-card border-0">
              <CardHeader>
                <div className="w-16 h-16 mx-auto gradient-hero rounded-full flex items-center justify-center mb-4">
                  <Book className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-display">Fidelidade Bíblica</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Mantemos rigorosa fidelidade às Escrituras Sagradas em 
                  todas as conexões e interpretações apresentadas.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center gradient-card border-0">
              <CardHeader>
                <div className="w-16 h-16 mx-auto gradient-hero rounded-full flex items-center justify-center mb-4">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-display">Reverência Artística</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Tratamos cada obra de arte com o respeito e reverência 
                  que merece, honrando tanto o artista quanto a inspiração divina.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center gradient-card border-0">
              <CardHeader>
                <div className="w-16 h-16 mx-auto gradient-hero rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-display">Comunidade Inclusiva</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Acolhemos pessoas de todas as denominações e backgrounds, 
                  unidos pela apreciação da arte sacra e das Escrituras.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Story Section */}
        <Card className="gradient-card border-0 mb-16">
          <CardContent className="p-4 sm:p-8 md:p-12">
            <h2 className="text-display text-2xl sm:text-3xl font-bold mb-6 text-center">
              Como Tudo Começou
            </h2>
            
            <div className="prose prose-lg mx-auto text-foreground/80 leading-relaxed">
              <p className="mb-4">
                A Bíblia na Arte nasceu de uma paixão pessoal por arte bíblica — 
                paixão alimentada pela reflexão de pensadores como Hans Rookmaaker 
                e Alister McGrath, que exploraram com profundidade como a fé 
                cristã expande e enriquece a imaginação artística, a leitura das Escrituras 
                e a contemplação da beleza.
              </p>

              <blockquote className="border-l-4 border-accent/60 pl-6 my-6 italic text-foreground">
                "A arte não precisa de justificativa — nem por motivos 
                religiosos ou propósitos evangelísticos, nem por fins 
                econômicos ou políticos."
                <footer className="text-sm not-italic text-muted-foreground mt-2">
                  — Hans Rookmaaker, <em>A Arte Não Precisa de Justificativa</em> (1978)
                </footer>
              </blockquote>

              {/* Paráfrase, não citação direta — achado real 2026-08-23: a
                  frase entre aspas atribuída a McGrath não foi confirmada
                  textualmente contra a edição real do livro (princípio #3
                  do Padrão de Qualidade de Conteúdo). Diferente do
                  Rookmaaker acima (falecido, citação já verificada),
                  McGrath está vivo — atribuir palavra por palavra sem
                  checagem é o tipo de risco que o padrão existe pra
                  evitar. Sem aspas: credita a ideia geral, não finge
                  citação literal. */}
              <blockquote className="border-l-4 border-accent/60 pl-6 my-6 italic text-foreground">
                Alister McGrath argumenta, no mesmo espírito, que a fé cristã
                amplia nossa percepção da realidade — abrindo os olhos para
                uma beleza e uma glória que a arte, em sua melhor forma,
                torna visível.
                <footer className="text-sm not-italic text-muted-foreground mt-2">
                  — conforme discutido em <em>Enriching Our Vision of Reality</em> (2016)
                </footer>
              </blockquote>

              <p className="mb-4">
                Essa inquietação virou projeto primeiro no Instagram, com o{' '}
                <a
                  href="https://www.instagram.com/artecristadiaria/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1.5"
                >
                  <Instagram className="w-4 h-4 shrink-0" />
                  Arte Cristã Diária
                </a>{' '}
                — um museu devocional digital que transforma rolar o feed em 
                pausa, contemplação e adoração silenciosa: <em>Ora et 
                Contempla</em>, uma obra por dia, com contexto bíblico e 
                histórico na legenda. Foi ali que a curadoria ganhou método — 
                pesquisar cada pintura, verificar a referência bíblica, 
                contar a história por trás da obra.
              </p>

              <p>
                O site veio depois, como casa permanente desse acervo: um lugar 
                onde cada obra está ligada à passagem que a gerou, pesquisável 
                por livro, capítulo e tema. O que começou como um post por dia 
                hoje é uma biblioteca visual com centenas de obras — e continua 
                crescendo uma a uma, cada qual cuidadosamente pesquisada e 
                contextualizada.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* A Biblioteca — achado real 2026-08-22: a página não mencionava
            fazer parte do cluster narniano.com/a-biblioteca/. Texto abaixo
            reflete o que a própria página da Biblioteca diz ("salas de
            uma mesma casa", não uma lista genérica). */}
        <Card className="gradient-card border-0 mb-16">
          <CardContent className="p-8 text-center">
            <Library className="w-8 h-8 mx-auto mb-4 text-accent" />
            <h2 className="text-display text-2xl sm:text-3xl font-bold mb-4">
              Parte de Uma Biblioteca Maior
            </h2>
            <p className="text-foreground/80 leading-relaxed max-w-2xl mx-auto mb-6">
              A Bíblia na Arte integra{' '}
              <a
                href="https://www.narniano.com/a-biblioteca/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                A Biblioteca
              </a>
              , o conjunto de projetos do Narniano dedicados a preservar,
              traduzir e tornar acessível a herança escrita da fé cristã.
              Como a própria Biblioteca descreve: os projetos não competem
              entre si — são salas de uma mesma casa.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
              <a href="https://www.narniano.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                Narniano
              </a>
              <a href="https://cslewis.narniano.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                Gerador C.S. Lewis
              </a>
              <a href="https://lecionario.narniano.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                Lecionário
              </a>
              <a href="https://scriptorium.narniano.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                Scriptorium Divinum
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-display text-2xl sm:text-3xl font-bold mb-4">
            Faça Parte Desta Jornada
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Convidamos você a explorar nossa coleção, contribuir com seus conhecimentos 
            e compartilhar conosco o amor pela arte sacra e pelas Escrituras.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="shadow-classical">
              <Link to="/contribuir">
                <Users className="w-5 h-5 mr-2" />
                Como Contribuir
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="shadow-card">
              <Link to="/arte">
                <Book className="w-5 h-5 mr-2" />
                Explorar Coleção
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}