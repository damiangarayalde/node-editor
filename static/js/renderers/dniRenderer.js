// Renderer helper for DNI nodes
import { NodeStates } from '../nodes.js';
export function renderDNINodeUI(node, editor, container) {
    // Collapsible info section (JSON form)
    const collapsible = editor.createCollapsibleSection(node);
    container.appendChild(collapsible);

    // Photo capture buttons (front / back)
    const photoButtons = createPhotoButtons(node, editor);
    container.appendChild(photoButtons);

    // Action buttons (load / validate)
    const actionButtons = createActionButtons(node, editor);
    container.appendChild(actionButtons);

    // Inputs / outputs
    const ioContainer = editor.createIOContainer(node);
    container.appendChild(ioContainer);
}

// -------------------- Helper builders --------------------
function createPhotoButtons(node, editor) {
    const container = document.createElement('div');
    container.className = 'photo-capture-buttons';

    // Front photo button
    const frontPhotoBtn = document.createElement('button');
    frontPhotoBtn.className = 'photo-capture-btn';
    frontPhotoBtn.innerHTML = `<span class="icon">📸</span> Tomar foto frente DNI`;
    frontPhotoBtn.onclick = (e) => {
        e.stopPropagation();
        console.log('Capture front photo for node:', node.id);
    };

    // Back photo button
    const backPhotoBtn = document.createElement('button');
    backPhotoBtn.className = 'photo-capture-btn';
    backPhotoBtn.innerHTML = `<span class="icon">📸</span> Tomar foto dorso DNI`;
    backPhotoBtn.onclick = (e) => {
        e.stopPropagation();
        console.log('Capture back photo for node:', node.id);
    };

    container.appendChild(frontPhotoBtn);
    container.appendChild(backPhotoBtn);

    return container;
}

function createActionButtons(node, editor) {
    const container = document.createElement('div');
    container.className = 'node-buttons';
    container.style.display = 'flex';
    container.style.gap = '8px';
    container.style.padding = '8px';

    const loadButton = document.createElement('button');
    loadButton.textContent = 'Load';
    loadButton.className = 'node-button';
    loadButton.onclick = (e) => {
        e.stopPropagation();
        if (node.state === NodeStates.DNI.EMPTY) {
            node.state = NodeStates.DNI.IMAGES_LOADED;
            editor.updateNodeDisplay(node);
            // Show the validate button after loading
            validateButton.style.display = 'block';
        }
    };

    const validateButton = document.createElement('button');
    validateButton.textContent = 'Validate';
    validateButton.className = 'node-button';
    validateButton.style.display = 'none'; // Initially hidden
    validateButton.onclick = (e) => {
        e.stopPropagation();
        if (node.state === NodeStates.DNI.IMAGES_LOADED) {
            node.state = NodeStates.DNI.VALIDATED;
            editor.updateNodeDisplay(node);
        }
    };

    container.appendChild(loadButton);
    container.appendChild(validateButton);

    return container;
}
