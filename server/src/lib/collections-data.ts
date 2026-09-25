export interface ThematicCollectionDefinition {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  coverImage?: string;
  bookSlugs?: string[];
  themeSlugs?: string[];
  keywords?: string[];
}

export const THEMATIC_COLLECTIONS: ThematicCollectionDefinition[] = [
  {
    slug: 'vida-de-cristo',
    title: 'A Vida de Cristo',
    subtitle: 'Dos Evangelhos à Glória',
    description:
      'Uma jornada visual e contemplativa pelos principais momentos do ministério de Jesus Cristo: desde a Natividade e o Batismo até os Milagres, Ensinos e a Transfiguração.',
    coverImage: '/images/rembrandt-van-rijn-a-ceia-em-emaus.webp',
    themeSlugs: [
      'vida-de-cristo',
      'nascimento-de-jesus',
      'natividade',
      'batismo',
      'milagre',
      'transfiguracao',
      'anunciacao',
      'tentacao',
      'adoracao-dos-magos',
      'fuga-para-o-egito',
      'ressurreicao-de-lazaro',
      'entrada-triunfal',
    ],
  },
  {
    slug: 'parabolas-de-jesus',
    title: 'As Parábolas de Jesus',
    subtitle: 'O Reino de Deus em Imagens e Narrativas',
    description:
      'Explore como grandes mestres da arte retrataram as parábolas bíblicas: O Bom Samaritano, O Filho Pródigo, O Semeador, As Dez Virgens e a Ovelha Perdida.',
    coverImage: '/images/aime-morot-o-bom-samaritano.webp',
    themeSlugs: [
      'parabola',
      'parabolas',
      'bom-samaritano',
      'filho-prodigo',
      'semeador',
      'trabalhadores-na-vinha',
      'rico-insensato',
      'ovelha-perdida',
      'talentos',
      'dez-virgens',
      'fariseu-e-o-publicano',
      'joio-e-o-trigo',
      'dracma-perdida',
      'perola',
      'grande-banquete',
    ],
  },
  {
    slug: 'genesis-e-criacao',
    title: 'Gênesis e as Origens',
    subtitle: 'Da Criação do Cosmos aos Patriarcas',
    description:
      'A majestade da Criação, o Éden, a Queda, o Dilúvio de Noé e a fé de Abraão, Isaque e Jacó retratados em pinturas clássicas e gravuras de mestres.',
    coverImage: '/images/michelangelo-a-criacao-de-adao.webp',
    bookSlugs: ['genesis'],
  },
  {
    slug: 'paixao-e-ressurreicao',
    title: 'A Paixão e a Ressurreição',
    subtitle: 'A Cruz, o Sepulcro e a Vitória sobre a Morte',
    description:
      'O drama supremo da redenção: a Última Ceia, a agonia no Getsêmani, a Crucificação e a luz da Ressurreição na arte sacra ocidental.',
    coverImage: '/images/caravaggio-sepultamento-de-jesus.webp',
    themeSlugs: [
      'paixao',
      'paixao-de-cristo',
      'ultima-ceia',
      'getsemani',
      'crucificacao',
      'ressurreicao',
      'ecce-homo',
      'sepultamento',
      'flagelacao',
      'coroacao-de-espinhos',
      'descida-da-cruz',
      'via-sacra',
    ],
  },
  {
    slug: 'profetas-e-reis',
    title: 'Profetas e Reis de Israel',
    subtitle: 'Fé, Justiça e Aliança no Antigo Testamento',
    description:
      'Moisés no Sinai, as vitórias e salmos do Rei Davi, a sabedoria de Salomão e a voz corajosa dos profetas de Israel.',
    coverImage: '/images/rembrandt-van-rijn-moises-com-os-dez-mandamentos.webp',
    themeSlugs: [
      'moises',
      'davi',
      'salomao',
      'elias',
      'eliseu',
      'isaias',
      'jeremias',
      'daniel',
      'profeta',
      'profetas',
      'reis',
      'samuel',
      'ester',
      'jose',
    ],
  },
];
