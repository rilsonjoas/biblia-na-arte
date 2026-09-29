-- Backfill de daily_artwork com o que a "Pintura do Dia" realmente publicou
-- (2026-09-04 a 2026-09-28), extraído dos logs do workflow
-- post-daily-social.yml ("Obra de hoje") e mapeado pra id por título + artista
-- contra o banco de produção. Sem isso a janela de não-repetição de 30 dias
-- só se enche com os dias novos.
--
-- 2026-09-29 fica de fora de propósito: o post repetido de Jetro foi apagado
-- à mão, então não vira histórico.
-- 2026-09-11: o artista dessa obra foi corrigido no banco em 2026-09-25
-- ("Henri-Frédéric Schopin" -> "Frédéric Schopin"); casada só pelo título,
-- que é único.
--
-- Idempotente. Rodar DEPOIS da migration 0011 e ANTES de subir o código novo.
INSERT INTO daily_artwork (date, artwork_id) VALUES
  ('2026-09-04', 'e76f8c5a-22f8-5476-bc48-ecf66323bea3'),  -- A Nona Praga: as Trevas — Gustave Doré
  ('2026-09-05', '1c96f88a-dfab-551f-8650-ec58b48ba831'),  -- Jesus chora por Jerusalém — Enrique Simonet
  ('2026-09-06', 'f3a5fbe9-eec8-535b-b6bb-cf28d081e8f8'),  -- A Morte dos Primogênitos do Egito — Gustave Doré
  ('2026-09-07', '9430ad2c-9e47-51ea-abcf-9e95006283af'),  -- O cordeiro pascal — Josefa de Óbidos
  ('2026-09-08', '9a5a4bd7-dc5a-53f5-9406-87b1408b9e22'),  -- Os Egípcios Pedem que Moisés Parta — Gustave Doré
  ('2026-09-09', '110ed29c-6253-59fd-baff-bcd33c319cb2'),  -- Entrada de Jesus em Jerusalém, 1856 — Autor Desconhecido
  ('2026-09-10', '5d2e6344-3460-57e6-90b4-bec1e587c61a'),  -- Cristo na Tempestade do Mar da Galileia — Jan Bruegel, o Velho
  ('2026-09-11', '9bc1ba0c-b036-51e0-9421-acd7b6c929e1'),  -- Os filhos de Israel atravessando o Mar Vermelho — Henri-Frédéric Schopin
  ('2026-09-12', '7f48e487-6cab-5fea-9360-e671c46cadb9'),  -- O sermão do monte — Carl Bloch
  ('2026-09-13', '74a805d5-791b-575f-b8c0-1f25fc4c1963'),  -- O exército do Faraó no Mar Vermelho — Ticiano
  ('2026-09-14', '7abbdfcc-91b7-5717-9c91-dfce56e624cc'),  -- Moisés salvo das águas — Orazio Gentileschi
  ('2026-09-15', '5db15199-721e-5428-9cc6-8d0d66203426'),  -- O Criador — Jacopo Torriti
  ('2026-09-16', 'b9f99eee-ab7b-5b38-889d-e85d0dd00b31'),  -- Entrada de Cristo em Jerusalém — Antoon Van Dyck
  ('2026-09-17', 'e81d1020-63e7-5941-a37a-81a7e7fe2233'),  -- Trindade — Lucas Cranach, o Velho
  ('2026-09-18', '30ddebbb-a1e5-5d88-bf28-68aa81f515ea'),  -- Trindade — Luca Rossetti
  ('2026-09-19', '468f4fd5-7944-5de7-963b-518c97ce3ed4'),  -- Deixai Vir a Mim os Pequeninos — Fritz von Uhde
  ('2026-09-20', '5fc547a6-2edd-5bdc-9ba4-dab3a2d6a457'),  -- A Parábola dos Trabalhadores na Vinha — Andrei Mironov
  ('2026-09-21', 'd9857e02-0f76-5f5f-970e-0e22365b3496'),  -- Israelitas reunindo o Maná do céu — Hendrick de Clerck - Israelitas reunindo o Maná do céu (The Israelites Gathering Manna)
  ('2026-09-22', '318a8226-2db2-5365-8d2d-e263d46a1ecf'),  -- O dinheiro do tributo — Ticiano
  ('2026-09-23', '007f9985-1c52-5265-8c8b-728c9e1cef90'),  -- A Parábola do Servo Implacável — Claude Vignon
  ('2026-09-24', '31c2fa80-31ce-5cf5-bf92-44522a85bfd3'),  -- A Reconstrução do Templo é Iniciada — Gustave Doré
  ('2026-09-25', '649cc06a-6ecb-5f51-a3e7-93dd9ce0586c'),  -- O Despojamento de Cristo — El Greco
  ('2026-09-26', '088857e9-f810-57b3-9e3c-c50380b54df0'),  -- A Entrada em Jerusalém — Sigmundt Bergk
  ('2026-09-27', '110ed29c-6253-59fd-baff-bcd33c319cb2'),  -- Entrada de Jesus em Jerusalém, 1856 — Autor Desconhecido
  ('2026-09-28', '58a6c742-4f9e-5779-a6a1-a4f2c5b06257')  -- Jetro aconselhando a Moisés — Jan van Bronchorst
ON CONFLICT (date) DO NOTHING;
