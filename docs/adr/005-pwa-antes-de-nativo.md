# 005 — PWA antes de considerar app nativo

**Data:** 2026-08-16

## Contexto
Pergunta discutida: cabe um app React Native pra este projeto, como
existe pro Lecionário? A maior parte dos usuários vem de mobile e não há
app hoje.

## Decisão
**Não agora.** Manter um segundo app nativo em paralelo ao Lecionário tem
custo real e permanente, já visto na prática no próprio Lecionário na
mesma época: build EAS, versão de SDK, ícone/splash, acessibilidade por
plataforma — trabalho que se repete pra sempre, não só uma vez. Caminho
mais barato primeiro: PWA instalável, mesmo padrão que o Lecionário já
usa e validou (manifest, "Adicionar à tela inicial", cache de imagem).

## Consequências
- Sem app nativo por enquanto — pendente ainda: `manifest.json` + ícones
  PWA, avaliar service worker pra cache de imagem.
- Reavaliar React Native **só se uso real mostrar que PWA não é
  suficiente** — não por suposição ou porque o Lecionário tem um.
- Mantém o padrão de decisão do cluster: cada projeto novo custa
  manutenção permanente, então a régua é "uso real exige isso?", não
  "seria legal ter".
