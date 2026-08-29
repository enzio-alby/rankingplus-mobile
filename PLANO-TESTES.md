# Plano de testes — Ranking+ Mobile

> Roda a cada mudança, antes de marcar qualquer item do checklist como concluído.
> Espelha as categorias do GitHub Projects: **FRONT · BACK · FUNÇÃO · VISUAL · ERRO · TESTE**.

## 1. Portão automático (sempre)
- [ ] `npx tsc --noEmit` — zero erro
- [ ] `npx expo export --platform android` — bundle sem erro (pega import quebrado, alias errado, etc.)
- [ ] `npm test` — suites existentes verdes (quando houver testes)

## 2. Por tela / feature nova (checklist de aceite)
| Categoria | O que verificar |
|---|---|
| **FRONT** | A tela monta, navega e desmonta sem warning no console do Metro. |
| **BACK** | A(s) rota(s) que ela chama existem e respondem (testar com `curl` no backend antes de ligar a UI). Token Bearer presente na request. |
| **FUNÇÃO** | O comportamento bate com o do web para o mesmo dado (mesmo número, mesma ordem, mesma regra). |
| **VISUAL** | Cores/tipografia vêm de `src/theme/tokens.ts`. Alvos de toque ≥ 44px. Contraste legível. Safe area respeitada. |
| **ERRO** | Estados de `loading`, `vazio` e `falha de rede` renderizam algo (não tela branca, não crash). 401 desloga limpo. |
| **TESTE** | Suite Jest da tela passando (mock de `apiFetch`). |

## 3. Fluxo de fumaça (a cada build `preview`)
1. Abre o app → tela inicial aparece com a marca.
2. "Entrar com Google" → seletor de modo demo.
3. Escolhe Demo-Aluno → entra, vê as abas do aluno.
4. Edita algo (quando implementado) → persiste na sessão.
5. "Sair" → volta à tela inicial; reabrir e escolher de novo NÃO traz a edição anterior (demo efêmero).
6. Repete para Demo-Professor e Demo-Empresa.

## 4. Antes de gerar `.aab` (release)
- [ ] `versionCode` incrementado
- [ ] `android.package` = `rankingplus.p4` (confirmado com o grupo — imutável após 1º upload)
- [ ] Testado num Android físico real (não só emulador)
- [ ] Política de privacidade publicada (URL) — exigência da Play Console
