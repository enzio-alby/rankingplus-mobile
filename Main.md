@AGENTS.md

# Ranking+ Mobile — regras do projeto

App mobile do **Ranking+** (Projeto Integrador IV, 8º sem — UniCEUB). Rebuild
iniciado em 29/08/2026 com base no estado final da plataforma web
(`../RANKING+`). O app antigo (`../Ranking_Plus_mobile_old`) é só referência.

## Stack
- Expo SDK 54 · React Native 0.81 · React 19.1 · TypeScript strict (SDK 54 pra bater com o Expo Go instalado; era 57 no scaffold, baixado em 29/08)
- Navegação: `@react-navigation` (native-stack + bottom-tabs)
- Dados: `@tanstack/react-query` + wrapper `apiFetch` (`src/api/client.ts`)
- Sessão: `expo-secure-store` — guarda `{ id, nome, tipo, token }`
- UI: `react-native-paper` + tokens de marca em `src/theme/tokens.ts`
- Offline (planejado): `expo-sqlite` + seed AES + `bcryptjs`

## Regras
1. **Idioma:** tudo em Português Brasil — nomes de função/variável, comentários,
   textos de UI. Inglês só em termo técnico sem tradução (nome de lib).
2. **Token sempre:** toda chamada autenticada passa por `apiFetch`, que anexa
   `Authorization: Bearer` automaticamente. O app antigo não fazia isso e
   quebrou contra o backend pós-S1 — não repetir.
3. **Cor só via tokens:** nenhum hex hardcoded nas telas — usar `src/theme/tokens.ts`.
4. **Cirurgia mínima:** não refatorar o que funciona ao corrigir outra coisa.
5. **Verificar antes de declarar pronto:** `npx tsc --noEmit` limpo +
   `npx expo export --platform android` sem erro + teste da tela no Expo Go /
   emulador. Nunca dizer "deve funcionar".
6. **Plano de teste por mudança:** ver `PLANO-TESTES.md`. Cada tela portada
   ganha os checkboxes FRONT/BACK/FUNÇÃO/VISUAL/ERRO/TESTE.
7. **Escopo e progresso** vivem no vault Obsidian:
   `03_Projects/faculdade/ranking-plus/ranking-plus-mobile-github-projects.md`
   — atualizar a cada avanço (é a base do GitHub Projects deste app).
8. **Admin fora do escopo.** Import de PDF do LinkedIn e recuperação de senha
   também (por ora).

## Backend
- API do web (`../RANKING+/Backend/api2.js`, porta 4000). O app **não** deve
  alterar comportamento existente do backend — só consumir. Exceção acordada:
  rotas novas e aditivas `POST /demo/iniciar` e `POST /demo/encerrar` para o
  modo demonstração.
- `EXPO_PUBLIC_API_URL` (ou `expo.extra.apiUrl` no app.json) aponta pro IP de
  LAN do Laragon.

## Comandos
```
npm start              # Metro / Expo (QR pro Expo Go)
npm run android        # abre no emulador Android
npx tsc --noEmit       # checagem de tipos
npx expo export --platform android   # valida bundle inteiro
node scripts/export-seed.js          # exporta o MySQL atual pro seed local
```
