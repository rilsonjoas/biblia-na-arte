# Arquivado em 2026-08-07

Painel admin + auth inteiros dependiam do Supabase Auth (login/senha via
`@supabase/supabase-js`), que morreu junto com o resto do projeto Supabase.
A API nova (`server/`) é só-leitura pra v1 — não tem auth nem rotas de
escrita ainda.

Nada daqui é importado pelo app ativo (`App.tsx` não referencia mais essas
rotas/componentes), então não entra no bundle de produção. Fica aqui como
referência de UI já pronta (dashboard, modais de criar/editar/deletar obra)
pra quando existir uma API de admin de verdade com autenticação própria —
bem mais fácil adaptar essa UI do que escrever do zero.

**Pra reativar no futuro:** vai precisar de (1) rotas de escrita
autenticadas no `server/`, (2) trocar o cliente Supabase Auth por alguma
outra solução de sessão (JWT próprio, ou outro provedor), (3) reconectar
as rotas em `App.tsx` e o link de admin no `Header.tsx`.
