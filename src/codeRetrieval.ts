import * as fs from "fs";
import * as path from "path";

export function extractRelevantCode(workspacePath: string): string {
    const relevantFiles = ["extension.ts", "package.json", "webview.html"];
    return relevantFiles.map(file => {
        const filePath = path.join(workspacePath, file);
        return fs.existsSync(filePath) ? `### ${file} ###\n${fs.readFileSync(filePath, "utf8")}\n` : "";
    }).join("\n\n");
}
