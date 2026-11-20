# Plano curado: Advento e Natal na Pintura do Dia

> Lista aprovada pelo autor em 20/11/2026 e implementada no código (ainda sem commit nem deploy). Hoje a Pintura do Dia (e o post do Instagram, que lê a mesma rota `/artworks/daily`) segue só o capítulo da leitura do lecionário; no Advento isso rende dias sem relação com o tempo litúrgico, e 24/12 não tem leitura cadastrada.

## Implementação

- `server/src/lib/advent-plan.ts`: o plano (módulo puro, só devolve slugs) e `server/src/lib/advent-plan.test.ts` (lista de 2026 dia a dia, 35 anos sem furo nem repetição, todos os slugs existem no catálogo).
- `server/src/db/queries.ts`: o plano manda sobre o lecionário e sobre a janela de não repetição. Como a janela de 30 dias já está gravada em `daily_artwork` com as escolhas antigas, `garantirEscolhasAte` troca a linha gravada pela obra planejada (inclusive a de hoje). O caminho rápido também confere se o gravado diverge do plano, então a primeira chamada a `/artworks/daily` depois do deploy já corrige os dias do período. Obra planejada que deixe de ser publicável cede lugar à próxima candidata do dia, e sem nenhuma, ao lecionário.
- `server/src/db/daily-artwork.integration.test.ts`: 24/12 sem leitura, troca de linha antiga, hoje já gravado, obra retirada e volta ao lecionário em 07/01.
- Fora do período (antes do 1º domingo do Advento e depois de 06/01), nada muda.
- Após o deploy, conferir `GET /api/v1/artworks/daily?date=2026-11-29` e `?date=2026-12-24` e comparar com a tabela abaixo. O Lecionário e o post do Instagram leem a mesma rota.

## Regras do plano

- **Cobertura:** do 1º domingo do Advento até 6 de janeiro (Epifania). O dia seguinte volta ao lecionário.
- **Datas fixas de 17 a 24/12** (dias de maior proximidade do Natal: José, Zacarias, Anunciação, Visitação, Belém, Véspera). **Antes de 17/12**, o dia é definido pela semana do Advento e pelo dia da semana (semana 1: esperança e vigilância; semana 2: João Batista e os profetas; semana 3: alegria, os nascimentos anunciados, Maria). **De 25/12 a 6/01**, datas fixas (Natividade, Estêvão, João Evangelista, Inocentes, Simeão, Fuga, Circuncisão, Sagrada Família, Pastores, Estrela, Magos).
- **Anos seguintes:** cada dia tem 2 a 3 candidatas em ordem. O ano 2026 usa a 1ª; 2027, a 2ª; 2028, a 3ª (ou volta à 1ª). Nenhuma obra repete dentro do mesmo ano, e entre 2026 e 2027 só 8 de 39 se repetem.
- **Só entram obras ativas** no catálogo de produção (conferido em 20/11/2026).

## 2026 (1º domingo: 29/11)

| Data | Dia | Artista | Obra | Ano |
|---|---|---|---|---|
| 29/11/2026 | dom | Gustave Doré | O Profeta Isaías | 1866 |
| 30/11/2026 | seg | Jan Bruegel, o Velho | Profecia do profeta Isaías | c. 1609 |
| 01/12/2026 | ter | Hieronymus Francken II | A Parábola das Dez Virgens | 1616 |
| 02/12/2026 | qua | James Tissot | O Profeta Habacuque | c. 1896–1902 |
| 03/12/2026 | qui | William Blake | As Virgens Prudentes e Insensatas | 1826 |
| 04/12/2026 | sex | John Martin | O Juízo Final | 1853 |
| 05/12/2026 | sáb | Gustave Doré | Miquéias exorta os israelitas ao arrependimento | 1866 |
| 06/12/2026 | dom | Rembrandt van Rijn | A pregação de João Batista | 1634 |
| 07/12/2026 | seg | Gustave Doré | João Batista Prega no Deserto | 1866 |
| 08/12/2026 | ter | Hieronymus Bosch | João Batista no deserto | c. 1489 |
| 09/12/2026 | qua | Caravaggio | João Batista no deserto | 1604-1605 |
| 10/12/2026 | qui | James Tissot | O Profeta Oseias | c. 1896–1902 |
| 11/12/2026 | sex | Michelangelo | O Profeta Joel | 1508–1512 |
| 12/12/2026 | sáb | Gustave Doré | O Profeta Jeremias | 1866 |
| 13/12/2026 | dom | Alexander Ivanov | O anjo Gabriel aparece a Zacarias | c. 1850 |
| 14/12/2026 | seg | Rogier van der Weyden | O nascimento de João Batista | 1455 |
| 15/12/2026 | ter | Jerónimo Cósida | O nascimento de João Batista | 1580 |
| 16/12/2026 | qua | Henry Ossawa Tanner | Maria | 1914 |
| 17/12/2026 | qui | Rembrandt van Rijn | O sonho de José | 1645 |
| 18/12/2026 | sex | Autor Desconhecido | O sonho de José e a jornada até Belém | c. 1315-1321 |
| 19/12/2026 | sáb | William Blake | O Anjo Aparecendo a Zacarias | 1800 |
| 20/12/2026 | dom | Fra Angelico | A Anunciação | 1440-1445 |
| 21/12/2026 | seg | Gerard David | A Anunciação | 1506 |
| 22/12/2026 | ter | Carl Bloch | A Visitação | 1866 |
| 23/12/2026 | qua | Pieter Bruegel, o Velho | O censo em Belém | 1566 |
| 24/12/2026 | qui | Michael Rieser | A noite antes do nascimento de Cristo | 1869 |
| 25/12/2026 | sex | Antoon Van Dyck | Natividade | 1625-1627 |
| 26/12/2026 | sáb | Rembrandt van Rijn | O apedrejamento de Estevão | 1625 |
| 27/12/2026 | dom | Domenichino | São João Evangelista | c. 1624-1629 |
| 28/12/2026 | seg | François-Joseph Navez | O Massacre dos Inocentes | 1824 |
| 29/12/2026 | ter | Rembrandt van Rijn | A Canção de Louvor de Simeão | 1631 |
| 30/12/2026 | qua | Francisco de Zurbarán | A Fuga para o Egito | c. 1638-1640 |
| 31/12/2026 | qui | Gerard David | Descanso no caminho para o Egito | 1515 |
| 01/01/2027 | sex | Rembrandt van Rijn | A Circuncisão de Jesus | 1661 |
| 02/01/2027 | sáb | Ticiano | A Sagrada Família com um Pastor | 1510 |
| 03/01/2027 | dom | Caravaggio | A Adoração dos Pastores | 1609 |
| 04/01/2027 | seg | Paul Hey | A estrela de Belém | 1910 |
| 05/01/2027 | ter | Bartolomé Esteban Murillo | Adoração dos Reis Magos | 1655-1660 |
| 06/01/2027 | qua | Sandro Botticelli | A Adoração dos Magos | 1475 |

## 2027 (1º domingo: 28/11), pré-visualização

| Data | Dia | Artista | Obra |
|---|---|---|---|
| 28/11/2027 | dom | James Tissot | O Profeta Malaquias |
| 29/11/2027 | seg | Gustave Doré | A Visão de Zacarias dos Quatro Carros |
| 30/11/2027 | ter | Ernst Friedrich von Liphart | A Parábola das Virgens Prudentes e Insensatas |
| 01/12/2027 | qua | James Tissot | O Profeta Ageu |
| 02/12/2027 | qui | Friedrich Wilhelm Schadow | As Virgens Prudentes e Insensatas |
| 03/12/2027 | sex | John Fleetwood | As Virgens Prudentes e Insensatas |
| 04/12/2027 | sáb | James Tissot | O Profeta Naum |
| 05/12/2027 | dom | Jan Steen | João Batista pregando |
| 06/12/2027 | seg | Pieter de Grebber | João Batista prega a Herodes Antipas |
| 07/12/2027 | ter | Caravaggio | João Batista no deserto |
| 08/12/2027 | qua | Hieronymus Bosch | João Batista no deserto |
| 09/12/2027 | qui | Michelangelo | O Profeta Joel |
| 10/12/2027 | sex | James Tissot | O Profeta Obadias |
| 11/12/2027 | sáb | Gustave Doré | O profeta Amós |
| 12/12/2027 | dom | William Blake | O Anjo Aparecendo a Zacarias |
| 13/12/2027 | seg | Jerónimo Cósida | O nascimento de João Batista |
| 14/12/2027 | ter | Rogier van der Weyden | O nascimento de João Batista |
| 15/12/2027 | qua | Lucas Cranach, o Velho | A Virgem e a Criança |
| 16/12/2027 | qui | Henry Ossawa Tanner | A Anunciação |
| 17/12/2027 | sex | Georges de la Tour | José, o Carpinteiro |
| 18/12/2027 | sáb | Autor Desconhecido | O sonho de José e a jornada até Belém |
| 19/12/2027 | dom | Alexander Ivanov | O anjo Gabriel aparece a Zacarias |
| 20/12/2027 | seg | Leonardo da Vinci | A Anunciação |
| 21/12/2027 | ter | Petrus Christus | A Anunciação |
| 22/12/2027 | qua | Rogier van der Weyden | A Visitação |
| 23/12/2027 | qui | Ticiano | A anunciação |
| 24/12/2027 | sex | Geertgen tot Sint Jans | A natividade à noite |
| 25/12/2027 | sáb | William Henry Margetson | O primeiro natal |
| 26/12/2027 | dom | Gustave Doré | A Morte de Estevão |
| 27/12/2027 | seg | Ticiano | João Evangelista em Patmos |
| 28/12/2027 | ter | Lippo Memmi | O massacre dos inocentes |
| 29/12/2027 | qua | Aert de Gelder | Cântico de Louvor de Simeão |
| 30/12/2027 | qui | Jean-Léon Gérôme | A Fuga para o Egito |
| 31/12/2027 | sex | Francisco de Zurbarán | Descanso na Fuga para o Egito |
| 01/01/2028 | sáb | Hans Holbein, o Velho | Apresentação de Jesus no Templo |
| 02/01/2028 | dom | Rembrandt van Rijn | A Sagrada Família |
| 03/01/2028 | seg | Giorgione | A Adoração dos Pastores |
| 04/01/2028 | ter | Gustave Doré | Os Magos São Guiados por uma Estrela |
| 05/01/2028 | qua | Diego Velázquez | A Adoração dos Reis Magos |
| 06/01/2028 | qui | Peter Paul Rubens | Adoração dos Magos |

## Limites e pendências

- O acervo é curto em Natividade clássica (15 obras) e em Visitação (2). Vale uma rodada de curadoria para ampliar antes de 2028.
- Alguns dias são ponte, não cena: profetas de Tissot (Oseias, Joel, Naum, Amós, Jeremias), Dez Virgens e Juízo Final na semana 1. Estão ali pelo tema (espera, vigilância, juízo), mas não pela narrativa do nascimento.
- A legenda do post vem da descrição da obra, não da estação. Uma linha de legenda de Advento, por semana, seria o complemento natural.
- Faltam tag e cadastro de leitura para 24/12 no `daily-readings-refs.json`; o plano curado passa por cima disso, mas o Lecionário (irmão do projeto) deve ser conferido no mesmo dia.
- Obras com ressalva de padronização ainda aberta: `Blake - Virgens Prudentes` (imagem recortada) e algumas de Tissot. Conferir antes de ir ao ar.
