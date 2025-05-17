import * as vscode from "vscode";
import { getAvailableModels } from "./ollamaAPI";
import { sendMessageToOllama } from "./ollamaAPI";

export function setupChat(panel: vscode.WebviewPanel) {
    panel.webview.onDidReceiveMessage(async message => {
        if (message.type === "requestModels") {
            const models = await getAvailableModels();
            console.log("Sending models to WebView:", models); // Debug log
            panel.webview.postMessage({ type: "modelsList", models });
            return;
        }

        if (message.type === "setModel") {
            vscode.workspace.getConfiguration().update("ollama.model", message.model);
            vscode.window.showInformationMessage(`Selected model: ${message.model}`);
            return;
        }

        const response = await sendMessageToOllama(message.text);
        panel.webview.postMessage({ response });
    });
}
