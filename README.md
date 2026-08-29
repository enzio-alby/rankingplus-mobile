# Ranking+ Mobile

App mobile do [Ranking+](../RANKING+) — Projeto Integrador IV (8º semestre, UniCEUB).
React Native + Expo + TypeScript. Rebuild iniciado em 29/08/2026.

## Rodar

```bash
npm install
npm start            # abre o Metro; escaneie o QR com o app Expo Go (Android)
# ou
npm run android      # abre num emulador Android já rodando
```

Ajuste o IP da API em `app.json` → `expo.extra.apiUrl` (IP de LAN do notebook
que roda o backend `../RANKING+/Backend` na porta 4000), ou defina
`EXPO_PUBLIC_API_URL` no ambiente.

## Estrutura

```
src/
├── api/         client.ts (fetch + Bearer automático), auth.ts, <recurso>.ts
├── auth/        session.tsx (SessionProvider, useSession)
├── navigation/  RootNavigator, RoleTabs, types
├── screens/     uma pasta/arquivo por tela
├── components/  componentes reutilizáveis
├── theme/       tokens.ts (marca), paper.ts
├── db/          local.ts (expo-sqlite offline — em construção)
└── types/       api.ts
scripts/
└── export-seed.js   exporta o MySQL atual pro seed local criptografado
```

## Documentação

- **Escopo, checklist e GitHub Projects:** `<vault>/03_Projects/faculdade/ranking-plus/ranking-plus-mobile-github-projects.md`
- **Regras do projeto:** `Main.md`
- **Plano de testes:** `PLANO-TESTES.md`

## Build (Play Store — conta do professor)

```bash
npx eas login
npx eas build --platform android --profile preview      # .apk (instalar direto)
npx eas build --platform android --profile production   # .aab (Play Console → Internal testing)
```
