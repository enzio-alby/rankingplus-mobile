# Ficha da Play Store — Ranking+ (respostas prontas)

## Detalhes do app

- **Nome do app:** `Ranking+`
- **Idioma padrão:** Português (Brasil) — pt-BR
- **Tipo:** App (não é jogo)
- **Gratuito ou pago:** Gratuito
- **Categoria:** Educação
- **E-mail de contato:** `admin.rankingplus@gmail.com`
- **Site / telefone:** deixar em branco

## Descrição breve (máx. 80 caracteres)

```
Desempenho acadêmico verificado como diferencial de carreira.
```

## Descrição completa (máx. 4000 caracteres)

```
O Ranking+ é um aplicativo acadêmico do Projeto Integrador IV do curso de Ciência
da Computação do UniCEUB. Ele transforma o histórico acadêmico verificado do
aluno em um ativo de carreira.

Nesta versão de demonstração você pode explorar os três perfis da plataforma:

• Aluno — dashboard de desempenho (evolução das notas, frequência por
  disciplina, posição no ranking), boletim completo, currículo/perfil ATS,
  mapeamento de perfil comportamental e o Portal de Talentos.

• Professor — visão das turmas, lançamento de menções e faltas, envio de avisos
  para a turma, relatórios com grade de horários e desempenho por turma.

• Empresa — Portal de Talentos com filtros e score de compatibilidade, favoritos
  em formato kanban, publicação de vagas, funil de recrutamento e
  acompanhamento de contratações.

Também inclui chat entre alunos, professores e empresas, notificações e
exportação de relatório em PDF.

Os dados exibidos na demonstração são fictícios e ficam apenas no aparelho,
sendo apagados ao sair do app. É um trabalho acadêmico, sem fins comerciais.
```

## Recursos gráficos

- **Ícone (512×512 PNG):** redimensionar `assets/icon.png` (está 1024×1024) para 512×512.
- **Feature graphic (1024×500):** banner simples, fundo `#020122`, texto "RANKING+"
  em branco com o "+" em `#F4442E`. Pode montar no Canva/Figma/PowerPoint.
- **Screenshots do celular (mínimo 2):** tirar direto do app instalado —
  sugestões: tela inicial, Dashboard do aluno, Portal de Talentos, tela do
  Perfil comportamental.

## App content (declarações obrigatórias)

- **Acesso ao app:** "Todas as funcionalidades estão disponíveis sem acesso
  especial" (a demonstração funciona sem login; o Google é opcional).
- **Anúncios:** o app NÃO contém anúncios.
- **Classificação de conteúdo (questionário IARC):**
  - Categoria: Referência / Educação
  - Violência: Não · Conteúdo sexual: Não · Linguagem imprópria: Não
  - Substâncias controladas: Não · Jogos de azar: Não
  - Os usuários interagem / há conteúdo gerado pelo usuário (chat): **Sim**
  - Compartilha localização: Não
  - → deve resultar em classificação "Livre" ou "10+".
- **Público-alvo:** faixas etárias **13-15, 16-17 e 18+** (marcar essas). NÃO é
  destinado a crianças. Não faz parte do programa "Voltado para a família".
- **App de notícias:** Não.
- **Rastreamento de contato / COVID-19:** Não.
- **Recursos governamentais / financeiros / saúde:** Não.

## Segurança de dados (Data safety)

- **Coleta ou compartilha dados do usuário?** Sim (coleta; não compartilha).
- **Tipos de dados coletados:**
  - Informações pessoais → **Nome** e **Endereço de e-mail** (via login Google,
    opcional).
- **Finalidade:** Funcionalidade do app + Personalização.
- **Os dados são compartilhados com terceiros?** Não.
- **Dados criptografados em trânsito?** Sim.
- **O usuário pode pedir a exclusão dos dados?** Sim (dados da demonstração são
  apagados ao sair; contato por e-mail para os demais).
- **Coleta obrigatória?** Não — o login Google é opcional.

## Política de privacidade

- **URL:** _((https://gist.github.com/enzio-alby/8d28e5472830c4dbf2a0764957733a24)— hospedar o conteúdo de `store/PRIVACY.md`)_

## Release de teste interno

- Faixa: **Teste interno**
- Nome do release: automático (versão + versionCode)
- Notas da versão:
  ```
  Primeira versão de teste — Projeto Integrador IV / UniCEUB.
  ```
- Testadores: criar lista de e-mails, adicionar o e-mail do professor + equipe.
- Enviar o **link de participação** ("Copy link") pro professor.

## IMPORTANTE — SHA-1 do Play App Signing

Depois de criar o app e subir o `.aab`:
Play Console → **Testes e versão → Configuração → Assinatura do app** → copiar o
**SHA-1 do "Certificado da chave de assinatura do app"** → adicionar esse SHA-1
**também** no client OAuth **Android** no Google Cloud (manter o do EAS também).
Sem isso, o login com Google quebra na versão baixada pela Play.
