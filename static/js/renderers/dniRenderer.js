// Renderer helper for DNI nodes
export function renderDNINodeUI(node, editor, container) {
    // Collapsible info section (JSON form)
    const collapsible = editor.createCollapsibleSection(node);
    container.appendChild(collapsible);

    // Photo capture buttons (front / back)
    const photoButtons = editor.createPhotoButtons(node);
    container.appendChild(photoButtons);

    // Action buttons (load / validate)
    const actionButtons = editor.createActionButtons(node);
    container.appendChild(actionButtons);

    // Inputs / outputs
    const ioContainer = editor.createIOContainer(node);
    container.appendChild(ioContainer);
}
