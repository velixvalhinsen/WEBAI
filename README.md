# GAI Chat - AI Programming Assistant

A modern, ChatGPT-like web application built with React, Vite, and TailwindCSS. This application provides an intelligent AI programming assistant powered by OpenAI's GPT-4o or Groq's Llama models, with features like streaming responses, code syntax highlighting, chat history management, and more.

## ✨ Features

- 🤖 **Advanced AI Assistant**: Powered by OpenAI GPT-4o or Groq Llama models with intelligent system prompts for programming tasks
- 💬 **Chat Interface**: Beautiful, responsive UI similar to ChatGPT
- 📝 **Chat History**: Create, rename, delete, and manage multiple chat conversations
- ⚡ **Streaming Responses**: Real-time streaming of AI responses for natural conversation flow
- 💻 **Code Highlighting**: Automatic syntax highlighting for code blocks with copy functionality
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🌙 **Dark Mode**: Modern dark theme optimized for extended use
- 💾 **Local Storage**: All chats and settings stored locally in your browser
- 🔒 **Secure API Key**: API key stored locally, never exposed in source code
- 🚀 **Proxy Mode**: Optional backend proxy for public use without requiring API keys

## 🚀 Quick Start

### Option 1: Using Backend Proxy (No API Key Required)

1. **Deploy Backend to Vercel:**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy
   vercel
   ```

2. **Set Environment Variables in Vercel:**
   - `GROQ_API_KEY`: Your Groq API key
   - `OPENAI_API_KEY`: (Optional) Your OpenAI API key

3. **Set Proxy URL in Frontend:**
   Create a `.env` file:
   ```env
   VITE_PROXY_URL=https://your-vercel-app.vercel.app
   ```

4. **Build and Deploy:**
   ```bash
   npm run build
   npm run deploy
   ```

### Option 2: Direct API (Requires API Key)

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

5. **Enter your API Key:**
   - On first launch, you'll be prompted to enter your API key
   - The key is stored locally in your browser's localStorage
   - Never shared or sent to any server

## 📦 Build for Production

```bash
npm run build
```

The built files will be in the `dist` folder, ready for deployment.

## 🌐 Deploy to GitHub Pages

### Method 1: Using GitHub Actions (Recommended)

The repository includes a GitHub Actions workflow that automatically deploys to GitHub Pages on every push to `master` branch.

1. **Enable GitHub Pages:**
   - Go to repository Settings → Pages
   - Select "GitHub Actions" as source

2. **Set Environment Variable (if using proxy):**
   - Go to repository Settings → Secrets and variables → Actions
   - Add `VITE_PROXY_URL` secret with your Cloudflare Workers URL
   - **Quick setup:** Jalankan `.\setup-github-secret.ps1` untuk panduan interaktif
   - **Detail lengkap:** Lihat `GITHUB_SECRET_SETUP.md` untuk panduan step-by-step

### Method 2: Manual Deployment

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Deploy:**
   ```bash
   npm run deploy
   ```

### Important Notes for GitHub Pages

- The `base` path in `vite.config.ts` is set to `/WEBAI/`
- If your repository name is different, update the `base` path accordingly
- After deployment, your app will be available at: `https://velixvalhinsen.github.io/WEBAI/`

## 🔧 Backend Proxy Setup (Cloudflare Workers - Recommended)

The backend proxy allows users to use the app without entering an API key. The API key is stored securely on the server.

### Option 1: Cloudflare Workers (FREE & Easy)

1. **Install Wrangler CLI:**
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare:**
   ```bash
   wrangler login
   ```

3. **Set Environment Variables:**
   ```bash
   wrangler secret put GROQ_API_KEY
   # Enter your Groq API key when prompted
   
   # Optional: For OpenAI support
   wrangler secret put OPENAI_API_KEY
   ```

4. **Deploy Worker:**
   ```bash
   npm run deploy:worker
   ```

5. **Get Worker URL:**
   - After deployment, you'll get a URL like: `https://web-ai-proxy.YOUR_SUBDOMAIN.workers.dev`
   - Copy this URL

6. **Update Frontend:**
   - Go to GitHub → Settings → Secrets and variables → Actions
   - Update `VITE_PROXY_URL` secret with your Cloudflare Workers URL
   - Trigger rebuild GitHub Actions

### Option 2: Vercel (Alternative)

1. **Deploy to Vercel:**
   ```bash
   vercel
   ```

2. **Set Environment Variables:**
   - In Vercel dashboard, go to Settings → Environment Variables
   - Add `GROQ_API_KEY` with your Groq API key
   - (Optional) Add `OPENAI_API_KEY` for OpenAI support

3. **Update Frontend:**
   - Set `VITE_PROXY_URL` environment variable to your Vercel URL
   - Rebuild and redeploy frontend

## 🛠️ Project Structure

```
├── api/
│   └── chat.ts              # Vercel serverless function (backend proxy)
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
│   │   ├── api.ts           # OpenAI/Groq API integration
│   │   └── localStorage.ts  # Storage management
│   ├── App.tsx              # Main application component
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles
├── index.html
├── package.json
├── vite.config.ts           # Vite configuration
├── vercel.json              # Vercel configuration
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

- **API Key Storage**: Your API key is stored only in your browser's localStorage (when using direct mode)
- **Backend Proxy**: API keys are stored securely on the server (when using proxy mode)
- **No Backend**: Direct mode is fully client-side - no data is sent to any server except OpenAI/Groq
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
- **Proxy not working**: Check that `VITE_PROXY_URL` is set correctly and backend is deployed

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
- Powered by [OpenAI](https://openai.com/) and [Groq](https://groq.com/)
- Bundled with [Vite](https://vitejs.dev/)
- Deployed with [Vercel](https://vercel.com/) and [GitHub Pages](https://pages.github.com/)

---

**Note**: This application requires an API key (either user-provided or via backend proxy) with sufficient credits. You are responsible for any API usage costs.
