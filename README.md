# GAI Chat - AI Programming Assistant

A modern, ChatGPT-like web application built with React, Vite, and TailwindCSS. This application provides an intelligent AI programming assistant powered by OpenAI's GPT-4o (the most advanced available model), with features like streaming responses, code syntax highlighting, chat history management, and more.

## ✨ Features

- 🤖 **Advanced AI Assistant**: Powered by OpenAI GPT-4o with intelligent system prompts for programming tasks
- 💬 **Chat Interface**: Beautiful, responsive UI similar to ChatGPT
- 📝 **Chat History**: Create, rename, delete, and manage multiple chat conversations
- ⚡ **Streaming Responses**: Real-time streaming of AI responses for natural conversation flow
- 💻 **Code Highlighting**: Automatic syntax highlighting for code blocks with copy functionality
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🌙 **Dark Mode**: Modern dark theme optimized for extended use
- 💾 **Local Storage**: All chats and settings stored locally in your browser
- 🔒 **Secure API Key**: API key stored locally, never exposed in source code

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- OpenAI API Key ([Get one here](https://platform.openai.com/api-keys))

### Installation

1. **Clone or download this repository**

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:5173`

5. **Enter your OpenAI API Key:**
   - On first launch, you'll be prompted to enter your OpenAI API key
   - The key is stored locally in your browser's localStorage
   - Never shared or sent to any server

## 📦 Build for Production

```bash
npm run build
```

The built files will be in the `dist` folder, ready for deployment.

## 🌐 Deploy to GitHub Pages

### Method 1: Using gh-pages (Recommended)

1. **Install gh-pages globally (if not already installed):**
   ```bash
   npm install -g gh-pages
   ```

2. **Deploy:**
   ```bash
   npm run deploy
   ```

   This will:
   - Build the project
   - Deploy to the `gh-pages` branch
   - Make your app available at `https://[username].github.io/WEBAI-GITHUB/`

### Method 2: Manual Deployment

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Push the `dist` folder to the `gh-pages` branch:**
   ```bash
   git subtree push --prefix dist origin gh-pages
   ```

3. **Enable GitHub Pages:**
   - Go to your repository settings
   - Navigate to Pages section
   - Select `gh-pages` branch as source
   - Save

### Important Notes for GitHub Pages

- The `base` path in `vite.config.ts` is set to `/WEBAI-GITHUB/`
- If your repository name is different, update the `base` path accordingly
- After deployment, your app will be available at: `https://[username].github.io/WEBAI-GITHUB/`

## 🛠️ Project Structure

```
├── public/
│   └── Gambar/              # Logo and static assets
├── src/
│   ├── components/          # React components
│   │   ├── APIKeyModal.tsx  # API key input modal
│   │   ├── ChatWindow.tsx   # Main chat interface
│   │   ├── CodeBlock.tsx    # Code syntax highlighter
│   │   ├── InputBox.tsx     # Message input component
│   │   ├── MessageBubble.tsx # Individual message display
│   │   └── Sidebar.tsx      # Chat history sidebar
│   ├── hooks/               # Custom React hooks
│   │   ├── useChat.ts       # Chat management logic
│   │   └── useLocalStorage.ts # LocalStorage hook
│   ├── prompts/             # AI system prompts
│   │   └── systemPrompt.ts  # Advanced AI agent prompt
│   ├── utils/               # Utility functions
│   │   ├── api.ts           # OpenAI API integration
│   │   └── localStorage.ts  # Storage management
│   ├── App.tsx              # Main application component
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles
├── index.html
├── package.json
├── vite.config.ts           # Vite configuration
├── tailwind.config.js       # TailwindCSS configuration
└── tsconfig.json            # TypeScript configuration
```

## 🎨 Customization

### Changing the Base Path

If deploying to a different GitHub Pages path, update `vite.config.ts`:

```typescript
export default defineConfig({
  base: '/YOUR-REPO-NAME/',
  // ...
})
```

### Modifying AI Behavior

Edit `src/prompts/systemPrompt.ts` to customize the AI's behavior, personality, and capabilities.

### Styling

The app uses TailwindCSS. Modify `tailwind.config.js` and `src/index.css` to customize the appearance.

## 🔒 Security & Privacy

- **API Key Storage**: Your OpenAI API key is stored only in your browser's localStorage
- **No Backend**: This is a fully client-side application - no data is sent to any server except OpenAI
- **Local Storage**: All chat history is stored locally in your browser
- **No Tracking**: No analytics, tracking, or data collection

## 🐛 Troubleshooting

### API Key Issues

- **Invalid API Key Error**: Make sure your API key is correct and has sufficient credits
- **Reset API Key**: Click "Reset API Key" in the sidebar to enter a new key

### Build Issues

- **Module not found**: Run `npm install` again
- **Type errors**: Make sure you're using Node.js 18+ and TypeScript 5+

### Deployment Issues

- **404 on GitHub Pages**: Check that the `base` path in `vite.config.ts` matches your repository name
- **CORS errors**: Make sure you're using the correct base path and the build was successful

## 📝 Usage Tips

1. **Start a New Chat**: Click "New Chat" in the sidebar
2. **Rename Chat**: Hover over a chat in the sidebar and click the edit icon
3. **Delete Chat**: Hover over a chat and click the delete icon
4. **Code Blocks**: Code blocks automatically have syntax highlighting and a copy button
5. **Streaming**: Responses stream in real-time for a natural conversation feel
6. **Context Management**: The app automatically manages context to stay within token limits

## 🤝 Contributing

Feel free to fork this project and customize it for your needs!

## 📄 License

This project is open source and available for personal and commercial use.

## 🙏 Acknowledgments

- Built with [React](https://react.dev/)
- Styled with [TailwindCSS](https://tailwindcss.com/)
- Powered by [OpenAI](https://openai.com/)
- Bundled with [Vite](https://vitejs.dev/)

---

**Note**: This application requires an OpenAI API key with sufficient credits. You are responsible for any API usage costs.

