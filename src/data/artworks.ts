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
  }
];