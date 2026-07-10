class ToolManager {

    constructor() {
        this.tools = new Map();
    }

    register(tool) {
        this.tools.set(tool.name, tool);
    }

    get(name) {
        return this.tools.get(name);
    }

    getAll() {
        return [...this.tools.values()];
    }

    async execute(name, input) {
    const tool = this.tools.get(name);

    if (!tool) {
        throw new Error(`Tool '${name}' not found.`);
    }

    if (typeof tool.invoke !== "function") {
        throw new Error(`Tool '${name}' does not support invoke()`);
    }

    try {
        return await tool.invoke(input);
    } catch (err) {
        throw new Error(`Tool '${name}' failed: ${err.message}`);
    }
}

}

const toolManager = new ToolManager();

export default toolManager;