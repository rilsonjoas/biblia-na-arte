# Pesquisa — Licenciamento de obras de artistas vivos

> **Aviso:** isto é uma pesquisa de fontes primárias (texto oficial da lei no
> planalto.gov.br), feita para organizar a decisão. **Não é parecer
> jurídico.** Onde há interpretação, ela vem marcada como *leitura* ou
> *inferência*; onde a lei não responde, está marcado **não confirmado** e a
> questão foi para "Pendências para o advogado".
>
> **Data da pesquisa:** 2026-09-27
> **Fontes lidas (texto integral baixado do planalto.gov.br nesta data):**
> - Lei 9.610/1998 (LDA) — https://www.planalto.gov.br/ccivil_03/leis/l9610.htm
> - Código Civil, Lei 10.406/2002 (CC), texto compilado — https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm
> - Lei 14.063/2020 — https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2020/lei/l14063.htm
> - MP 2.200-2/2001 — https://www.planalto.gov.br/ccivil_03/mpv/antigas_2001/2200-2.htm
>
> **Fontes secundárias:** nenhuma foi usada. Não há jurisprudência nem
> doutrina neste documento. Tudo o que está aqui foi lido no texto da lei.

---

## Resumo

1. **(a) Checkbox:** o texto atual é uma *declaração de titularidade*, não uma *autorização*. Não diz o que o autor autoriza, nem em quais modalidades, nem que é gratuito. Como a LDA manda interpretar restritivamente (art. 4º), trata cada modalidade como independente (art. 31) e, para artes plásticas, exige autorização **escrita** e presume que ela é **onerosa** (art. 78), o texto atual não basta.
2. **(b) Termo simples:** o que se pretende é **licença** (autorização de uso sem transferir titularidade), e não cessão. A cessão tem forma expressa na lei: sempre por escrito e presumida onerosa (art. 50). A LDA não fixa forma geral para licença, mas o art. 78 exige forma escrita para qualquer autorização de reprodução de obra de arte plástica. Documento eletrônico vale como documento particular (MP 2.200-2, art. 10), e meios fora da ICP-Brasil valem se aceitos pelas partes (art. 10, §2º). Se um e-mail satisfaz o "por escrito" do art. 78 é leitura razoável, mas **não confirmado** por texto expresso.
3. **(c) Coletivo:** o fundador só autoriza as obras dos outros se tiver mandato com **poderes especiais** (LDA art. 49; CC art. 661, §1º), e em forma **escrita**, porque o ato a praticar exige forma escrita (CC art. 657 + LDA art. 78). Sem poderes, a autorização é **ineficaz** em relação ao artista, salvo ratificação expressa (CC art. 662). O art. 98 da LDA (mandato automático por filiação) vale só para associações de gestão coletiva sem fins lucrativos (art. 97), o que a SOPRARTE, pela descrição, não é.
4. **(d) Direitos morais:** são inalienáveis e irrenunciáveis (art. 27). Mesmo com licença, o site deve creditar o autor (art. 24, II), não modificar a obra (art. 24, IV) e respeitar a retirada em caso de afronta à reputação (art. 24, VI). Omitir o crédito gera dano moral (art. 108).
5. **(e) Mínimo defensável:** autossubmissão exige checkbox reescrito como autorização expressa, gratuita e com modalidades listadas, com registro da versão do texto aceita. Via coletivo, só entram as obras do próprio fundador; cada um dos outros artistas precisa autorizar diretamente ou dar procuração escrita ao fundador (ou ratificar por escrito) antes da publicação.

---

## (a) O checkbox vale como autorização do autor?

**Texto atual** (em `web/src/pages/SubmitArtwork.tsx`, linhas 394–395):

> "Confirmo que tenho direito sobre esta imagem (sou o autor, ou ela é de domínio público, ou tenho licença/autorização pra publicá-la aqui)"

### O que a lei exige

**LDA, art. 29, caput** — a autorização precisa ser prévia e expressa:

> "Art. 29. Depende de autorização prévia e expressa do autor a utilização da obra, por quaisquer modalidades, tais como:"

As modalidades que o site efetivamente usa aparecem separadas na lista do art. 29:

> "I - a reprodução parcial ou integral;"
> "III - a adaptação, o arranjo musical e quaisquer outras transformações;"
> "VIII - a utilização, direta ou indireta, da obra literária, artística ou científica, mediante: [...] i) emprego de sistemas óticos, fios telefônicos ou não, cabos de qualquer tipo e meios de comunicação similares que venham a ser adotados; j) exposição de obras de artes plásticas e figurativas;"
> "IX - a inclusão em base de dados, o armazenamento em computador, a microfilmagem e as demais formas de arquivamento do gênero;"

**LDA, art. 5º, VI** — guardar a imagem no servidor já é "reprodução":

> "VI - reprodução - a cópia de um ou vários exemplares de uma obra literária, artística ou científica ou de um fonograma, de qualquer forma tangível, incluindo qualquer armazenamento permanente ou temporário por meios eletrônicos ou qualquer outro meio de fixação que venha a ser desenvolvido;"

**LDA, art. 30, §1º** — cópias transitórias feitas só para exibir a obra na tela não precisam de autorização própria, **desde que** o uso principal esteja autorizado:

> "§ 1º O direito de exclusividade de reprodução não será aplicável quando ela for temporária e apenas tiver o propósito de tornar a obra, fonograma ou interpretação perceptível em meio eletrônico ou quando for de natureza transitória e incidental, desde que ocorra no curso do uso devidamente autorizado da obra, pelo titular."

**LDA, art. 31** — autorizar uma modalidade não autoriza as outras:

> "Art. 31. As diversas modalidades de utilização de obras literárias, artísticas ou científicas ou de fonogramas são independentes entre si, e a autorização concedida pelo autor, ou pelo produtor, respectivamente, não se estende a quaisquer das demais."

**LDA, art. 4º** — interpretação restritiva:

> "Art. 4º Interpretam-se restritivamente os negócios jurídicos sobre os direitos autorais."

**LDA, art. 49, VI** — sem modalidade especificada, vale só a indispensável:

> "VI - não havendo especificações quanto à modalidade de utilização, o contrato será interpretado restritivamente, entendendo-se como limitada apenas a uma que seja aquela indispensável ao cumprimento da finalidade do contrato."

**LDA, art. 78** — regra específica de obra de arte plástica (pintura é obra protegida pelo art. 7º, VIII: "as obras de desenho, pintura, gravura, escultura, litografia e arte cinética"):

> "Art. 78. A autorização para reproduzir obra de arte plástica, por qualquer processo, deve se fazer por escrito e se presume onerosa."

**CC, art. 114** — negócio gratuito também se interpreta estritamente:

> "Art. 114. Os negócios jurídicos benéficos e a renúncia interpretam-se estritamente."

### Conclusão (a)

- **O texto atual não é uma autorização.** Ele declara um fato ("tenho direito"), mas não diz o que o autor autoriza o site a fazer. O art. 29 pede autorização *expressa*. *Leitura:* dá para argumentar que enviar a obra por um formulário chamado "enviar obra" implica autorizar a publicação no site, e o art. 49, VI salvaria no máximo "aquela indispensável ao cumprimento da finalidade". Essa é justamente a posição mais fraca: tudo o que for além da exibição na página da obra fica descoberto.
- **Falta especificar modalidade.** Pelo art. 31, cada uso é independente. O repositório mostra que o site faz mais do que exibir:
  - download do arquivo original (`web/src/components/DownloadArtworkButton.tsx`);
  - geração de card de Story com a pintura em *cover* (recortada), moldura, logo e texto (`web/src/components/DownloadStoryButton.tsx`, `ArtworkShareCard.tsx`);
  - publicação automática da "Pintura do Dia" no Instagram, Facebook e Threads (`scripts/post-daily-social.mjs`).

  Nada disso está coberto pelo texto atual.
- **Falta dizer que é gratuito.** O art. 78 presume onerosa a autorização de reprodução de arte plástica. Sem cláusula expressa de gratuidade, a presunção joga contra o site.
- **Forma "por escrito" (art. 78):** o aceite eletrônico com timestamp é documento eletrônico. A MP 2.200-2, art. 10, caput diz que documentos eletrônicos são "documentos públicos ou particulares, para todos os fins legais" (transcrição na seção b). *Inferência:* isso sustenta que um aceite eletrônico registrado pode cumprir o "por escrito". **Não confirmado** por texto expresso: nenhuma das leis lidas diz literalmente que um checkbox satisfaz o art. 78.
- **A opção "tenho licença/autorização" é o ponto mais fraco.** Quem envia obra de terceiro está declarando algo que o site não verifica. Declarar não transfere direito nenhum: se a declaração for falsa, o uso continua não autorizado perante o verdadeiro autor. *Leitura:* a declaração serve para mostrar boa-fé e para eventual regresso contra quem mentiu. Ela não é uma autorização do autor.
- **Detalhe sobre "domínio público":** para artista vivo, a opção não se aplica, porque o prazo conta da morte. LDA, art. 41: "Os direitos patrimoniais do autor perduram por setenta anos contados de 1° de janeiro do ano subseqüente ao de seu falecimento, obedecida a ordem sucessória da lei civil."

---

## (b) Licença não exclusiva, gratuita e revogável, aceita por e-mail ou assinatura eletrônica simples

### Licença ou cessão?

**LDA, art. 49, caput** — a lei trata licenciamento e cessão como meios distintos:

> "Art. 49. Os direitos de autor poderão ser total ou parcialmente transferidos a terceiros, por ele ou por seus sucessores, a título universal ou singular, pessoalmente ou por meio de representantes com poderes especiais, por meio de licenciamento, concessão, cessão ou por outros meios admitidos em Direito, obedecidas as seguintes limitações:"

> "II - somente se admitirá transmissão total e definitiva dos direitos mediante estipulação contratual escrita;"
> "III - na hipótese de não haver estipulação contratual escrita, o prazo máximo será de cinco anos;"

**LDA, art. 50** — forma da cessão:

> "Art. 50. A cessão total ou parcial dos direitos de autor, que se fará sempre por escrito, presume-se onerosa."
> "§ 2º Constarão do instrumento de cessão como elementos essenciais seu objeto e as condições de exercício do direito quanto a tempo, lugar e preço."

**Diferença de forma, segundo o texto:**

| | Cessão | Licença |
|---|---|---|
| Forma exigida pela LDA | "sempre por escrito" (art. 50) | a LDA **não** tem regra geral de forma para licença. **Não confirmado** que exista: nenhum artigo lido a estabelece |
| Presunção de onerosidade | sim (art. 50) | não há regra geral; **mas** para reprodução de arte plástica, qualquer "autorização" é escrita e presumida onerosa (art. 78) |
| Elementos essenciais | objeto, tempo, lugar, preço (art. 50, §2º) | nenhum listado em lei; valem art. 4º, 31 e 49, VI (interpretação restritiva) |

*Leitura:* o termo descrito (não exclusivo, revogável, sem transferir titularidade, só exibição com crédito) tem cara de **licença**. A LDA não define "licença" nem "cessão" em artigo próprio (**não confirmado** que haja definição legal). A classificação vem da natureza do que se concede, e os requisitos de forma do art. 50 não se aplicariam. Mesmo assim, o art. 78 exige forma escrita para a obra de arte plástica, então **na prática o termo precisa ser escrito de qualquer jeito**.

### Precisa ser por escrito?

- **CC, art. 107** — a regra geral é forma livre:
  > "Art. 107. A validade da declaração de vontade não dependerá de forma especial, senão quando a lei expressamente a exigir."
- **LDA, art. 78** — aqui a lei exige expressamente ("deve se fazer por escrito"). Então **sim, precisa ser escrito**, porque o site reproduz a pintura (art. 5º, VI).
- **CC, art. 166, IV** — consequência de desrespeitar forma legal:
  > "Art. 166. É nulo o negócio jurídico quando: [...] IV - não revestir a forma prescrita em lei;"
  *Leitura:* uma autorização só verbal, ou só implícita, para reproduzir pintura corre risco de nulidade. Se o art. 78 é requisito de validade ou só de prova é **não confirmado** e fica para o advogado.
- **CC, art. 183**:
  > "Art. 183. A invalidade do instrumento não induz a do negócio jurídico sempre que este puder provar-se por outro meio."

### E-mail e assinatura eletrônica simples servem?

**MP 2.200-2/2001, art. 10** (caput e §2º):

> "Art. 10. Consideram-se documentos públicos ou particulares, para todos os fins legais, os documentos eletrônicos de que trata esta Medida Provisória."
> "§ 2o O disposto nesta Medida Provisória não obsta a utilização de outro meio de comprovação da autoria e integridade de documentos em forma eletrônica, inclusive os que utilizem certificados não emitidos pela ICP-Brasil, desde que admitido pelas partes como válido ou aceito pela pessoa a quem for oposto o documento."

**Lei 14.063/2020, art. 4º, I** — define assinatura eletrônica simples:

> "I - assinatura eletrônica simples: a) a que permite identificar o seu signatário; b) a que anexa ou associa dados a outros dados em formato eletrônico do signatário;"

**Mas o capítulo que classifica as assinaturas não rege relações entre particulares.** Lei 14.063, art. 2º, parágrafo único:

> "Parágrafo único. O disposto neste Capítulo não se aplica: [...] II - à interação: a) entre pessoas naturais ou entre pessoas jurídicas de direito privado;"

*Leitura:* a Lei 14.063 serve de vocabulário ("simples/avançada/qualificada"), mas não é ela que dá validade a um termo entre o site e um artista. Quem faz isso é a MP 2.200-2, art. 10, §2º: um meio de comprovação fora da ICP-Brasil vale se as partes o admitirem como válido. **Consequência prática:** o próprio termo deve dizer que as partes aceitam o e-mail / aceite eletrônico como forma válida de assinatura. É isso que ativa o §2º.

**CC, art. 219** e **art. 225** (prova):

> "Art. 219. As declarações constantes de documentos assinados presumem-se verdadeiras em relação aos signatários."
> "Art. 225. As reproduções fotográficas, cinematográficas, os registros fonográficos e, em geral, quaisquer outras reproduções mecânicas ou eletrônicas de fatos ou de coisas fazem prova plena destes, se a parte, contra quem forem exibidos, não lhes impugnar a exatidão."

**Não confirmado:** se um e-mail simples (sem certificado) satisfaz o "por escrito" do art. 78 caso o artista conteste. O texto da lei aponta para "sim, se as partes admitiram o meio" (MP art. 10, §2º), mas nenhum artigo diz isso sobre o art. 78 especificamente.

### Revogável e gratuita

- **Gratuidade:** para afastar a presunção do art. 78 ("se presume onerosa"), o termo precisa dizer expressamente que é gratuito. *Inferência* a partir do próprio verbo "presume": presunção admite prova em contrário, e a cláusula escrita é essa prova.
- **Revogabilidade:** **não confirmado.** Nenhum artigo lido regula a revogação de licença gratuita. Nenhum artigo lido proíbe a cláusula. A LDA fala de retirada/suspensão só no plano moral (art. 24, VI, ver seção d). *Leitura:* a revogabilidade entra por estipulação no próprio termo, e o termo deve dizer o que acontece depois (prazo para retirar, posts já publicados em redes).
- **Não exclusiva:** a LDA não trata a exclusividade como padrão para licença (o único caso lido em que a lei impõe exclusividade é o contrato de edição, art. 53: "fica autorizado, em caráter de exclusividade"). *Leitura:* o termo deve dizer "não exclusiva" para não haver dúvida.

---

## (c) O fundador do coletivo pode autorizar obras dos outros membros?

### Regra: autor é quem criou; o coletivo, sozinho, não é titular

> LDA, art. 22: "Pertencem ao autor os direitos morais e patrimoniais sobre a obra que criou."
> LDA, art. 11: "Autor é a pessoa física criadora de obra literária, artística ou científica."
> LDA, art. 28: "Cabe ao autor o direito exclusivo de utilizar, fruir e dispor da obra literária, artística ou científica."

**Ter o quadro não dá o direito de reproduzir.** LDA, art. 77:

> "Art. 77. Salvo convenção em contrário, o autor de obra de arte plástica, ao alienar o objeto em que ela se materializa, transmite o direito de expô-la, mas não transmite ao adquirente o direito de reproduzi-la."

*Leitura:* mesmo que a SOPRARTE tenha comprado ou esteja vendendo os originais, isso não lhe dá direito de autorizar reprodução online, a não ser que haja contrato com o artista dizendo o contrário. Se a SOPRARTE tem esse contrato (e se ele permite sublicenciar), é **não confirmado**: depende de documento que não temos.

### Representação e mandato

**LDA, art. 49, caput** — representante precisa de "poderes especiais":

> "[...] pessoalmente ou por meio de representantes com poderes especiais, por meio de licenciamento, concessão, cessão [...]"

**CC, art. 653** — definição:

> "Art. 653. Opera-se o mandato quando alguém recebe de outrem poderes para, em seu nome, praticar atos ou administrar interesses. A procuração é o instrumento do mandato."

**CC, art. 656 e 657** — o mandato em geral pode ser verbal, **mas não quando o ato exige escrita**:

> "Art. 656. O mandato pode ser expresso ou tácito, verbal ou escrito."
> "Art. 657. A outorga do mandato está sujeita à forma exigida por lei para o ato a ser praticado. Não se admite mandato verbal quando o ato deva ser celebrado por escrito."

*Aplicação:* como o art. 78 da LDA exige escrita para autorizar reprodução de arte plástica, **o mandato do fundador também precisa ser escrito**.

**CC, art. 661** — poderes gerais não bastam:

> "Art. 661. O mandato em termos gerais só confere poderes de administração."
> "§ 1o Para alienar, hipotecar, transigir, ou praticar outros quaisquer atos que exorbitem da administração ordinária, depende a procuração de poderes especiais e expressos."

**CC, art. 654** — conteúdo da procuração particular:

> "Art. 654. Todas as pessoas capazes são aptas para dar procuração mediante instrumento particular, que valerá desde que tenha a assinatura do outorgante."
> "§ 1o O instrumento particular deve conter a indicação do lugar onde foi passado, a qualificação do outorgante e do outorgado, a data e o objetivo da outorga com a designação e a extensão dos poderes conferidos."
> "§ 2o O terceiro com quem o mandatário tratar poderá exigir que a procuração traga a firma reconhecida."

**CC, art. 118** — o site pode (e deve) pedir prova dos poderes:

> "Art. 118. O representante é obrigado a provar às pessoas, com quem tratar em nome do representado, a sua qualidade e a extensão de seus poderes, sob pena de, não o fazendo, responder pelos atos que a estes excederem."

### E o art. 98 da LDA (associações)?

> LDA, art. 97, caput: "Para o exercício e defesa de seus direitos, podem os autores e os titulares de direitos conexos associar-se sem intuito de lucro."
> LDA, art. 98, caput (redação da Lei 12.853/2013): "Com o ato de filiação, as associações de que trata o art. 97 tornam-se mandatárias de seus associados para a prática de todos os atos necessários à defesa judicial ou extrajudicial de seus direitos autorais, bem como para o exercício da atividade de cobrança desses direitos."

*Leitura:* esse mandato automático é só para associações **sem intuito de lucro** de gestão coletiva (art. 97) e cobre **defesa e cobrança**, não licenciar livremente. Pela descrição, a SOPRARTE é um coletivo comercial que vende obras. Então o art. 98 **não parece aplicável**. **Não confirmado** qual é a forma jurídica da SOPRARTE (associação, empresa, grupo informal); isso precisa ser perguntado.

### E se o fundador não tiver poderes?

**CC, art. 662** — ineficácia, salvo ratificação:

> "Art. 662. Os atos praticados por quem não tenha mandato, ou o tenha sem poderes suficientes, são ineficazes em relação àquele em cujo nome foram praticados, salvo se este os ratificar."
> "Parágrafo único. A ratificação há de ser expressa, ou resultar de ato inequívoco, e retroagirá à data do ato."

**CC, art. 665**:

> "Art. 665. O mandatário que exceder os poderes do mandato, ou proceder contra eles, será considerado mero gestor de negócios, enquanto o mandante lhe não ratificar os atos."

**CC, art. 873** (gestão de negócios):

> "Art. 873. A ratificação pura e simples do dono do negócio retroage ao dia do começo da gestão, e produz todos os efeitos do mandato."

**Consequência para o site:** sem poderes e sem ratificação, a "autorização" do fundador não vale perante o artista. O uso da obra fica sem autorização, e a LDA prevê:

> LDA, art. 5º, VII: "contrafação - a reprodução não autorizada;"
> LDA, art. 102: "O titular cuja obra seja fraudulentamente reproduzida, divulgada ou de qualquer forma utilizada, poderá requerer a apreensão dos exemplares reproduzidos ou a suspensão da divulgação, sem prejuízo da indenização cabível."

*Leitura:* o art. 102 fala em "fraudulentamente". Se a boa-fé do site (ter recebido a obra do fundador do coletivo) afasta ou reduz a indenização é **não confirmado**. O CC, art. 118 indica que o fundador responderia pelo que excedeu seus poderes, mas isso é regresso contra ele. Não impede o artista de exigir a retirada.

**Obras do próprio fundador:** ele é autor e autoriza por si (art. 22). A presunção de autoria do art. 13 ajuda a identificá-lo:

> LDA, art. 13: "Considera-se autor da obra intelectual, não havendo prova em contrário, aquele que, por uma das modalidades de identificação referidas no artigo anterior, tiver, em conformidade com o uso, indicada ou anunciada essa qualidade na sua utilização."

---

## (d) Direitos morais: o que o site precisa respeitar mesmo com licença

> LDA, art. 27: "Os direitos morais do autor são inalienáveis e irrenunciáveis."

Nenhuma licença ou termo afasta estes direitos. Do art. 24, os relevantes para o site:

> "II - o de ter seu nome, pseudônimo ou sinal convencional indicado ou anunciado, como sendo o do autor, na utilização de sua obra;"
> "IV - o de assegurar a integridade da obra, opondo-se a quaisquer modificações ou à prática de atos que, de qualquer forma, possam prejudicá-la ou atingi-lo, como autor, em sua reputação ou honra;"
> "V - o de modificar a obra, antes ou depois de utilizada;"
> "VI - o de retirar de circulação a obra ou de suspender qualquer forma de utilização já autorizada, quando a circulação ou utilização implicarem afronta à sua reputação e imagem;"
> "§ 3º Nos casos dos incisos V e VI, ressalvam-se as prévias indenizações a terceiros, quando couberem."

> LDA, art. 12: "Para se identificar como autor, poderá o criador da obra literária, artística ou científica usar de seu nome civil, completo ou abreviado até por suas iniciais, de pseudônimo ou qualquer outro sinal convencional."

> LDA, art. 108, caput: "Quem, na utilização, por qualquer modalidade, de obra intelectual, deixar de indicar ou de anunciar, como tal, o nome, pseudônimo ou sinal convencional do autor e do intérprete, além de responder por danos morais, está obrigado a divulgar-lhes a identidade da seguinte forma: [...]"

> LDA, art. 52: "A omissão do nome do autor, ou de co-autor, na divulgação da obra não presume o anonimato ou a cessão de seus direitos."

**O que isso significa na prática (leitura):**

- **Crédito em todo lugar onde a obra aparece:** página da obra, miniaturas em listas, card de Story, posts em Instagram/Facebook/Threads. Deve usar o nome ou pseudônimo que o artista escolheu (art. 12), coletado no formulário/termo.
- **Integridade:** o card de Story recorta a pintura em *cover* e sobrepõe moldura, logo e texto (`ArtworkShareCard.tsx`). Recorte e sobreposição podem ser "modificações" (art. 24, IV) e "transformações" (art. 29, III). **Não confirmado** se redimensionar/comprimir (WebP) ou gerar miniatura conta como modificação. A lei não fala nisso. Posição segura: pedir autorização expressa no termo para miniaturas/redimensionamento e **não** gerar card recortado nem sobreposto para obras licenciadas, a menos que o artista autorize especificamente.
- **Retirada:** mesmo que a licença fosse irrevogável, o art. 24, VI permite ao autor suspender o uso em caso de afronta à reputação. Como o termo já será revogável, isso fica coberto, mas o site precisa de um canal e de um procedimento para tirar a obra do ar.
- **Contexto:** o inciso IV cobre também "prática de atos que [...] possam [...] atingi-lo [...] em sua reputação ou honra". *Leitura:* textos, legendas ou associações que o site faça ao lado da obra entram aqui. **Não confirmado** onde fica o limite. Pendência.

---

## (e) Mínimo defensável, na prática

### Autossubmissão individual (artista envia a própria obra)

1. Checkbox reescrito como **autorização expressa** (art. 29), e não só como declaração, com:
   - modalidades listadas (art. 31, 49 VI): exibição no site, armazenamento/banco de dados, miniaturas, e, **se for o caso, cada uma à parte**: download do arquivo, card de compartilhamento, publicação nas redes do projeto;
   - **gratuidade expressa** (contra a presunção do art. 78);
   - não exclusiva, revogável, sem uso comercial, crédito obrigatório;
   - cláusula de aceite do meio eletrônico como válido (MP 2.200-2, art. 10, §2º).
2. Registrar, junto do timestamp: **a versão exata do texto aceito**, o nome/pseudônimo para crédito, e-mail confirmado (clique em link), IP. *Leitura:* isso aproxima o aceite de uma assinatura eletrônica simples ("permite identificar o seu signatário", Lei 14.063, art. 4º, I, usada só como referência de vocabulário, ver seção b).
3. Separar os casos no formulário: "sou o autor" (autoriza direto), "domínio público" (conferir art. 41) e "obra de terceiro com licença" (exigir anexo/link da licença; sem isso, não publicar). A simples declaração de terceiro não é autorização do autor (seção a).
4. Até o termo novo existir, **não incluir obra de artista vivo** nas funções de download, Story e publicação automática em redes.

### Submissão via coletivo (SOPRARTE)

1. **Obras do próprio fundador:** ele aceita o termo como autor. Mesmo tratamento da autossubmissão.
2. **Obras dos outros membros:** não publicar até ter uma destas três coisas, por escrito:
   - **(i)** aceite direto do termo por cada artista (do e-mail do próprio artista); **ou**
   - **(ii)** procuração escrita de cada artista ao fundador, com poderes especiais e expressos para autorizar a reprodução e exibição online daquela(s) obra(s) (LDA art. 49; CC arts. 654 §1º, 657, 661 §1º), e o site pode exigir vê-la (CC art. 118); **ou**
   - **(iii)** ratificação expressa, por escrito, de cada artista, da autorização já dada pelo fundador (CC art. 662, parágrafo único).
3. *Leitura:* a opção (i) é a mais simples e a mais robusta. Ela não depende de avaliar a validade de procuração alheia e deixa o registro na mesma forma dos autossubmetidos.
4. Perguntar à SOPRARTE: forma jurídica, se há contrato com os artistas que trate de direitos de reprodução, e quem é o autor de cada uma das 7 obras.

---

## O que isso muda no termo e no checkbox

> **Sugestões de texto, não parecer.** Redação para discutir, e depois submeter ao advogado.

### Checkbox do formulário (sugestão)

Dois checkboxes obrigatórios, separados, em vez de um:

> **[ ] Sou o autor desta obra** (ou: ela é de domínio público / tenho licença do autor, que anexo abaixo).
>
> **[ ] Autorizo o Bíblia na Arte, gratuitamente e sem exclusividade,** a armazenar esta imagem e exibi-la no site biblianaarte, incluindo versões reduzidas (miniaturas), **sempre com meu nome como autor** e link para a fonte que indiquei. O site não fará uso comercial da obra, não a modificará e não a repassará a terceiros. Posso revogar esta autorização a qualquer momento pelo e-mail [contato], e a obra será retirada em até [N] dias. Aceito este registro eletrônico como forma válida da minha autorização. *(Termo completo: [link para a versão vN do termo])*

Opcionais, cada um com checkbox próprio (art. 31), não marcados por padrão:

> **[ ]** Autorizo também a publicação desta obra nos perfis do projeto no Instagram, Facebook e Threads, com crédito.
> **[ ]** Autorizo que visitantes baixem o arquivo da imagem para uso pessoal.
> **[ ]** Autorizo a geração de imagem de compartilhamento (formato Story), que recorta a obra e acrescenta moldura e logotipo.

Campos que o formulário deve passar a coletar: nome ou pseudônimo para crédito (art. 12), e-mail confirmado, link preferido.

### Termo simples (sugestão de cláusulas mínimas)

1. **Partes e obras:** nome/qualificação do autor; lista das obras (título, ano, arquivo).
2. **Natureza:** "licença de uso, não exclusiva, gratuita; não há cessão nem transferência de titularidade" (afasta art. 50 e registra gratuidade contra art. 78).
3. **Modalidades autorizadas**, uma por linha (arts. 29, 31, 49 VI). Tudo o que não estiver listado não está autorizado.
4. **Crédito:** forma exata do nome e do link; obrigação do site de manter o crédito em todas as modalidades (art. 24, II; art. 108).
5. **Integridade:** o site não altera a obra; só redimensiona/comprime para exibição (art. 24, IV). Se houver card de Story, cláusula própria.
6. **Revogação:** a qualquer tempo, por e-mail; prazo de retirada; o que acontece com posts já feitos em redes sociais (ver pendências).
7. **Sem uso comercial pelo site; sem sublicenciamento** (ver pendência sobre redes sociais).
8. **Declaração de autoria/titularidade** pelo signatário.
9. **Forma:** "as partes reconhecem como válido o aceite por e-mail / assinatura eletrônica" (MP 2.200-2, art. 10, §2º).
10. **Versão e data do termo.**

### Para o fundador do coletivo (sugestão)

E-mail curto para a SOPRARTE: "Podemos publicar agora as obras de [fundador], com o termo aceito por ele. Para as obras de [outros artistas], precisamos que cada artista aceite o termo pelo próprio e-mail (envio o link), ou que nos envie procuração escrita autorizando você a licenciar essas obras para nós."

---

## Pendências para o advogado

1. **Art. 78 da LDA e meio eletrônico:** um checkbox com timestamp e um e-mail simples cumprem "deve se fazer por escrito"? A forma escrita ali é requisito de validade (CC art. 166, IV) ou só de prova (CC art. 183)? **Não confirmado.**
2. **Licença × cessão:** a LDA não define os termos. Confirmar se um termo "não exclusivo, gratuito e revogável" fica fora do art. 50 e se há exigência de forma própria para licença além do art. 78. **Não confirmado.**
3. **Revogabilidade de licença gratuita:** nenhum artigo lido regula o tema. Validade da cláusula "revogável a qualquer tempo" e efeitos para trás (o que já foi exibido/postado). **Não confirmado.**
4. **Redes sociais e "sem sublicenciamento":** postar no Instagram/Facebook/Threads pode implicar conceder licença à plataforma pelos termos de uso dela. Não lemos os termos da Meta nesta pesquisa. Isso conflita com "sem sublicenciamento"? Como tratar posts já publicados após revogação? **Não confirmado.**
5. **Miniaturas, compressão, WebP, recorte em cover:** onde fica a linha de "modificação" do art. 24, IV e "transformação" do art. 29, III. **Não confirmado.**
6. **Responsabilidade do site de boa-fé** que recebeu obra de quem não tinha poderes (fundador sem mandato, ou usuário que declarou falsamente ter licença): alcance do art. 102 ("fraudulentamente") e da indenização. **Não confirmado.**
7. **SOPRARTE:** forma jurídica e existência de contratos com os artistas. Se houver contrato de representação/agenciamento, ele dá poderes para licenciar a terceiros? (Depende de documento.)
8. **Capacidade do signatário** (CC art. 104, I: "agente capaz"): menor de idade enviando obra própria. O formulário não verifica idade.
9. **Dados pessoais** (nome, e-mail, IP guardados como prova): base legal e retenção pela LGPD. Não pesquisado aqui.
10. **Jurisprudência:** esta pesquisa não usou decisões do STJ nem doutrina. Se o advogado tiver precedentes sobre aceite eletrônico em licença de obra de arte, eles complementam os pontos 1–3.
