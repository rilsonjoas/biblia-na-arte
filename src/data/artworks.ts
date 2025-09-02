import { Artwork } from '@/types';

export const artworks: Artwork[] = [
  {
    id: "michelangelo-creation-of-adam",
    title: "A Criação de Adão",
    artistOrDirector: "Michelangelo",
    year: "1508-1512",
    category: "painting",
    mediumOrGenre: "Afresco",
    imageUrl: "/src/assets/michelangelo-creation-adam.jpg",
    description: "Parte do teto da Capela Sistina, no Vaticano. Esta obra-prima representa o momento em que Deus dá vida a Adão, o primeiro homem. A composição icônica mostra as mãos quase se tocando, simbolizando a conexão entre o divino e o humano.",
    references: [
      { book: "Gênesis", bookSlug: "genesis", chapter: 1, verses: "26-27" },
      { book: "Gênesis", bookSlug: "genesis", chapter: 2, verses: "7" },
    ],
    sourceUrl: "https://pt.wikipedia.org/wiki/A_Cria%C3%A7%C3%A3o_de_Ad%C3%A3o",
    dimensionsOrDuration: "280 cm × 570 cm"
  },
  {
    id: "caravaggio-calling-of-saint-matthew",
    title: "A Vocação de São Mateus",
    artistOrDirector: "Caravaggio",
    year: "1599-1600",
    category: "painting",
    mediumOrGenre: "Óleo sobre tela",
    imageUrl: "/src/assets/caravaggio-calling-matthew.jpg",
    description: "Esta obra dramática captura o momento em que Jesus chama Mateus para segui-lo. Caravaggio usa sua técnica característica de chiaroscuro para criar um contraste poderoso entre luz e sombra, simbolizando a transformação espiritual.",
    references: [
      { book: "Mateus", bookSlug: "matthew", chapter: 9, verses: "9" },
      { book: "Marcos", bookSlug: "mark", chapter: 2, verses: "14" },
      { book: "Lucas", bookSlug: "luke", chapter: 5, verses: "27" },
    ],
    sourceUrl: "https://pt.wikipedia.org/wiki/A_Voca%C3%A7%C3%A3o_de_S%C3%A3o_Mateus",
    dimensionsOrDuration: "322 cm × 340 cm"
  },
  {
    id: "da-vinci-last-supper",
    title: "A Última Ceia",
    artistOrDirector: "Leonardo da Vinci",
    year: "1495-1498",
    category: "painting",
    mediumOrGenre: "Têmpera e óleo sobre gesso",
    imageUrl: "/src/assets/da-vinci-last-supper.jpg",
    description: "Uma das pinturas mais famosas do mundo, retratando o momento em que Jesus anuncia que um de seus discípulos irá traí-lo. A obra demonstra maestria na perspectiva e na expressão das emoções humanas.",
    references: [
      { book: "Mateus", bookSlug: "matthew", chapter: 26, verses: "20-25" },
      { book: "Marcos", bookSlug: "mark", chapter: 14, verses: "17-21" },
      { book: "Lucas", bookSlug: "luke", chapter: 22, verses: "14-23" },
      { book: "João", bookSlug: "john", chapter: 13, verses: "21-30" },
    ],
    sourceUrl: "https://pt.wikipedia.org/wiki/A_%C3%9Altima_Ceia_(Leonardo_da_Vinci)",
    dimensionsOrDuration: "460 cm × 880 cm"
  },
  {
    id: "durer-praying-hands",
    title: "Mãos em Oração",
    artistOrDirector: "Albrecht Dürer",
    year: "1508",
    category: "painting",
    mediumOrGenre: "Desenho a tinta sobre papel azul",
    imageUrl: "/src/assets/durer-praying-hands.jpg",
    description: "Este desenho tocante de mãos em oração tornou-se um símbolo universal da devoção cristã. Dürer capturou com precisão extraordinária a posição reverente das mãos unidas em súplica.",
    references: [
      { book: "Salmos", bookSlug: "psalms", chapter: 95, verses: "6" },
      { book: "1 Timóteo", bookSlug: "1-timothy", chapter: 2, verses: "8" },
    ],
    sourceUrl: "https://pt.wikipedia.org/wiki/M%C3%A3os_em_Ora%C3%A7%C3%A3o",
    dimensionsOrDuration: "29.1 cm × 19.7 cm"
  },
  {
    id: "el-greco-burial-count-orgaz",
    title: "O Enterro do Conde de Orgaz",
    artistOrDirector: "El Greco",
    year: "1586-1588",
    category: "painting",
    mediumOrGenre: "Óleo sobre tela",
    imageUrl: "/src/assets/el-greco-burial-orgaz.jpg",
    description: "Esta obra magistral divide-se em dois planos: o terrestre, com o enterro do conde, e o celestial, com a ascensão da alma. El Greco combina realismo e misticismo em uma composição única.",
    references: [
      { book: "1 Coríntios", bookSlug: "1-corinthians", chapter: 15, verses: "35-58" },
      { book: "2 Coríntios", bookSlug: "2-corinthians", chapter: 5, verses: "1-10" },
    ],
    sourceUrl: "https://pt.wikipedia.org/wiki/O_Enterro_do_Conde_de_Orgaz",
    dimensionsOrDuration: "480 cm × 360 cm"
  },
  {
    id: "veni-creator-spiritus",
    title: "Veni Creator Spiritus",
    artistOrDirector: "Tradicional (séc. IX)",
    year: "século IX",
    category: "music",
    mediumOrGenre: "Hino Litúrgico",
    embedUrl: "https://www.youtube.com/embed/aDyQxEp7iVE",
    description: "Hino litúrgico tradicional invocando o Espírito Santo. Esta composição gregoriana tem sido cantada há mais de mil anos em cerimônias importantes da Igreja, incluindo coroações papais e eleições.",
    references: [
      { book: "Atos", bookSlug: "acts", chapter: 2, verses: "1-4" },
      { book: "João", bookSlug: "john", chapter: 14, verses: "26" },
      { book: "Romanos", bookSlug: "romans", chapter: 8, verses: "26-27" },
    ],
    sourceUrl: "https://pt.wikipedia.org/wiki/Veni_Creator_Spiritus",
    dimensionsOrDuration: "~3 min"
  },
  {
    id: "bach-st-matthew-passion",
    title: "Paixão Segundo São Mateus",
    artistOrDirector: "Johann Sebastian Bach",
    year: "1727",
    category: "music",
    mediumOrGenre: "Oratório Sacro",
    embedUrl: "https://www.youtube.com/embed/ZwVW1ttVhuQ",
    description: "Uma das maiores obras da música sacra, narrando a Paixão de Cristo segundo o Evangelho de Mateus. Bach criou uma obra monumental que combina narrativa bíblica com profunda expressão musical.",
    references: [
      { book: "Mateus", bookSlug: "matthew", chapter: 26, verses: "6-75" },
      { book: "Mateus", bookSlug: "matthew", chapter: 27, verses: "1-66" },
    ],
    sourceUrl: "https://pt.wikipedia.org/wiki/Paix%C3%A3o_segundo_S%C3%A3o_Mateus",
    dimensionsOrDuration: "~3h 30min"
  },
  {
    id: "handel-messiah",
    title: "O Messias",
    artistOrDirector: "George Frideric Handel",
    year: "1741",
    category: "music",
    mediumOrGenre: "Oratório",
    embedUrl: "https://www.youtube.com/embed/IUZEtVbJT5c",
    description: "Oratório que narra a vida de Jesus Cristo, desde as profecias do Antigo Testamento até sua ressurreição. O famoso 'Aleluia' é uma das peças musicais mais reconhecidas do mundo.",
    references: [
      { book: "Isaías", bookSlug: "isaiah", chapter: 9, verses: "6" },
      { book: "Isaías", bookSlug: "isaiah", chapter: 53, verses: "3-5" },
      { book: "Lucas", bookSlug: "luke", chapter: 2, verses: "8-14" },
      { book: "1 Coríntios", bookSlug: "1-corinthians", chapter: 15, verses: "20-22" },
    ],
    sourceUrl: "https://pt.wikipedia.org/wiki/Messiah_(Handel)",
    dimensionsOrDuration: "~2h 30min"
  },
  {
    id: "rembrandt-return-prodigal-son",
    title: "O Retorno do Filho Pródigo",
    artistOrDirector: "Rembrandt van Rijn",
    year: "1661-1669",
    category: "painting",
    mediumOrGenre: "Óleo sobre tela",
    imageUrl: "/src/assets/rembrandt-prodigal-son.jpg",
    description: "Uma das obras mais tocantes de Rembrandt, retratando o momento de reconciliação entre pai e filho. A composição magistral usa luz e sombra para transmitir compaixão, perdão e amor incondicional paterno.",
    references: [
      { book: "Lucas", bookSlug: "luke", chapter: 15, verses: "11-32" }
    ],
    sourceUrl: "https://pt.wikipedia.org/wiki/O_Retorno_do_Filho_Pr%C3%B3digo",
    dimensionsOrDuration: "262 cm × 205 cm"
  },
  {
    id: "sistine-chapel-ceiling",
    title: "Teto da Capela Sistina",
    artistOrDirector: "Michelangelo",
    year: "1508-1512",
    category: "painting",
    mediumOrGenre: "Afresco",
    imageUrl: "/src/assets/sistine-chapel-ceiling.jpg",
    description: "Obra monumental que narra episódios do Antigo Testamento no teto da Capela Sistina. Inclui a famosa Criação de Adão e outros episódios bíblicos, demonstrando a genialidade de Michelangelo na representação da narrativa sagrada.",
    references: [
      { book: "Gênesis", bookSlug: "genesis", chapter: 1, verses: "1-31" },
      { book: "Gênesis", bookSlug: "genesis", chapter: 2, verses: "7" },
      { book: "Gênesis", bookSlug: "genesis", chapter: 3, verses: "1-24" }
    ],
    sourceUrl: "https://pt.wikipedia.org/wiki/Capela_Sistina",
    dimensionsOrDuration: "40,9 m × 13,4 m"
  },
  {
    id: "van-gogh-starry-night-over-rhone",
    title: "Noite Estrelada sobre o Ródano",
    artistOrDirector: "Vincent van Gogh",
    year: "1888",
    category: "painting",
    mediumOrGenre: "Óleo sobre tela",
    imageUrl: "/src/assets/van-gogh-starry-night.jpg",
    description: "Embora não explicitamente religiosa, esta obra captura a magnificência da criação divina. Van Gogh, profundamente religioso, via na natureza a manifestação de Deus, especialmente no céu noturno e nas estrelas.",
    references: [
      { book: "Gênesis", bookSlug: "genesis", chapter: 1, verses: "14-16" },
      { book: "Salmos", bookSlug: "psalms", chapter: 8, verses: "3-4" },
      { book: "Salmos", bookSlug: "psalms", chapter: 19, verses: "1" }
    ],
    sourceUrl: "https://pt.wikipedia.org/wiki/Noite_Estrelada_sobre_o_R%C3%B3dano",
    dimensionsOrDuration: "72,5 cm × 92 cm"
  },
  {
    id: "pergolesi-stabat-mater",
    title: "Stabat Mater",
    artistOrDirector: "Giovanni Battista Pergolesi",
    year: "1736",
    category: "music",
    mediumOrGenre: "Obra Coral Sacra",
    embedUrl: "https://www.youtube.com/embed/gczJp8RlWoE",
    description: "Uma das mais belas composições sobre o sofrimento de Maria aos pés da cruz. Esta obra tocante expressa com profundidade o lamento maternal diante da crucificação de Cristo.",
    references: [
      { book: "João", bookSlug: "john", chapter: 19, verses: "25-27" },
      { book: "Lucas", bookSlug: "luke", chapter: 2, verses: "35" }
    ],
    sourceUrl: "https://pt.wikipedia.org/wiki/Stabat_Mater_(Pergolesi)",
    dimensionsOrDuration: "~42 min"
  },
  {
    id: "mozart-requiem",
    title: "Réquiem em Ré menor",
    artistOrDirector: "Wolfgang Amadeus Mozart",
    year: "1791",
    category: "music",
    mediumOrGenre: "Missa de Réquiem",
    embedUrl: "https://www.youtube.com/embed/sPlhKP0nZII",
    description: "A última obra de Mozart, inacabada devido à sua morte. Esta missa fúnebre reflete profundamente sobre a morte, o julgamento final e a esperança da ressurreição eterna.",
    references: [
      { book: "1 Coríntios", bookSlug: "1-corinthians", chapter: 15, verses: "51-57" },
      { book: "Apocalipse", bookSlug: "revelation", chapter: 21, verses: "4" },
      { book: "Mateus", bookSlug: "matthew", chapter: 25, verses: "31-46" }
    ],
    sourceUrl: "https://pt.wikipedia.org/wiki/R%C3%A9quiem_(Mozart)",
    dimensionsOrDuration: "~90 min"
  },
  {
    id: "palerina-missa-papae-marcelli",
    title: "Missa Papae Marcelli",
    artistOrDirector: "Giovanni Pierluigi da Palestrina",
    year: "1562",
    category: "music",
    mediumOrGenre: "Missa Polifônica",
    embedUrl: "https://www.youtube.com/embed/YTlNNJdUDnw",
    description: "Considerada uma das obras-primas da música sacra renascentista. Esta missa polifônica exemplifica a pureza e clareza musical que o Concílio de Trento desejava para a liturgia católica.",
    references: [
      { book: "1 Coríntios", bookSlug: "1-corinthians", chapter: 11, verses: "23-26" },
      { book: "Lucas", bookSlug: "luke", chapter: 22, verses: "19-20" }
    ],
    sourceUrl: "https://pt.wikipedia.org/wiki/Missa_Papae_Marcelli",
    dimensionsOrDuration: "~35 min"
  },
  {
    id: "botticelli-nativity",
    title: "Natividade Mística",
    artistOrDirector: "Sandro Botticelli",
    year: "1500-1501",
    category: "painting",
    mediumOrGenre: "Têmpera sobre tela",
    imageUrl: "/src/assets/botticelli-nativity.jpg",
    description: "Uma interpretação única do nascimento de Cristo, combinando elementos tradicionais com simbolismo místico. A obra reflete as preocupações espirituais de Botticelli em seus últimos anos.",
    references: [
      { book: "Lucas", bookSlug: "luke", chapter: 2, verses: "1-20" },
      { book: "Mateus", bookSlug: "matthew", chapter: 1, verses: "18-25" }
    ],
    sourceUrl: "https://pt.wikipedia.org/wiki/Natividade_M%C3%ADstica",
    dimensionsOrDuration: "108,5 cm × 75 cm"
  },
  {
    id: "paixao-de-cristo-mel-gibson",
    title: "A Paixão de Cristo",
    artistOrDirector: "Mel Gibson",
    year: "2004",
    category: "film",
    mediumOrGenre: "Drama Épico",
    imageUrl: "/src/assets/passion-of-christ.jpg",
    description: "Filme que retrata de forma visceral as últimas 12 horas da vida de Jesus Cristo. A obra, controversa mas poderosa, apresenta uma visão crua e emocional do sacrifício de Cristo pela humanidade.",
    references: [
      { book: "Mateus", bookSlug: "matthew", chapter: 26, verses: "36-75" },
      { book: "Mateus", bookSlug: "matthew", chapter: 27, verses: "1-66" },
      { book: "João", bookSlug: "john", chapter: 18, verses: "1-40" },
      { book: "João", bookSlug: "john", chapter: 19, verses: "1-42" }
    ],
    sourceUrl: "https://pt.wikipedia.org/wiki/A_Paix%C3%A3o_de_Cristo",
    dimensionsOrDuration: "127 min"
  },
  {
    id: "ben-hur-1959",
    title: "Ben-Hur",
    artistOrDirector: "William Wyler",
    year: "1959",
    category: "film",
    mediumOrGenre: "Épico Histórico",
    imageUrl: "/src/assets/ben-hur-1959.jpg",
    description: "Épico cinematográfico que narra a história de Judah Ben-Hur, ambientada na época de Cristo. O filme entrelaça a jornada pessoal do protagonista com a vida e ministério de Jesus.",
    references: [
      { book: "Mateus", bookSlug: "matthew", chapter: 2, verses: "1-12" },
      { book: "Lucas", bookSlug: "luke", chapter: 23, verses: "32-43" },
      { book: "Mateus", bookSlug: "matthew", chapter: 27, verses: "45-54" }
    ],
    sourceUrl: "https://pt.wikipedia.org/wiki/Ben-Hur_(filme_de_1959)",
    dimensionsOrDuration: "212 min"
  }
];