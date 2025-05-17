import * as vscode from "vscode";
import fetch from "node-fetch";
import { extractRelevantCode } from "./codeRetrieval";
import * as stream from "stream";

/** Retrieve base API URL from user settings with a safe default */
function getApiBaseUrl(): string {
    return vscode.workspace.getConfiguration().get<string>("ollama.apiUrl") || "http://127.0.0.1:11434/api";
}

/** Check if Ollama API is reachable */
async function isOllamaApiAvailable(): Promise<boolean> {
    const baseUrl = getApiBaseUrl();
    try {
        const response = await fetch(baseUrl);
        return response.ok;
    } catch (error) {
        console.error("Error checking Ollama API availability:", error);
        return false;
    }
}

/** Fetch available models dynamically */
export async function getAvailableModels(): Promise<string[]> {
    const apiUrl = `${getApiBaseUrl()}/tags`;

    console.log("Fetching models from:", apiUrl); // Debug log

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`API Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Fetched Models:", data.models.map((model: any) => model.name)); // Debug log
        return data.models.map((model: any) => model.name);
    } catch (error) {
        console.error("Error fetching models:", error);

        // Check if API is accessible
        const apiAvailable = await isOllamaApiAvailable();
        if (!apiAvailable) {
            vscode.window.showErrorMessage("Ollama API is unreachable. Check if Ollama is running.");
        }

        return [];
    }
}

/** Send user message to Ollama API */
export async function sendMessageToOllama(userMessage: string): Promise<string> {
    const workspacePath = vscode.workspace.rootPath || "";
    const relevantCode = extractRelevantCode(workspacePath);
    const optimizedMessage = truncatePrompt(userMessage, 512); // Keep within safe token limit

    const apiUrl = `${getApiBaseUrl()}/chat`;
    const model = vscode.workspace.getConfiguration().get<string>("ollama.model") || "llama3.2";

    console.log("Sending request to Ollama API at:", apiUrl); // Debug log

    const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model: model,
            messages: [
                { role: "system", content: `You are an AI helping with VS Code extension development. Here is relevant code:\n\n${relevantCode}` },
                { role: "user", content: optimizedMessage }
            ]
        })
    });

    if (!response.body) {
        console.error("Ollama API Error: No response body received.");
        return "Error: No response received from Ollama.";
    }

    let completeMessage = "";
    const readableStream = stream.Readable.from(response.body);
    const decoder = new TextDecoder();
    let buffer = "";

    for await (const chunk of readableStream) {
        const textChunk = decoder.decode(chunk);
        buffer += textChunk;

        try {
            const json = JSON.parse(buffer); // Parse only complete JSON objects
            if (json.message?.content) {
                completeMessage += json.message.content;
                buffer = ""; // Reset buffer after successful parsing
            }
        } catch {
            // Ignore parse errors (incomplete JSON chunks) and keep accumulating
        }
    }

    return completeMessage || "No response received from Ollama.";
}

/** Estimate token count based on text length */
export function estimateTokenCount(text: string): number {
    const words = text.split(/\s+/);
    return Math.ceil(words.length * 1.3);
}

/** Truncate prompt to stay within token limits */
export function truncatePrompt(text: string, maxTokens: number): string {
    const words = text.split(/\s+/);
    return words.length > maxTokens ? words.slice(0, maxTokens).join(" ") + " ...[truncated]" : text;
}
