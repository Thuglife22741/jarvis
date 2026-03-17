# JARVIS Voice Assistant

A futuristic AI voice assistant interface inspired by Iron Man's JARVIS, built with React, Vite, and ElevenLabs Conversational AI.

## 🌐 Live Demo

- **Preview**: [Preview URL](https://id-preview--f1e0ed2c-0d4b-4091-a426-18fecfff3843.lovable.app)
- **Published**: [ciano-void-core.lovable.app](https://ciano-void-core.lovable.app)

## ✨ Features

- Real-time voice conversation with an AI agent via ElevenLabs WebRTC
- Animated sci-fi core with orbital rings and audio visualizer
- Responsive dark-themed UI with cyan accent design system
- Auto-reconnection on unexpected disconnects

## 🛠 Tech Stack

| Technology | Purpose |
|------------|---------|
| React + TypeScript | UI framework |
| Vite | Build tool |
| Tailwind CSS | Styling |
| shadcn/ui | Component library |
| ElevenLabs React SDK | Voice AI integration |
| Framer Motion | Animations |

## 🚀 Getting Started

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start the dev server
npm run dev
```

### Environment Variables

Create a `.env` file in the root:

```env
VITE_ELEVENLABS_AGENT_ID=your_agent_id_here
```

## 📁 Project Structure

```
src/
├── components/       # UI components (JarvisCore, AudioVisualizer, etc.)
├── contexts/         # ElevenLabs conversation provider
├── hooks/            # Custom React hooks
├── pages/            # Route pages
└── index.css         # Design tokens & global styles
```

## 📦 Deployment

Open [Lovable](https://lovable.dev) and click **Share → Publish**.

To connect a custom domain: **Project → Settings → Domains → Connect Domain**.

---

# JARVIS Assistente de Voz

Uma interface futurista de assistente de voz com IA inspirada no JARVIS do Homem de Ferro, construída com React, Vite e ElevenLabs Conversational AI.

## 🌐 Demo ao Vivo

- **Preview**: [URL de Preview](https://id-preview--f1e0ed2c-0d4b-4091-a426-18fecfff3843.lovable.app)
- **Publicado**: [ciano-void-core.lovable.app](https://ciano-void-core.lovable.app)

## ✨ Funcionalidades

- Conversa por voz em tempo real com um agente de IA via ElevenLabs WebRTC
- Núcleo sci-fi animado com anéis orbitais e visualizador de áudio
- Interface responsiva com tema escuro e sistema de design com acento ciano
- Reconexão automática em desconexões inesperadas

## 🛠 Stack Tecnológica

| Tecnologia | Finalidade |
|------------|------------|
| React + TypeScript | Framework de UI |
| Vite | Ferramenta de build |
| Tailwind CSS | Estilização |
| shadcn/ui | Biblioteca de componentes |
| ElevenLabs React SDK | Integração de voz com IA |
| Framer Motion | Animações |

## 🚀 Como Começar

```sh
# Clone o repositório
git clone <YOUR_GIT_URL>

# Navegue até o projeto
cd <YOUR_PROJECT_NAME>

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_ELEVENLABS_AGENT_ID=seu_agent_id_aqui
```

## 📁 Estrutura do Projeto

```
src/
├── components/       # Componentes de UI (JarvisCore, AudioVisualizer, etc.)
├── contexts/         # Provider de conversa ElevenLabs
├── hooks/            # Hooks React customizados
├── pages/            # Páginas de rotas
└── index.css         # Tokens de design & estilos globais
```

## 📦 Deploy

Abra o [Lovable](https://lovable.dev) e clique em **Share → Publish**.

Para conectar um domínio customizado: **Project → Settings → Domains → Connect Domain**.
