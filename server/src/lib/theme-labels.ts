/**
 * "Filtros Avançados" (roadmap, Passo 2, 2026-09-02) — nomes de exibição
 * pros slugs de tema extraídos das tags do vault (ver `extractThemes()` em
 * vault-parse.ts). A tag do Obsidian já vem sem acento por convenção do
 * próprio vault ("ressurreicao", não "ressurreição"), então o slug sozinho
 * não recupera o nome certo em português — precisa de uma curadoria manual.
 *
 * Curados aqui só os temas com 3+ usos no vault (119 de 366 distintos no
 * levantamento de 2026-09-02, que já cobrem a grande maioria do uso real
 * por serem os mais citados). O resto cai no fallback de
 * `humanizeThemeSlug()` — sem acento, mas legível — já que curar à mão
 * um vocabulário de 366+ entradas (boa parte usada uma única vez) não
 * compensa o esforço frente ao ganho de UX. Dá pra estender esta lista
 * conforme algum tema do fallback incomodar na prática.
 */
const KNOWN_THEME_LABELS: Record<string, string> = {
  ressurreicao: 'Ressurreição',
  parabola: 'Parábola',
  paixao: 'Paixão',
  natividade: 'Natividade',
  milagre: 'Milagre',
  davi: 'Davi',
  parabolas: 'Parábolas',
  oracao: 'Oração',
  'ultima-ceia': 'Última Ceia',
  'paixao-de-cristo': 'Paixão de Cristo',
  profeta: 'Profeta',
  perdao: 'Perdão',
  getsemani: 'Getsêmani',
  'vida-de-cristo': 'Vida de Cristo',
  jose: 'José',
  criacao: 'Criação',
  paulo: 'Paulo',
  paisagem: 'Paisagem',
  julgamento: 'Julgamento',
  crucificacao: 'Crucificação',
  fe: 'Fé',
  ester: 'Ester',
  anunciacao: 'Anunciação',
  moises: 'Moisés',
  misericordia: 'Misericórdia',
  'doze-tribos': 'Doze Tribos',
  tentacao: 'Tentação',
  tempestade: 'Tempestade',
  maria: 'Maria',
  'bom-samaritano': 'Bom Samaritano',
  diluvio: 'Dilúvio',
  'atos-dos-apostolos': 'Atos dos Apóstolos',
  abraao: 'Abraão',
  transfiguracao: 'Transfiguração',
  'sagrada-familia': 'Sagrada Família',
  queda: 'Queda',
  milagres: 'Milagres',
  'maria-madalena': 'Maria Madalena',
  jaco: 'Jacó',
  'ecce-homo': 'Ecce Homo',
  daniel: 'Daniel',
  apostolo: 'Apóstolo',
  vitoria: 'Vitória',
  'via-dolorosa': 'Via Dolorosa',
  trindade: 'Trindade',
  templo: 'Templo',
  simeao: 'Simeão',
  sacrificio: 'Sacrifício',
  natal: 'Natal',
  martirio: 'Martírio',
  'maria-e-marta': 'Maria e Marta',
  'joao-batista': 'João Batista',
  golias: 'Golias',
  'fuga-para-o-egito': 'Fuga para o Egito',
  'entrada-jerusalem': 'Entrada em Jerusalém',
  emaus: 'Emaús',
  elias: 'Elias',
  cruz: 'Cruz',
  criancas: 'Crianças',
  betania: 'Betânia',
  batismo: 'Batismo',
  anjos: 'Anjos',
  'tumulo-vazio': 'Túmulo Vazio',
  servico: 'Serviço',
  salomao: 'Salomão',
  pedro: 'Pedro',
  'milagres-de-jesus': 'Milagres de Jesus',
  marinha: 'Marinha',
  magos: 'Magos',
  jo: 'Jó',
  jesus: 'Jesus',
  'infancia-de-jesus': 'Infância de Jesus',
  humildade: 'Humildade',
  cura: 'Cura',
  cordeiro: 'Cordeiro',
  conforto: 'Conforto',
  chamado: 'Chamado',
  'bom-pastor': 'Bom Pastor',
  ascensao: 'Ascensão',
  arrependimento: 'Arrependimento',
  apresentacao: 'Apresentação',
  alegoria: 'Alegoria',
  'adao-eva': 'Adão e Eva',
  virgens: 'Virgens',
  'virgem-maria': 'Virgem Maria',
  vanitas: 'Vanitas',
  sofrimento: 'Sofrimento',
  'sermao-do-monte': 'Sermão do Monte',
  samuel: 'Samuel',
  sabedoria: 'Sabedoria',
  'rute-e-boaz': 'Rute e Boaz',
  rute: 'Rute',
  presenca: 'Presença',
  pilatos: 'Pilatos',
  pecadora: 'Pecadora',
  pastores: 'Pastores',
  noe: 'Noé',
  lazaro: 'Lázaro',
  josue: 'Josué',
  'jesus-contemporaneo': 'Jesus Contemporâneo',
  'filho-prodigo': 'Filho Pródigo',
  exodo: 'Êxodo',
  eva: 'Eva',
  eucaristia: 'Eucaristia',
  escatologia: 'Escatologia',
  'domingo-ramos': 'Domingo de Ramos',
  cristo: 'Cristo',
  biblia: 'Bíblia',
  bencao: 'Bênção',
  'bem-aventurancas': 'Bem-Aventuranças',
  arao: 'Arão',
  apostolos: 'Apóstolos',
  apocalipse: 'Apocalipse',
  aparicao: 'Aparição',
  'antigo-testamento': 'Antigo Testamento',
  anjo: 'Anjo',
  alianca: 'Aliança',
  agua: 'Água',
  adoracao: 'Adoração',
};

/** Deslugificação genérica pros temas raros (1-2 usos) fora da curadoria
 *  manual acima — sem acento, mas legível ("tumba-vazia" -> "Tumba Vazia"). */
export function humanizeThemeSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function themeLabel(slug: string): string {
  return KNOWN_THEME_LABELS[slug] ?? humanizeThemeSlug(slug);
}
