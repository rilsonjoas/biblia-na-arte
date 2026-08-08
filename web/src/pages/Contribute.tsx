import { Link } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  Users, 
  BookOpen, 
  Search, 
  Edit, 
  Share, 
  Heart, 
  Mail, 
  ExternalLink,
  CheckCircle
} from 'lucide-react';

export default function Contribute() {
  const contributionTypes = [
    {
      icon: BookOpen,
      title: "Sugerir Obras",
      description: "Conhece alguma pintura, música ou filme inspirado na Bíblia que ainda não está em nossa coleção?",
      action: "Envie suas sugestões",
      difficulty: "Fácil"
    },
    {
      icon: Search,
      title: "Pesquisa e Curadoria",
      description: "Ajude-nos a pesquisar informações detalhadas sobre obras de arte e suas conexões bíblicas.",
      action: "Participar da pesquisa",
      difficulty: "Médio"
    },
    {
      icon: Edit,
      title: "Revisão de Conteúdo",
      description: "Revise descrições, corrija informações e ajude a manter a qualidade do conteúdo.",
      action: "Tornar-se revisor",
      difficulty: "Médio"
    },
    {
      icon: Share,
      title: "Compartilhar Conhecimento",
      description: "Escreva artigos, análises ou estudos sobre arte bíblica para nossa comunidade.",
      action: "Contribuir com artigos",
      difficulty: "Avançado"
    }
  ];

  const guidelines = [
    {
      icon: CheckCircle,
      title: "Fidelidade Bíblica",
      description: "Todas as obras devem ter uma conexão clara e autêntica com as Escrituras Sagradas."
    },
    {
      icon: CheckCircle,
      title: "Qualidade Artística",
      description: "Priorizamos obras de reconhecido valor artístico e histórico."
    },
    {
      icon: CheckCircle,
      title: "Domínio Público",
      description: "Preferimos obras em domínio público ou com licenças adequadas para uso educativo."
    },
    {
      icon: CheckCircle,
      title: "Documentação Completa",
      description: "Cada obra deve vir acompanhada de informações precisas sobre autor, data e contexto."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        {/* Header Section */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4 shadow-golden">
            <Users className="w-4 h-4 mr-2" />
            Como Contribuir
          </Badge>
          
          <h1 className="text-display text-3xl md:text-4xl font-bold mb-6">
            Faça Parte da Nossa Missão
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            O BiblianaArte.com é um projeto colaborativo. Sua participação é fundamental 
            para enriquecer nossa coleção e fortalecer a conexão entre fé e arte.
          </p>
        </div>

        {/* Ways to Contribute */}
        <div className="mb-16">
          <h2 className="text-display text-2xl font-bold text-center mb-8">
            Formas de Contribuir
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {contributionTypes.map((type, index) => {
              const IconComponent = type.icon;
              return (
                <Card key={index} className="group hover:shadow-classical transition-all duration-300 hover:-translate-y-1 gradient-card border-0">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-12 h-12 gradient-hero rounded-lg flex items-center justify-center group-hover:shadow-golden transition-all duration-300">
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {type.difficulty}
                      </Badge>
                    </div>
                    <CardTitle className="text-display text-lg">
                      {type.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      {type.description}
                    </p>
                    <Button variant="outline" size="sm" className="w-full">
                      {type.action}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Guidelines */}
        <div className="mb-16">
          <h2 className="text-display text-2xl font-bold text-center mb-8">
            Diretrizes para Contribuições
          </h2>
          
          <Card className="gradient-card border-0">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {guidelines.map((guideline, index) => {
                  const IconComponent = guideline.icon;
                  return (
                    <div key={index} className="flex items-start space-x-3">
                      <IconComponent className="w-5 h-5 mt-1 text-accent flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-2">{guideline.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {guideline.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Process Section */}
        <div className="mb-16">
          <h2 className="text-display text-2xl font-bold text-center mb-8">
            Como Funciona o Processo
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center gradient-card border-0">
              <CardHeader>
                <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-display">1. Envie sua Contribuição</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Entre em contato conosco através do formulário ou email com 
                  sua sugestão, pesquisa ou artigo.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center gradient-card border-0">
              <CardHeader>
                <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 text-accent" />
                </div>
                <CardTitle className="text-display">2. Revisão e Curadoria</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Nossa equipe de curadores revisará sua contribuição para 
                  garantir qualidade e fidelidade às diretrizes.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center gradient-card border-0">
              <CardHeader>
                <div className="w-16 h-16 mx-auto bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-display">3. Publicação</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Uma vez aprovada, sua contribuição será incorporada ao site 
                  com os devidos créditos.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Community Section */}
        <Card className="gradient-card border-0 mb-16">
          <CardContent className="p-8 text-center">
            <h2 className="text-display text-2xl font-bold mb-4">
              Junte-se à Nossa Comunidade
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Conecte-se com outros entusiastas de arte bíblica, participe de discussões 
              e acompanhe as novidades do projeto.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="outline" className="shadow-card">
                <a href="mailto:contato@biblianaarte.com" className="flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  contato@biblianaarte.com
                </a>
              </Button>
              <Button asChild variant="outline" className="shadow-card">
                <Link to="/sobre">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Saiba Mais sobre o Projeto
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recognition Section */}
        <div className="text-center">
          <h2 className="text-display text-2xl font-bold mb-4 flex items-center justify-center">
            <Heart className="w-6 h-6 mr-3 text-accent" />
            Reconhecimento dos Colaboradores
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Todos os colaboradores recebem créditos apropriados por suas contribuições, 
            e os principais contribuidores são destacados em nossa página de agradecimentos.
          </p>
          
          <div className="bg-muted/30 rounded-lg p-6 max-w-lg mx-auto">
            <p className="text-sm text-muted-foreground italic">
              "Cada contribuição, por menor que seja, ajuda a preservar e compartilhar 
              o rico patrimônio da arte bíblica para as futuras gerações."
            </p>
            <p className="text-sm font-medium mt-2">— Equipe BiblianaArte.com</p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}