import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { getAvailableModels } from "./ollamaAPI";
import { sendMessageToOllama } from "./ollamaAPI";

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

            const response = await sendMessageToOllama(message.text);
            panel.webview.postMessage({ response });
        });
    });

    context.subscriptions.push(chatCommand);
}

export function deactivate() {}
