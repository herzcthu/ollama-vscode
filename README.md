# Ollama VSCode Extension

Interact with Ollama AI models directly from Visual Studio Code via a modern chat interface.

## Features
- Chat with Ollama models in a dedicated VS Code webview
- Model selection dropdown (auto-populated from your Ollama server)
- Modern, responsive chat UI with code formatting
- Local asset support for fast, secure logo display
- Easy configuration of API URL and default model

## Getting Started

### 1. Install Ollama
- Download and run Ollama from [https://ollama.com/](https://ollama.com/)
- Ensure the Ollama API server is running (default: `http://localhost:11434/api`)

### 2. Install the Extension
- Install from the VSIX file or the VS Code Marketplace (when published):
  - From VSIX: `code --install-extension ollama-vscode-0.0.1.vsix`

### 3. Open the Chat
- Press `Ctrl+Shift+P` and run `Ollama VSCode: Open Chat`
- The chat webview will appear with model selection and chat input

### 4. Configure Settings (Optional)
- Open VS Code settings and search for `Ollama`
- Set `ollama.apiUrl` to your Ollama server URL if different from default
- Set `ollama.model` to your preferred default model (e.g., `llama3`, `mistral`, etc.)

## Development

### Build & Run
- Install dependencies: `npm install`
- Build: `npm run build` or use the VS Code build task
- Launch the extension: Press `F5` in VS Code to open a new Extension Development Host

### Project Structure
- `src/` — Extension source code (TypeScript)
- `media/` — Webview HTML, JS, and assets (logo, styles)
- `package.json` — Extension manifest and configuration

### Packaging
- To package for distribution: `npx vsce package`

## Screenshots

![Ollama Chat UI](https://github.com/yourusername/ollama-vscode/raw/main/media/ollama.png)

## Troubleshooting
- If the chat UI does not display correctly, ensure your Ollama server is running and accessible.
- If the logo does not appear, make sure `media/ollama.png` exists and is not blocked by CSP.
- For style issues, check that the extension is using the latest code and CSP allows inline styles.

## License
MIT

---

**Enjoy chatting with Ollama in VS Code!**
