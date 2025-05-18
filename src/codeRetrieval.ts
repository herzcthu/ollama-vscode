import * as fs from "fs";
import * as path from "path";

/**
 * Extracts relevant code/config files from the workspace, limiting total files and lines per file for AI context.
 * - Includes only text/code/config files (by extension)
 * - Excludes common output/hidden folders
 * - Limits to N most recently modified files
 * - Truncates each file to the first M lines
 *
 * @param workspacePath Absolute path to the workspace root
 * @param maxFiles Maximum number of files to include (default: 20)
 * @param maxLinesPerFile Maximum lines per file (default: 200)
 * @returns Concatenated string of code snippets with file headers
 */
export function extractRelevantCode(
    workspacePath: string,
    maxFiles = 20,
    maxLinesPerFile = 200
): string {
    const allowedExtensions = [
        ".ts", ".js", ".jsx", ".tsx", ".json", ".md", ".html", ".css", ".mjs", ".cjs", ".yml", ".yaml", ".txt", ".config", ".lock", ".sh", ".bat", ".ps1", ".ini", ".env", ".xml", ".py", ".java", ".go", ".rb", ".php", ".cpp", ".c", ".h", ".cs", ".swift", ".rs", ".kt", ".pl", ".scala", ".vue", ".svelte"
    ];
    const excludeDirs = ["node_modules", "dist", "out", ".git", ".vscode", ".vsce", ".vscode-test", "coverage", "media", "test"];
    const files: { relPath: string, mtime: number }[] = [];

    function walk(dir: string) {
        for (const entry of fs.readdirSync(dir)) {
            const fullPath = path.join(dir, entry);
            const relPath = path.relative(workspacePath, fullPath);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                if (!excludeDirs.includes(entry)) {
                    walk(fullPath);
                }
            } else {
                const ext = path.extname(entry).toLowerCase();
                if (allowedExtensions.includes(ext)) {
                    files.push({ relPath, mtime: stat.mtimeMs });
                }
            }
        }
    }

    console.log('[extractRelevantCode] Walking workspace:', workspacePath);
    walk(workspacePath);
    console.log('[extractRelevantCode] Files found:', files.map(f => f.relPath));

    // Always include a specific file if requested (e.g., for 'explain <filename>' queries)
    if (arguments.length > 3 && typeof arguments[3] === 'string') {
        const mustIncludeFile = arguments[3];
        console.log('[extractRelevantCode] Must-include file:', mustIncludeFile);
        if (mustIncludeFile) {
            const absPath = path.join(workspacePath, mustIncludeFile);
            if (fs.existsSync(absPath)) {
                const stat = fs.statSync(absPath);
                if (stat.isFile()) {
                    if (!files.some(f => f.relPath === mustIncludeFile)) {
                        files.push({ relPath: mustIncludeFile, mtime: stat.mtimeMs + 1e9 });
                        console.log('[extractRelevantCode] Added must-include file:', mustIncludeFile);
                    }
                }
            } else {
                console.log('[extractRelevantCode] Must-include file does not exist:', mustIncludeFile);
            }
        }
    }

    // Sort by most recently modified, limit to maxFiles
    files.sort((a, b) => b.mtime - a.mtime);
    const selected = files.slice(0, maxFiles);
    console.log('[extractRelevantCode] Selected files:', selected.map(f => f.relPath));
    console.log('[extractRelevantCode] Sending files to Ollama:', selected.map(f => f.relPath));

    // Limit system prompt to a safe character length (e.g., 8000 chars)
    const MAX_PROMPT_LENGTH = 8000;
    let prompt = selected.map(({ relPath }) => {
        const absPath = path.join(workspacePath, relPath);
        try {
            let content = fs.readFileSync(absPath, "utf8");
            const lines = content.split("\n");
            if (lines.length > maxLinesPerFile) {
                content = lines.slice(0, maxLinesPerFile).join("\n") + "\n...[truncated]";
                console.log(`[extractRelevantCode] Truncated file: ${relPath}`);
            }
            return `### ${relPath} ###\n${content}\n`;
        } catch (err) {
            console.log(`[extractRelevantCode] Error reading file: ${relPath}`, err);
            return `### ${relPath} ###\n[Error reading file: ${err}]\n`;
        }
    }).join("\n\n");

    if (prompt.length > MAX_PROMPT_LENGTH) {
        console.log(`[extractRelevantCode] System prompt too long (${prompt.length} chars), truncating to ${MAX_PROMPT_LENGTH} chars.`);
        prompt = prompt.slice(0, MAX_PROMPT_LENGTH) + "\n...[system prompt truncated]\n";
    }
    return prompt;
}

/**
 * Extracts code from a single file (active or selected in explorer).
 * Formats the output for clear display in chat (with code block markdown).
 * @param filePath Absolute path to the file
 * @param maxLines Maximum lines to include (default: 200)
 * @returns Code snippet with file header and markdown formatting
 */
export function extractSingleFileCode(filePath: string, maxLines = 200): string {
    if (!filePath || !fs.existsSync(filePath)) {
        return `[File not found: ${filePath}]`;
    }
    try {
        let content = fs.readFileSync(filePath, "utf8");
        const lines = content.split("\n");
        if (lines.length > maxLines) {
            content = lines.slice(0, maxLines).join("\n") + "\n...[truncated]";
        }
        const ext = path.extname(filePath).replace('.', '');
        return `### ${path.basename(filePath)} ###\n\n\`\`\`${ext}\n${content}\n\`\`\``;
    } catch (err) {
        return `[Error reading file: ${filePath}]`;
    }
}
