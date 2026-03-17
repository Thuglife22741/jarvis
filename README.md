# J.A.R.V.I.S. - Just A Rather Very Intelligent System
## Artificial Intelligence Assistant Engine

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![ElevenLabs](https://img.shields.io/badge/ElevenLabs-Conversational_AI-orange?style=for-the-badge)](https://elevenlabs.io/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT_Powered-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com/)

![Interface JARVIS](./publico/interface.png)

> "Peace matches worth of even the most powerful weapon." — Tony Stark

J.A.R.V.I.S. is a futuristic AI voice assistant interface inspired by the legendary Stark Industries technology. It combines cutting-edge WebRTC voice technology with a sophisticated tool-dispatching backend to provide a seamless, low-latency conversational experience.

---

## 💎 Features

- **Real-time Voice Core**: Ultra-low latency conversation powered by ElevenLabs WebRTC SDK.
- **MCP Integration**: Fully integrated with **Rube MCP (Model Context Protocol)** to execute real-world tasks (Calendar, Agenda, Tool use).
- **Hybrid Brain Architecture**: Intelligent coordination between ElevenLabs' voice engine and a custom Node.js backend using OpenAI's latest models.
- **Futuristic UI/UX**:
  - **Animated Sci-Fi Core**: Dynamic orbital rings that react to voice activity.
  - **Spline 3D Visuals**: Immersive 3D backgrounds for a premium experience.
  - **TechTerminal**: A real-time system log component showing background processes.
- **Persistent Connection**: Robust WebRTC session management with auto-reconnection and diagnostic logging.

---

## 🛠 Tech Stack

### Frontend (The Interface)
- **Framework**: React 18 + TypeScript + Vite.
- **Styling**: Tailwind CSS + shadcn/ui.
- **Animation**: Framer Motion (for liquid smooth transitions).
- **3D Engine**: @spline/react-spline.

### Backend (The Brain)
- **Server**: Node.js + Express (tsx runtime).
- **Intelligence**: OpenAI SDK (Function calling / Tool use).
- **Protocol**: MCP (Model Context Protocol) for tool discovery and execution.
- **Voice**: ElevenLabs Conversational AI (WebSocket/WebRTC).

---

## 🏗 Technical Architecture

J.A.R.V.I.S. operates on a three-layer synchronization model:

1.  **Voice Layer**: The frontend establishes a WebRTC connection directly with ElevenLabs for millisecond-latency voice processing.
2.  **Logic Layer**: A custom Node.js backend intercepting prompts to enrich them with context or trigger external tools.
3.  **Action Layer (MCP)**: The Rube MCP Manager connects to external services, allowing J.A.R.V.I.S. to read your calendar, manage tasks, and interact with the physical world.

---

## 🚀 Deployment & Installation

### 1. Prerequisites
- Node.js (Latest LTS)
- ElevenLabs Account (Agent ID & API Key)
- OpenAI API Key
- Rube MCP Access (Optional but recommended for tools)

### 2. Installation
```sh
# Clone the Stark Industries repository
git clone <YOUR_GIT_URL>
cd jarvis

# Install system dependencies
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory. This is critical for system authorization.

```env
# --- FRONTEND (Vite) ---
VITE_ELEVENLABS_AGENT_ID=your_agent_id_here

# --- BACKEND (Server) ---
ELEVENLABS_API_KEY=your_elevenlabs_key
OPENAI_API_KEY=your_openai_key
OPENAI_ASSISTANT_ID=your_assistant_id (optional)

# --- MCP TOOLS (Rube) ---
RUBE_MCP_URL=https://rube.app/mcp
RUBE_MCP_TOKEN=your_rube_token
```

### 4. Activation
To start the full system (Frontend + Backend) simultaneously:
```sh
npm run dev:all
```
The system will be accessible at `http://localhost:5173`.

---

## 📁 Project Structure

```text
├── server/               # Stark Backend (Node.js)
│   ├── index.ts          # Main Server & OpenAI Logic
│   ├── mcp-manager.ts    # Rube MCP Integration
│   └── recipes-map.ts    # Tool Dispatcher
├── src/                  # Stark UI (React)
│   ├── components/       # Sci-Fi Components (JarvisCore, Terminal)
│   ├── contexts/         # Conversation State Management
│   └── pages/            # View Layers
└── .agent/               # Antigravity AI Engineering protocols
```

---

<br/>

# J.A.R.V.I.S. - Sistema de Inteligência Artificial
## Motor de Assistência de Voz Futurista

![Interface JARVIS](./publico/interface.png)

> "A paz vale mais do que qualquer arma poderosa." — Tony Stark

O J.A.R.V.I.S. é uma interface futurista de assistente de voz com IA, inspirada na lendária tecnologia das Indústrias Stark. Ele combina tecnologia de voz WebRTC de última geração com um backend sofisticado de execução de ferramentas para proporcionar uma experiência de conversação fluida e de baixa latência.

---

## 💎 Funcionalidades

- **Núcleo de Voz em Tempo Real**: Conversação de ultra-baixa latência alimentada pelo SDK WebRTC da ElevenLabs.
- **Integração MCP**: Totalmente integrado ao **Rube MCP (Model Context Protocol)** para executar tarefas do mundo real (Calendário, Agenda, Uso de Ferramentas).
- **Arquitetura de Cérebro Híbrido**: Coordenação inteligente entre o motor de voz da ElevenLabs e um backend personalizado em Node.js utilizando os modelos mais recentes da OpenAI.
- **UI/UX Futurista**:
  - **Núcleo Sci-Fi Animado**: Anéis orbitais dinâmicos que reagem à atividade da voz.
  - **Visuais 3D Spline**: Fundos imersivos em 3D para uma experiência premium.
  - **TechTerminal**: Um componente de log do sistema em tempo real que mostra os processos em background.
- **Conexão Persistente**: Gerenciamento robusto de sessão WebRTC com reconexão automática e logs de diagnóstico.

---

## 🛠 Stack Tecnológica

### Frontend (A Interface)
- **Framework**: React 18 + TypeScript + Vite.
- **Estilização**: Tailwind CSS + shadcn/ui.
- **Animações**: Framer Motion (para transições suaves como líquido).
- **Motor 3D**: @spline/react-spline.

### Backend (O Cérebro)
- **Servidor**: Node.js + Express (tsx runtime).
- **Inteligência**: OpenAI SDK (Function calling / Tool use).
- **Protocolo**: MCP (Model Context Protocol) para descoberta e execução de ferramentas.
- **Voz**: ElevenLabs Conversational AI (WebSocket/WebRTC).

---

## 🏗 Arquitetura Técnica

O J.A.R.V.I.S. opera em um modelo de sincronização de três camadas:

1.  **Camada de Voz**: O frontend estabelece uma conexão WebRTC diretamente com a ElevenLabs para processamento de voz com latência de milissegundos.
2.  **Camada de Lógica**: Um backend Node.js que intercepta os prompts para enriquecê-los com contexto ou disparar ferramentas externas.
3.  **Camada de Ação (MCP)**: O Rube MCP Manager conecta-se a serviços externos, permitindo que o J.A.R.V.I.S. leia seu calendário, gerencie tarefas e interaja com o mundo físico.

---

## 🚀 Instalação e Configuração

### 1. Pré-requisitos
- Node.js (Versão LTS mais recente)
- Conta ElevenLabs (Agent ID & API Key)
- Chave de API da OpenAI
- Acesso ao Rube MCP (Opcional, mas recomendado para ferramentas)

### 2. Instalação
```sh
# Clone o repositório das Indústrias Stark
git clone <URL_DO_SEU_GIT>
cd jarvis

# Instale as dependências do sistema
npm install
```

### 3. Configuração de Ambiente
Crie um arquivo `.env` no diretório raiz. Isso é fundamental para a autorização do sistema.

```env
# --- FRONTEND (Vite) ---
VITE_ELEVENLABS_AGENT_ID=seu_agent_id_aqui

# --- BACKEND (Servidor) ---
ELEVENLABS_API_KEY=sua_chave_elevenlabs
OPENAI_API_KEY=sua_chave_openai
OPENAI_ASSISTANT_ID=seu_assistant_id (opcional)

# --- FERRAMENTAS MCP (Rube) ---
RUBE_MCP_URL=https://rube.app/mcp
RUBE_MCP_TOKEN=seu_token_rube
```

### 4. Ativação
Para iniciar o sistema completo (Frontend + Backend) simultaneamente:
```sh
npm run dev:all
```
O sistema estará acessível em `http://localhost:5173`.

---

## 📁 Estrutura do Projeto

```text
├── server/               # Stark Backend (Node.js)
│   ├── index.ts          # Servidor Principal & Lógica OpenAI
│   ├── mcp-manager.ts    # Integração Rube MCP
│   └── recipes-map.ts    # Despachante de Ferramentas
├── src/                  # Stark UI (React)
│   ├── components/       # Componentes Sci-Fi (JarvisCore, Terminal)
│   ├── contexts/         # Gerenciamento de Estado da Conversa
│   └── pages/            # Camadas de Visão
└── .agent/               # Protocolos de Engenharia Antigravity AI
```

---

<p align="center">
  <i>"Sir, I've processed the data. The system is ready for your command."</i>
</p>
