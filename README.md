# ⚽ Peladeiros Diferenciados

Plataforma web (PWA) para gerenciar **scouts, times, partidas, ranking e finanças** de peladas — multiusuário, com login Google, banco de dados online (Supabase) e sincronização em tempo real entre os membros da mesma pelada.

> App React 18 (Create React App) + Supabase (Auth + PostgreSQL). Deploy em Netlify (`peladadiferenciada.netlify.app`) e Vercel.

---

## ✨ Funcionalidades

### Contas e peladas (multiusuário)
- **Login com Google** (Supabase Auth). Cadastro aberto: quem entra vira proprietário e pode criar N peladas.
- **Perfil** do usuário (nome completo + telefone).
- **Cadastro da pelada** com nome, **cidade/UF**, **horário** e **local**.
- **Busca de peladas** por nome/cidade/UF e **solicitação de entrada** (aprovação pelo dono).
- **Compartilhamento de acesso**: convite por **link** (papel editor/viewer) ou por **e-mail**, com gestão de membros.
- **Papéis**: `owner` (proprietário), `editor` e `viewer` (somente leitura).

### Partida e rodada
- **Iniciar rodada** — libera a finalização de partidas/rodada e lança as diárias automaticamente.
- **Placar ao vivo** — sobe automaticamente ao marcar Gol; ajuste manual com +/−.
- **Cronômetro** configurável por partida.
- **Agenda de jogos** gerada automaticamente (rodízio de times), com troca de ordem e jogo ativo.
- **Substituições** — o substituído vira **reserva** e continua marcável na rodada. Candidatos agrupados por posição.
- **Finalizar partida** — contabiliza scouts no total da temporada, registra MVP e presença (jogos disputados).
- **Finalizar rodada** — apura o destaque do dia, remove convidados e zera a agenda. Só disponível com a rodada iniciada.

### Scouts
- **Scouts por jogador**: Defesa Difícil (+3), Desarme (+2), Gol (+5), Assistência (+3), Falha (−2), Gol de Placa (+8).
- **Cartões**: Amarelo, Vermelho e Azul (só marcação, não afetam pontos).
- **Prazo de ajuste**: scouts podem ser alterados até as **12:00 do dia seguinte** ao início da rodada (o proprietário mantém a permissão de editar após o prazo).
- Distinção entre **partida atual** e **acumulado da temporada** em todas as telas.

### Ranking e destaques
- **Ranking individual e por time** (total da temporada), com nome do time no avatar do jogador.
- **Melhor da partida** e **destaque da rodada**.
- **Prêmios da temporada**: 🏆 Craque, ⚽ Artilheiro, 🛡️ Xerifão, 🎯 Garçom.
- **Melhores por posição** e **Seleção dos melhores** (arte de campo em imagem, estilo escalação).
- **Encerrar temporada** — arquiva o histórico e zera os scouts.
- **Compartilhamento como imagem/story** (prêmios, seleção, destaques) via canvas.

### Financeiro
- **Valores globais** de mensalidade e diária por pelada.
- **Tipo por peladeiro**: Mensalista (com dia de vencimento) ou Diarista.
- **Mensalistas** — controle mês a mês (pago/pendente) + totais recebido/previsto.
- **Diaristas** — a diária é lançada automaticamente como **pendente** ao iniciar a rodada; marcada como paga conforme recebida. Também é possível lançar diária avulsa manualmente.
- Acesso ao módulo restrito a **proprietário e editores** (menu ☰ → 💰 Financeiro).

### Outros
- **Foto por jogador** (avatar).
- **Modo escuro** (tema claro/escuro persistido).
- **Sincronização em tempo real** (polling a cada 4s) entre membros da mesma pelada.
- **PWA** — instalável na tela inicial do celular.

---

## 🗄️ Modelo de dados (Supabase)

Tabelas principais (esquema multi-tenant):

| Tabela | Descrição |
|--------|-----------|
| `profiles` | Perfil do usuário (id → auth.users, nome, e-mail, telefone) |
| `peladas` | Peladas (owner, nome, cidade, estado, horario, local, tokens de convite) |
| `pelada_members` | Membros de cada pelada e seu papel (owner/editor/viewer) |
| `pelada_state` | Estado do jogo por pelada (JSON) — jogadores, times, agenda, scouts, financeiro |
| `pelada_join_requests` | Solicitações de entrada em peladas |

O **estado do jogo** (jogadores, times, agenda, histórico, `roundStartedAt`, `finance`) é persistido como JSON no campo `pelada_state.data`.

### Scripts SQL (`supabase/`) — rodar no SQL Editor, nesta ordem
1. `schema_v2_multitenant.sql` — tabelas base, RLS e triggers.
2. `compartilhamento.sql` — funções de convite/membros.
3. `busca_e_solicitacoes.sql` — busca de peladas e solicitações de entrada.
4. `pelada_horario_local.sql` — colunas `horario` e `local` (idempotente).
5. `migracao_pelada_existente.sql` — apenas se estiver migrando uma pelada antiga.

> Pré-requisito de Auth: habilitar o provider **Google** no Supabase (Client ID/Secret do Google Cloud), configurar o redirect `https://<projeto>.supabase.co/auth/v1/callback` e o **Site URL** apontando para a URL de produção (Netlify), não localhost.

---

## 🚀 Como rodar localmente

```bash
npm install
npm start          # porta 3000
```

O app usa credenciais Supabase com fallback embutido em `src/lib/supabaseClient.js`, então roda sem `.env`. Para apontar para outro projeto/ambiente, defina as variáveis:

```env
REACT_APP_SUPABASE_URL=https://xxxxxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGci...
REACT_APP_SITE_URL=https://peladadiferenciada.netlify.app
```

Build de produção:

```bash
npm run build
```

---

## ☁️ Deploy

**Netlify (produção atual):** conectado ao repositório GitHub — cada push na `main` dispara o deploy.
- Build command: `npm run build`
- Publish directory: `build`

**Vercel:** conecte o repositório; configure as variáveis em *Settings → Environment Variables* (se não usar o fallback).

---

## 📁 Estrutura do projeto

```
src/
├── components/
│   ├── Avatar.jsx           # Avatar circular (foto ou iniciais)
│   ├── FinanceiroModal.jsx  # Módulo financeiro (mensalistas × diaristas)
│   ├── MembrosModal.jsx     # Gestão de membros / convites
│   ├── Modal.jsx            # Bottom sheet reutilizável
│   ├── PlayerButton.jsx     # Botão de jogador com pills de scouts
│   ├── ScoutModal.jsx       # Marcação de scouts e cartões (respeita prazo)
│   ├── SyncBar.jsx          # Status de sincronização
│   ├── ThemeToggle.jsx      # Alternador de tema claro/escuro
│   └── Toast.jsx            # Notificações temporárias
├── context/
│   ├── AuthContext.jsx      # Sessão/usuário/perfil (Supabase Auth)
│   └── ThemeContext.jsx     # Tema claro/escuro
├── data/
│   └── peladasApi.js        # CRUD de peladas, membros, busca e solicitações
├── hooks/
│   ├── useGameState.js      # Estado do jogo + sync com Supabase (por pelada)
│   └── useTimer.js          # Cronômetro
├── lib/
│   ├── constants.js         # Scouts, cartões, times, INITIAL_STATE, INITIAL_FINANCE
│   ├── fifaLineup.js        # Arte de escalação (imagem)
│   ├── logo.js              # Logo
│   ├── shareCard.js         # Cards de compartilhamento (imagem)
│   ├── supabase.js          # I/O do estado do jogo (whitelist de persistência)
│   ├── supabaseClient.js    # Cliente Supabase autenticado
│   └── utils.js             # Helpers (pontos, financeiro, prazo, formatação)
├── pages/
│   ├── LoginPage.jsx        # Login Google
│   ├── CompletarPerfilPage.jsx
│   ├── PeladasPage.jsx      # Lista/criação/edição/busca de peladas
│   ├── GameShell.jsx        # Shell do jogo (abas + menu ☰)
│   ├── PartidaPage.jsx      # Placar, cronômetro, rodada, substituições
│   ├── ScoutsPage.jsx       # Jogadores por time (+ reservas)
│   ├── TimesPage.jsx        # Sorteio, configuração e agenda
│   ├── JogadoresPage.jsx    # Cadastro/edição de peladeiros e fotos
│   ├── RankingPage.jsx      # Ranking individual e por time + temporadas
│   └── DestaquesPage.jsx    # Prêmios, seleção e destaques (compartilhamento)
├── assets/                  # Emblema/ícones usados na UI
├── App.jsx                  # Roteador de fluxo (login → perfil → peladas → jogo)
├── index.js
└── index.css                # Tokens de tema (claro/escuro) e estilos globais
brand/                       # Material-fonte da identidade visual (logos/ícones)
supabase/                    # Scripts SQL
```

---

## 🏗️ Notas de arquitetura

- **Estilo inline** (não usa Tailwind/shadcn) — mantém o padrão do projeto.
- **Persistência do estado do jogo**: `saveState` (`src/lib/supabase.js`) usa uma **whitelist** de campos de topo. Todo campo novo de topo do estado precisa ser adicionado lá, senão não persiste.
- **Sistema de pontos**: Defesa +3, Desarme +2, Gol +5, Assistência +3, Falha −2, Gol de Placa +8.

---

## Tecnologias

- [React 18](https://react.dev) + [Create React App](https://create-react-app.dev)
- [Supabase](https://supabase.com) — Auth (Google) + PostgreSQL + RLS
- Canvas API — geração das artes de compartilhamento
