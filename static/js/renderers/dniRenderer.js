// Renderer helper for DNI nodes
import { NodeStates, updateNodeTitle, updateNodeSubtitle } from '../nodes.js';

export function renderDNINodeUI(node, editor, container) {
    // Collapsible section
    const collapsible = createCollapsibleSection(node, editor);
    container.appendChild(collapsible);

    // Photo buttons
    const photoButtons = createPhotoButtons(node);
    container.appendChild(photoButtons);

    // Action buttons
    const actionButtons = createActionButtons(node, editor);
    container.appendChild(actionButtons);

    // IO connectors
    const ioContainer = editor.createIOContainer(node);
    container.appendChild(ioContainer);
}





// -------------------- Helper builders --------------------
// Collapsible section and JSON editor
function createCollapsibleSection(node, editor) {
    const collapsible = document.createElement('div');
    collapsible.className = 'collapsible';

    // Header
    const header = document.createElement('div');
    header.className = 'collapsible-header';

    const arrow = document.createElement('span');
    arrow.className = 'collapsible-arrow';
    arrow.textContent = '▼';

    const headerText = document.createElement('span');
    headerText.textContent = 'Info';

    header.appendChild(arrow);
    header.appendChild(headerText);

    // Content
    const content = document.createElement('div');
    content.className = 'collapsible-content';

    const jsonEditor = createJSONEditor(node, editor);
    content.appendChild(jsonEditor);

    header.addEventListener('click', () => {
        arrow.classList.toggle('collapsed');
        content.classList.toggle('expanded');
    });

    collapsible.appendChild(header);
    collapsible.appendChild(content);

    return collapsible;
}

function createJSONEditor(node, editor) {
    const jsonEditor = document.createElement('div');
    jsonEditor.className = 'json-editor';

    const fields = [
        { key: 'name', label: 'Name' },
        { key: 'surname', label: 'Surname' },
        { key: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
        { key: 'dni', label: 'DNI' },
        { key: 'address', label: 'Address' },
    ];

    fields.forEach((f) => createField(f, node, jsonEditor));

    return jsonEditor;
}

// Helper to create individual form fields
function createField(field, node, container) {
    const fieldContainer = document.createElement('div');
    fieldContainer.className = 'json-field';

    const label = document.createElement('label');
    label.textContent = field.label;
    label.className = 'json-label';

    const input = document.createElement('input');
    input.type = field.type || 'text';
    input.value = node.data?.[field.key] || '';
    input.className = 'json-input';

    input.addEventListener('input', (e) => {
        node.data = node.data || {};
        node.data[field.key] = e.target.value;
        updateNodeTitle(node);
        updateNodeSubtitle(node);
    });

    fieldContainer.appendChild(label);
    fieldContainer.appendChild(input);
    container.appendChild(fieldContainer);
}

// Existing helper builders
function createPhotoButtons(node) {
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
