// Renderer helper for DocBuilder nodes
export function renderDocBuilderNodeUI(node, editor, container) {
    // Textarea to show generated document
    const textContainer = document.createElement('div');
    textContainer.className = 'node-text-container';

    const textarea = document.createElement('textarea');
    textarea.className = 'node-textarea';
    textarea.placeholder = 'Generated document will appear here...';
    textarea.readOnly = true;

    textContainer.appendChild(textarea);
    container.appendChild(textContainer);

    // Inputs / outputs
    const ioContainer = editor.createIOContainer(node);
    container.appendChild(ioContainer);
}
