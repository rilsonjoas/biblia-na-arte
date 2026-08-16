import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Book, Heart, Users, Target, Lightbulb, Globe } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4 shadow-golden">
            <Book className="w-4 h-4 mr-2" />
            Sobre o Projeto
          </Badge>
          
          <h1 className="text-display text-3xl md:text-4xl font-bold mb-6">
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
              <h2 className="text-display text-2xl font-bold mb-4 flex items-center">
                <Heart className="w-6 h-6 mr-3 text-accent" />
                Nossa Missão
              </h2>
              <p className="text-foreground/80 leading-relaxed mb-4">
                A Bíblia na Arte nasceu da paixão por descobrir como a Palavra de Deus 
                inspirou os maiores artistas da humanidade. Nosso objetivo é criar pontes 
                entre a fé ancestral e a expressão artística, oferecendo uma experiência 
                contemplativa e educativa única.
              </p>
              <p className="text-foreground/80 leading-relaxed">
                Acreditamos que cada pintura, música e filme inspirado nas Escrituras 
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
                  <p className="text-sm text-muted-foreground">
                    Catalogar e preservar obras de arte inspiradas nas Escrituras.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Users className="w-5 h-5 mt-1 text-accent" />
                <div>
                  <h4 className="font-semibold mb-1">Educar e Inspirar</h4>
                  <p className="text-sm text-muted-foreground">
                    Promover compreensão profunda da Bíblia através da arte.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <Lightbulb className="w-5 h-5 mt-1 text-accent" />
                <div>
                  <h4 className="font-semibold mb-1">Conectar Gerações</h4>
                  <p className="text-sm text-muted-foreground">
                    Aproximar tradições antigas das expressões contemporâneas.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <h2 className="text-display text-2xl font-bold text-center mb-8">
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
          <CardContent className="p-8">
            <h2 className="text-display text-2xl font-bold mb-6 text-center">
              Como Tudo Começou
            </h2>
            
            <div className="prose prose-lg mx-auto text-foreground/80 leading-relaxed">
              <p className="mb-4">
                A ideia da Bíblia na Arte surgiu durante uma visita à Capela Sistina, 
                quando observávamos as obras-primas de Michelangelo. Ali, rodeados por 
                séculos de arte inspirada nas Escrituras, percebemos quão rica e 
                profunda é a relação entre a Bíblia and a expressão artística.
              </p>
              
              <p className="mb-4">
                Descobrimos que muitas pessoas, mesmo aquelas que apreciam arte ou 
                estudam a Bíblia, desconhecem as intrincadas conexões entre essas duas 
                dimensões da experiência humana. Assim nasceu nossa missão: criar uma 
                ponte entre esses mundos, oferecendo uma plataforma onde qualquer pessoa 
                possa explorar e descobrir essas conexões sagradas.
              </p>
              
              <p>
                Hoje, a Bíblia na Arte continua crescendo, sempre com o objetivo de 
                preservar, educar e inspirar. Cada obra adicionada à nossa coleção é 
                cuidadosamente pesquisada e contextualizada, garantindo que nossa 
                comunidade tenha acesso ao melhor conteúdo sobre arte bíblica.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-display text-2xl font-bold mb-4">
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