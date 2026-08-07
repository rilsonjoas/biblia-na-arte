export interface BibleBookDescription {
  slug: string
  name: string
  testament: 'old' | 'new'
  description: string
  keyThemes: string[]
  famousPassages: string[]
  artisticSignificance: string
  historicalContext: string
}

export const bibleDescriptions: BibleBookDescription[] = [
  // Antigo Testamento
  {
    slug: 'genesis',
    name: 'Gênesis',
    testament: 'old',
    description: 'O primeiro livro da Bíblia narra as origens do universo, da humanidade e do povo de Israel. Desde a criação até as histórias dos patriarcas, Gênesis estabelece os fundamentos da fé bíblica.',
    keyThemes: ['Criação', 'Queda', 'Aliança', 'Promessa', 'Redenção'],
    famousPassages: ['A Criação (1:1-31)', 'Adão e Eva (2:4-3:24)', 'O Dilúvio (6:9-9:17)', 'A Torre de Babel (11:1-9)', 'O Sacrifício de Isaque (22:1-19)'],
    artisticSignificance: 'Inspirou incontáveis obras de arte, desde a Capela Sistina de Michelangelo até pinturas modernas da criação e do jardim do Éden.',
    historicalContext: 'Tradicionalmente atribuído a Moisés, estabelece a cosmovisão judaico-cristã e os primórdios da história da salvação.'
  },
  {
    slug: 'exodus',
    name: 'Êxodo',
    testament: 'old',
    description: 'Relata a libertação dos israelitas da escravidão no Egito, a entrega da Lei no Monte Sinai e a construção do Tabernáculo. É o livro da liberdade e da aliança.',
    keyThemes: ['Libertação', 'Lei', 'Aliança', 'Adoração', 'Presença Divina'],
    famousPassages: ['A Sarça Ardente (3:1-15)', 'As Dez Pragas (7:14-12:30)', 'A Páscoa (12:1-28)', 'Os Dez Mandamentos (20:1-17)', 'O Bezerro de Ouro (32:1-35)'],
    artisticSignificance: 'Tema central em pinturas épicas sobre a travessia do Mar Vermelho e representações dramáticas das pragas do Egito.',
    historicalContext: 'Documenta a formação de Israel como nação e estabelece as bases legais e litúrgicas do judaísmo.'
  },
  {
    slug: 'levitico',
    name: 'Levítico',
    testament: 'old',
    description: 'Manual de santidade que detalha as leis cerimoniais, os sacrifícios e as festas religiosas de Israel. Enfatiza a separação entre o sagrado e o profano.',
    keyThemes: ['Santidade', 'Sacrifício', 'Purificação', 'Sacerdócio', 'Separação'],
    famousPassages: ['O Dia da Expiação (16:1-34)', 'O Código de Santidade (19:1-37)', 'As Festas do Senhor (23:1-44)'],
    artisticSignificance: 'Influenciou representações artísticas do Templo, rituais de sacrifício e simbolismo religioso na arte sacra.',
    historicalContext: 'Estabelece o sistema sacrificial que apontava para Cristo e regula a vida religiosa de Israel.'
  },
  {
    slug: 'numeros',
    name: 'Números',
    testament: 'old',
    description: 'Narra os 40 anos de peregrinação de Israel no deserto, incluindo censos, leis e a preparação para entrar na Terra Prometida.',
    keyThemes: ['Peregrinação', 'Fidelidade', 'Rebelião', 'Disciplina', 'Esperança'],
    famousPassages: ['Os Espias (13:1-14:45)', 'A Serpente de Bronze (21:4-9)', 'A Bênção de Balaão (24:15-19)'],
    artisticSignificance: 'Inspirou obras sobre a jornada no deserto e a serpente de bronze, símbolo profético de Cristo.',
    historicalContext: 'Documenta as dificuldades e disciplinas necessárias para transformar escravos em uma nação.'
  },
  {
    slug: 'deuteronomio',
    name: 'Deuteronômio',
    testament: 'old',
    description: 'Os últimos discursos de Moisés ao povo de Israel antes de sua morte, reiterando a Lei e preparando a nova geração para a conquista de Canaã.',
    keyThemes: ['Obediência', 'Lembrança', 'Escolha', 'Bênção', 'Liderança'],
    famousPassages: ['O Grande Mandamento (6:4-9)', 'As Bênçãos e Maldições (28:1-68)', 'A Morte de Moisés (34:1-12)'],
    artisticSignificance: 'Representações artísticas da morte de Moisés e das últimas instruções ao povo escolhido.',
    historicalContext: 'Último livro do Pentateuco, estabelece os princípios para a vida na Terra Prometida.'
  },
  
  // Novo Testamento
  {
    slug: 'matthew',
    name: 'Mateus',
    testament: 'new',
    description: 'O primeiro Evangelho apresenta Jesus como o Messias prometido, cumprindo as profecias do Antigo Testamento. Escrito especialmente para leitores judeus.',
    keyThemes: ['Messias', 'Reino dos Céus', 'Cumprimento', 'Ensinamento', 'Grande Comissão'],
    famousPassages: ['O Nascimento de Jesus (1:18-2:23)', 'O Sermão da Montanha (5:1-7:29)', 'As Parábolas do Reino (13:1-58)', 'A Grande Comissão (28:16-20)'],
    artisticSignificance: 'Fonte de inúmeras representações artísticas da Natividade, Sermão da Montanha e cenas da vida de Cristo.',
    historicalContext: 'Escrito por volta de 70-80 d.C., conecta o Antigo e Novo Testamentos mostrando Jesus como o Cristo esperado.'
  },
  {
    slug: 'mark',
    name: 'Marcos',
    testament: 'new',
    description: 'O Evangelho mais conciso e dinâmico, apresenta Jesus como o Servo sofredor. Enfatiza as ações de Jesus mais do que seus discursos.',
    keyThemes: ['Servir', 'Sofrer', 'Segredo Messiânico', 'Discipulado', 'Cruz'],
    famousPassages: ['O Batismo de Jesus (1:9-11)', 'A Transfiguração (9:2-13)', 'A Paixão e Crucificação (14:1-15:47)', 'A Ressurreição (16:1-8)'],
    artisticSignificance: 'Inspirou representações dramáticas da crucificação e ressurreição, enfatizando o sofrimento redentor.',
    historicalContext: 'Provavelmente o primeiro Evangelho escrito (65-70 d.C.), baseado no testemunho de Pedro.'
  },
  {
    slug: 'luke',
    name: 'Lucas',
    testament: 'new',
    description: 'O Evangelho da compaixão, apresenta Jesus como o Salvador universal. Enfatiza o cuidado de Jesus pelos marginalizados e pobres.',
    keyThemes: ['Compaixão', 'Salvação Universal', 'Oração', 'Espírito Santo', 'Alegria'],
    famousPassages: ['A Anunciação (1:26-38)', 'O Nascimento de Jesus (2:1-20)', 'O Bom Samaritano (10:25-37)', 'O Filho Pródigo (15:11-32)'],
    artisticSignificance: 'Fonte de algumas das mais belas representações artísticas da Anunciação e Natividade na arte cristã.',
    historicalContext: 'Escrito por Lucas, médico e companheiro de Paulo, oferece o relato mais detalhado da infância de Jesus.'
  },
  {
    slug: 'john',
    name: 'João',
    testament: 'new',
    description: 'O Evangelho mais teológico, apresenta Jesus como o Filho de Deus e o Verbo eterno. Enfatiza a divindade de Cristo e a vida eterna.',
    keyThemes: ['Vida Eterna', 'Amor', 'Luz', 'Verdade', 'Divindade de Cristo'],
    famousPassages: ['O Verbo se fez Carne (1:1-18)', 'Nicodemos (3:1-21)', 'A Mulher Samaritana (4:1-42)', 'A Última Ceia (13:1-17:26)'],
    artisticSignificance: 'Inspirou representações místicas e teológicas profundas na arte cristã, especialmente sobre a natureza divina de Cristo.',
    historicalContext: 'Escrito pelo apóstolo João no final do século I, oferece uma perspectiva única sobre a identidade de Jesus.'
  },
  
  {
    slug: 'psalms',
    name: 'Salmos',
    testament: 'old',
    description: 'A maior coleção de poesia e hinos da Bíblia, expressando toda a gama de emoções humanas na presença de Deus. Uma fonte inesgotável de inspiração espiritual.',
    keyThemes: ['Adoração', 'Lamento', 'Louvor', 'Confiança', 'Justiça'],
    famousPassages: ['O Senhor é Meu Pastor (23:1-6)', 'As Profundezas do Mal (51:1-19)', 'Ao Senhor Pertence a Terra (24:1-10)', 'Bem-aventurado o Homem (1:1-6)'],
    artisticSignificance: 'Inspirou incontáveis composições musicais, desde cantos gregorianos até obras clássicas e contemporâneas.',
    historicalContext: 'Coleção de 150 salmos, muitos atribuídos ao rei Davi, usados na adoração do Templo e vida devocional.'
  },
  {
    slug: 'proverbs',
    name: 'Provérbios',
    testament: 'old',
    description: 'Manual de sabedoria prática para a vida, contendo máximas e ensinamentos sobre como viver de forma piedosa e inteligente no mundo.',
    keyThemes: ['Sabedoria', 'Disciplina', 'Temor do Senhor', 'Família', 'Trabalho'],
    famousPassages: ['O Temor do Senhor (9:10)', 'A Mulher Virtuosa (31:10-31)', 'Confia no Senhor (3:5-6)', 'O Caminho da Sabedoria (4:5-9)'],
    artisticSignificance: 'Influenciou representações artísticas da sabedoria personificada e cenas da vida familiar virtuosa.',
    historicalContext: 'Principalmente atribuído ao rei Salomão, representa a tradição sapiencial de Israel.'
  },
  {
    slug: 'isaiah',
    name: 'Isaías',
    testament: 'old',
    description: 'O maior dos profetas, contendo algumas das mais belas profecias messiânicas e visões da glória de Deus. Conhecido como "o quinto Evangelho".',
    keyThemes: ['Messias', 'Salvação', 'Santo de Israel', 'Justiça', 'Esperança'],
    famousPassages: ['O Emanuel (7:14)', 'O Servo Sofredor (53:1-12)', 'Novos Céus e Nova Terra (65:17-25)', 'A Vocação de Isaías (6:1-13)'],
    artisticSignificance: 'Fonte de imagens poderosas na arte cristã, especialmente as profecias messiânicas e visões celestiais.',
    historicalContext: 'Profetizou durante os reinados de quatro reis de Judá (740-680 a.C.), em tempos de crise nacional.'
  },
  
  // Mais livros do Novo Testamento...
  {
    slug: 'atos',
    name: 'Atos',
    testament: 'new',
    description: 'A continuação do Evangelho de Lucas, narrando o nascimento e crescimento da Igreja primitiva através do poder do Espírito Santo.',
    keyThemes: ['Espírito Santo', 'Missões', 'Igreja', 'Testemunho', 'Perseguição'],
    famousPassages: ['Pentecostes (2:1-31)', 'A Conversão de Paulo (9:1-19)', 'O Concílio de Jerusalém (15:1-35)', 'Paulo em Atenas (17:16-34)'],
    artisticSignificance: 'Inspirou representações dramáticas de Pentecostes, conversão de Paulo e cenas missionárias.',
    historicalContext: 'Documenta os primeiros 30 anos da Igreja cristã e a expansão do Evangelho pelo mundo romano.'
  },
  {
    slug: 'romanos',
    name: 'Romanos',
    testament: 'new',
    description: 'A exposição mais sistemática da doutrina cristã na Bíblia. Paulo explica a salvação pela fé e a vida cristã transformada.',
    keyThemes: ['Justificação', 'Fé', 'Graça', 'Lei', 'Santificação'],
    famousPassages: ['Todos Pecaram (3:21-26)', 'Justificação pela Fé (5:1-11)', 'Vida no Espírito (8:1-39)', 'A Soberania de Deus (9:1-11:36)'],
    artisticSignificance: 'Influenciou profundamente a teologia cristã e inspirou obras sobre temas de redenção e graça.',
    historicalContext: 'Carta de Paulo à igreja de Roma (57 d.C.), estabelecendo fundamentos teológicos do cristianismo.'
  },
  {
    slug: 'apocalipse',
    name: 'Apocalipse',
    testament: 'new',
    description: 'A revelação profética final da Bíblia, mostrando a vitória definitiva de Cristo e o estabelecimento de novos céus e nova terra.',
    keyThemes: ['Revelação', 'Vitória', 'Juízo', 'Esperança', 'Nova Criação'],
    famousPassages: ['A Visão de Cristo Glorificado (1:12-20)', 'As Sete Igrejas (2:1-3:22)', 'O Trono no Céu (4:1-5:14)', 'A Nova Jerusalém (21:1-22:5)'],
    artisticSignificance: 'Fonte de algumas das imagens mais poderosas da arte cristã, desde os Quatro Cavaleiros até a Nova Jerusalém.',
    historicalContext: 'Escrito por João durante o exílio em Patmos (90-95 d.C.), oferecendo esperança à Igreja perseguida.'
  }
]