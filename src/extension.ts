import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { getAvailableModels } from "./ollamaAPI";
import { sendMessageToOllama } from "./ollamaAPI";
import { extractSingleFileCode } from "./codeRetrieval";

export function activate(context: vscode.ExtensionContext) {
    console.log("Ollama VS Code extension is now active!");

    const chatCommand = vscode.commands.registerCommand("ollama-vscode.openChat", async () => {
        const panel = vscode.window.createWebviewPanel(
            "ollamaChat",
            "Ollama Chat",
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        const htmlPath = path.join(context.extensionPath, "media", "webview.html");

        try {
            if (fs.existsSync(htmlPath)) {
                let htmlContent = await fs.promises.readFile(htmlPath, "utf8");

                // Add Content Security Policy (CSP) to allow inline scripts and styles
                htmlContent = htmlContent.replace(
                    "<head>",
                    `<head><meta http-equiv="Content-Security-Policy" content="default-src 'self' vscode-resource:; script-src 'self' 'unsafe-inline' vscode-resource:; style-src 'self' 'unsafe-inline' vscode-resource:;">`
                );

                // Patch script src for marked.min.js to use webview-safe URI
                const markedPath = vscode.Uri.file(path.join(context.extensionPath, 'media', 'marked.min.js'));
                const markedUri = panel.webview.asWebviewUri(markedPath).toString();
                htmlContent = htmlContent.replace(
                    '<script src="./marked.min.js"></script>',
                    `<script src="${markedUri}"></script>`
                );
                // Patch script src for highlight.min.js to use webview-safe URI
                const hljsPath = vscode.Uri.file(path.join(context.extensionPath, 'media', 'highlight.min.js'));
                const hljsUri = panel.webview.asWebviewUri(hljsPath).toString();
                htmlContent = htmlContent.replace(
                    '<script src="./highlight.min.js"></script>',
                    `<script src="${hljsUri}"></script>`
                );
                // Patch highlight.js CSS to use webview-safe URI
                const hljsCssPath = vscode.Uri.file(path.join(context.extensionPath, 'media', 'github-dark.min.css'));
                const hljsCssUri = panel.webview.asWebviewUri(hljsCssPath).toString();
                htmlContent = htmlContent.replace(
                    '<link rel="stylesheet" href="{{HIGHLIGHT_CSS}}">',
                    `<link rel="stylesheet" href="${hljsCssUri}">`
                );

                panel.webview.html = htmlContent;
            } else {
                console.error("Error: webview.html not found!");
                panel.webview.html = "<html><body><h1>Error: webview.html missing!</h1></body></html>";
            }
        } catch (error) {
            console.error("Error loading webview.html:", error);
            panel.webview.html = "<html><body><h1>Failed to load chat UI.</h1></body></html>";
        }

        // Handle messages inside extension.ts (replaces webview.js)
        panel.webview.onDidReceiveMessage(async message => {
            if (message.type === "requestModels") {
                const models = await getAvailableModels();
                panel.webview.postMessage({ type: "modelsList", models });
                return;
            }

            if (message.type === "setModel") {
                vscode.workspace.getConfiguration().update("ollama.model", message.model);
                vscode.window.showInformationMessage(`Selected model: ${message.model}`);
                return;
            }

            if (message.type === "requestLogoUri") {
                // Provide the webview-safe URI for the logo
                const logoPath = vscode.Uri.file(path.join(context.extensionPath, 'media', 'ollama.png'));
                const logoUri = panel.webview.asWebviewUri(logoPath).toString();
                panel.webview.postMessage({ type: 'logoUri', logoUri });
                return;
            }

            // Streaming response to webview
            let fullResponse = "";
            let lastBuffer = "";
            await sendMessageToOllama(message.text, (partial) => {
                fullResponse += partial;
                lastBuffer = partial;
                panel.webview.postMessage({ type: "partialResponse", partial });
            });
            // Ensure the last partial is sent before responseDone
            if (lastBuffer) {
                // Optionally, you could send a final partial here if needed
            }
            panel.webview.postMessage({ type: "responseDone" });
        });
    });

    context.subscriptions.push(chatCommand);
}

export function deactivate() {}
