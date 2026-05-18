# ⚽ Pelada Diferenciada

App completo para gerenciar scouts, times e partidas da pelada — com banco de dados online via Supabase e compartilhamento em tempo real.

## Funcionalidades

- **Placar ao vivo** — atualizado automaticamente a cada gol marcado
- **Scouts por jogador** — Defesa Difícil, Desarme, Gol, Assistência, Falha, Gol de Placa
- **Cartões** — Amarelo, Vermelho e Azul (só marcação, sem afetar pontos)
- **Sorteio de times** — configura número de times, jogadores por time e período de validade
- **Agenda de jogos** — gerada automaticamente com opção de trocar ordem e definir jogo ativo
- **Substituições** durante a partida
- **Finalizar partida** — salva resultado no histórico
- **Ranking** — individual e por time, clicável para ver scouts
- **Editar posição** do peladeiro
- **Compartilhar** — link para modo visualização em tempo real (somente leitura)
- **Sincronização em tempo real** via Supabase Realtime

---

## 🚀 Como configurar

### 1. Criar projeto no Supabase (gratuito)

1. Acesse [supabase.com](https://supabase.com) e crie uma conta
2. Crie um novo projeto
3. Vá em **SQL Editor → New Query**, cole o conteúdo de `supabase/schema.sql` e clique em **RUN**
4. Vá em **Settings → API** e copie:
   - **Project URL** (ex: `https://xxxx.supabase.co`)
   - **anon / public key**

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env`:

```env
REACT_APP_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGci...
```

### 3. Instalar e rodar

```bash
npm install
npm start
```

### 4. Deploy (Netlify / Vercel)

**Netlify:**
1. Conecte o repositório GitHub no Netlify
2. Build command: `npm run build`
3. Publish directory: `build`
4. Em **Site settings → Environment variables**, adicione as variáveis do `.env`

**Vercel:**
1. Conecte o repositório GitHub no Vercel
2. As variáveis de ambiente ficam em **Settings → Environment Variables**

---

## 📁 Estrutura do projeto

```
pelada-diferenciada/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Avatar.jsx         # Avatar circular com iniciais
│   │   ├── Modal.jsx          # Bottom sheet modal reutilizável
│   │   ├── PlayerButton.jsx   # Botão de jogador com pills de scouts
│   │   ├── ScoutModal.jsx     # Modal de marcação de scouts e cartões
│   │   ├── SyncBar.jsx        # Barra de status de sincronização
│   │   └── Toast.jsx          # Notificações temporárias
│   ├── hooks/
│   │   ├── useGameState.js    # Estado global + sync com Supabase
│   │   └── useTimer.js        # Cronômetro da partida
│   ├── lib/
│   │   ├── constants.js       # Scouts, cartões, times, cores
│   │   ├── logo.js            # Logo em base64
│   │   ├── supabase.js        # Cliente Supabase + funções de I/O
│   │   └── utils.js           # Helpers (pontos, formatação, etc.)
│   ├── pages/
│   │   ├── PartidaPage.jsx    # Placar, cronômetro, colunas de jogadores
│   │   ├── ScoutsPage.jsx     # Lista de jogadores agrupada por time
│   │   ├── TimesPage.jsx      # Sorteio, configuração e agenda
│   │   ├── JogadoresPage.jsx  # Cadastro e edição de peladeiros
│   │   └── RankingPage.jsx    # Ranking individual e por time
│   ├── App.jsx                # Componente raiz, roteamento de abas
│   ├── index.js               # Entry point React
│   └── index.css              # CSS global e variáveis
├── supabase/
│   └── schema.sql             # SQL para criar tabela no Supabase
├── .env.example               # Modelo de variáveis de ambiente
├── .gitignore
└── package.json
```

---

## 🔗 Compartilhamento

Clique em **🔗 Compartilhar** no cabeçalho para gerar um link de visualização.  
Quem abrir o link verá a pelada em **modo somente leitura**, atualizado automaticamente via Supabase Realtime.

---

## 📱 Funciona no iOS?

Sim! Por ser um app React hospedado (Netlify/Vercel), abre normalmente no Safari do iPhone.  
Para instalar como app na tela inicial: **Compartilhar → Adicionar à Tela de Início**.

---

## Tecnologias

- [React 18](https://react.dev)
- [Supabase](https://supabase.com) — banco de dados PostgreSQL + Realtime
- [Create React App](https://create-react-app.dev)
