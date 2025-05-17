const vscode = window.acquireVsCodeApi(); // Ensure VS Code API is available

window.addEventListener("DOMContentLoaded", () => {
    vscode.postMessage({ type: "requestModels" });
});

window.addEventListener("message", (event) => {
    if (event.data.type === "modelsList") {
        console.log("Received models from extension:", event.data.models);

        const modelSelector = document.getElementById("modelSelector");
        modelSelector.innerHTML = ""; // Clear previous options

        event.data.models.forEach(model => {
            const option = document.createElement("option");
            option.value = model;
            option.textContent = model;
            modelSelector.appendChild(option);
        });

        console.log("Dropdown updated with models:", event.data.models);
    }
});
