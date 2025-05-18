# Change Log

All notable changes to the "ollama-vscode" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.0.2] - 2025-05-18

- Fixed and improved Markdown and code block formatting in chat responses.
- Integrated highlight.js and github-dark.min.css for code syntax highlighting.
- Integrated marked.js for Markdown parsing, with highlight.js as the code highlighter.
- Ensured all resources (JS/CSS) are loaded via webview-safe URIs for VS Code CSP compliance.
- Improved model dropdown: model selection updates extension setting immediately.
- Fixed streaming logic to ensure full bot responses are rendered before finalizing.
- Bugfix: code blocks now show correct color formatting and language highlighting.
- Added debug and error handling for partial/final bot responses.

## [0.0.1] - 2025-05-17

- Initial release: Chat with Ollama models in a modern, responsive webview inside VS Code.
- Model selection dropdown auto-populated from Ollama server.
- Code formatting in chat responses.
- Local asset support for logo and webview security.
- Easy configuration of API URL and default model.