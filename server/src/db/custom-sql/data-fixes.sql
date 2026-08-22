-- Correção de dados da auditoria de direitos autorais de 2026-08-22.
-- Idempotente por natureza (UPDATE determinístico) e seguro de rodar todo
-- deploy junto das migrations — se um dia uma obra aqui listada ganhar
-- licença formal/CC do autor, NÃO remover o bloco: atualizar o registro
-- específico (active=true, license_type, attribution_text) e mover a
-- justificativa pra docs/AUDITORIA-COPYRIGHT.md.
-- Detalhes, fontes e critério legal: docs/AUDITORIA-COPYRIGHT.md

-- Sylwia Perczak — A Santa Trindade (autora viva)
UPDATE artworks SET active = false, license_type = 'in-copyright'
WHERE artist_or_director ILIKE 'Sylwia Perczak' AND title ILIKE 'A Santa Trindade';

-- Cecília Rosa — Uma coisa sei- eu era cego e agora vejo! (autora viva)
UPDATE artworks SET active = false, license_type = 'in-copyright'
WHERE artist_or_director ILIKE 'Cecília Rosa' AND title ILIKE 'Uma coisa sei- eu era cego e agora vejo!';

-- Ulyana Tomkevych — Transfiguração (autor vivo)
UPDATE artworks SET active = false, license_type = 'in-copyright'
WHERE artist_or_director ILIKE 'Ulyana Tomkevych' AND title ILIKE 'Transfiguração';

-- Ulyana Tomkevych — O nascimento de Cristo (autor vivo)
UPDATE artworks SET active = false, license_type = 'in-copyright'
WHERE artist_or_director ILIKE 'Ulyana Tomkevych' AND title ILIKE 'O nascimento de Cristo';

-- Leah Mitchell — Uma alegoria de Eva e Maria (autora viva)
UPDATE artworks SET active = false, license_type = 'in-copyright'
WHERE artist_or_director ILIKE 'Leah Mitchell' AND title ILIKE 'Uma alegoria de Eva e Maria';

-- Julia Mann — Um menino nos nasceu (autora viva)
UPDATE artworks SET active = false, license_type = 'in-copyright'
WHERE artist_or_director ILIKE 'Julia Mann' AND title ILIKE 'Um menino nos nasceu';

-- Greta Maria Leśko — Transfiguração (autora viva)
UPDATE artworks SET active = false, license_type = 'in-copyright'
WHERE artist_or_director ILIKE 'Greta Maria Leśko' AND title ILIKE 'Transfiguração';

-- Peter Brown — Natal (autor vivo)
UPDATE artworks SET active = false, license_type = 'in-copyright'
WHERE artist_or_director ILIKE 'Peter Brown' AND title ILIKE 'Natal';

-- Daphne Stephenson — Eu sou o Caminho, a Verdade e a Vida (autora viva)
UPDATE artworks SET active = false, license_type = 'in-copyright'
WHERE artist_or_director ILIKE 'Daphne Stephenson' AND title ILIKE 'Eu sou o Caminho, a Verdade e a Vida';

-- Riki Yarbrough — José, esposo de Maria (autor vivo)
UPDATE artworks SET active = false, license_type = 'in-copyright'
WHERE artist_or_director ILIKE 'Riki Yarbrough' AND title ILIKE 'José, esposo de Maria';

-- Larry Cole — Amor (autor vivo)
UPDATE artworks SET active = false, license_type = 'in-copyright'
WHERE artist_or_director ILIKE 'Larry Cole' AND title ILIKE 'Amor';

-- Sedrick Huckaby — As Mãos Dela Sobre a Palavra (autor vivo)
UPDATE artworks SET active = false, license_type = 'in-copyright'
WHERE artist_or_director ILIKE 'Sedrick Huckaby' AND title ILIKE 'As Mãos Dela Sobre a Palavra';

-- James Christensen — Tocando a orla da veste de Deus (1942-2017)
UPDATE artworks SET active = false, license_type = 'in-copyright'
WHERE artist_or_director ILIKE 'James Christensen' AND title ILIKE 'Tocando a orla da veste de Deus';

-- Ilya Glazunov — Rússia Eterna (1930-2017)
UPDATE artworks SET active = false, license_type = 'in-copyright'
WHERE artist_or_director ILIKE 'Ilya Glazunov' AND title ILIKE 'Rússia Eterna';

-- John Reilly — Milagre de peixes (1928-2010)
UPDATE artworks SET active = false, license_type = 'in-copyright'
WHERE artist_or_director ILIKE 'John Reilly' AND title ILIKE 'Milagre de peixes';

-- Eyvind Earle — Três homens sábios (1916-2000)
UPDATE artworks SET active = false, license_type = 'in-copyright'
WHERE artist_or_director ILIKE 'Eyvind Earle' AND title ILIKE 'Três homens sábios';

-- Francis Hoyland — Natividade (n. 1930, vivo)
UPDATE artworks SET active = false, license_type = 'in-copyright'
WHERE artist_or_director ILIKE 'Francis Hoyland' AND title ILIKE 'Natividade';

-- Kiyoshi Yamashita — Fogos de artifício (1922-1971)
UPDATE artworks SET active = false, license_type = 'in-copyright'
WHERE artist_or_director ILIKE 'Kiyoshi Yamashita' AND title ILIKE 'Fogos de artifício';

-- Robert Henderson Blyth — À imagem do homem (1919-1970)
UPDATE artworks SET active = false, license_type = 'in-copyright'
WHERE artist_or_director ILIKE 'Robert Henderson Blyth' AND title ILIKE 'À imagem do homem';

-- Lê Phổ — A Virgem e a Criança (1907-2001)
UPDATE artworks SET active = false, license_type = 'in-copyright'
WHERE artist_or_director ILIKE 'Lê Phổ' AND title ILIKE 'A Virgem e a Criança';

-- Gao Di'an — Jesus recitando uma lição (pendente de verificação; buscas
-- 2026-08-22 não encontraram o artista em nenhuma grafia — ver AUDITORIA-COPYRIGHT.md)
UPDATE artworks SET active = false, license_type = 'in-copyright'
WHERE artist_or_director ILIKE 'Gao Di''an' AND title ILIKE 'Jesus recitando uma lição';

-- Lu Hongnian — O nascimento de Cristo (BLOQUEADO confirmado: † out/1989,
-- protegido até 2059 — ver AUDITORIA-COPYRIGHT.md, seção Resolução dos pendentes)
UPDATE artworks SET active = false, license_type = 'in-copyright'
WHERE artist_or_director ILIKE 'Lu Hongnian' AND title ILIKE 'O nascimento de Cristo';

-- Hermann Clementz — Cristo no Getsêmani (LIBERADO: † 1930, domínio público;
-- verificado 2026-08-22 — reativa no próximo deploy)
UPDATE artworks SET active = true, license_type = 'public-domain'
WHERE artist_or_director ILIKE 'Hermann Clementz' AND title ILIKE 'Cristo no Getsêmani';

-- Victor Oscar Guetin — Jesus ressuscita a filha de Jairo (LIBERADO: † 1916,
-- domínio público; Prix de Rome 1902 do próprio artista — verificado 2026-08-22)
UPDATE artworks SET active = true, license_type = 'public-domain'
WHERE artist_or_director ILIKE 'Victor Oscar Guetin' AND title ILIKE 'Jesus ressuscita a filha de Jairo';
