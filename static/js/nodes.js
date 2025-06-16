/* Node type definitions extracted from app.js for better modularity */

/*
 * Exported constant with all possible node states so both the editor and each
 * node class can share the same source-of-truth.
 */
export const NodeStates = {
    DNI: {
        EMPTY: 'empty',
        IMAGES_LOADED: 'images_loaded',
        DATA_EXTRACTED: 'data_extracted',
        VALIDATED: 'validated'
    },
    DOC_BUILDER: {
        DISCONNECTED: 'disconnected',
        INPUTS_CONNECTED: 'inputs_connected',
        DOCUMENT_BUILT: 'document_built',
        VALIDATED: 'validated'
    }
};

// ---------------------------------------------------------------------------
// Base class with shared logic & structure. Specific nodes extend from this.
// ---------------------------------------------------------------------------
export class BaseNode {
    constructor(id, x, y, type = 'default', title = '', width = 375, height = 100) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.title = title;
        this.state = null;
        this.inputs = [];
        this.outputs = [];
        this.data = null;
    }

    // Default renderer – can be overridden by subclasses if they need custom UI.
    // `editor` is the NodeEditor instance, `container` is the node-content div.
    renderContent(editor, container) {
        editor.renderDefaultNode(this, container);
    }
}

// ---------------------------------------------------------------------------
// DNI node – collects DNI data, images, etc.
// ---------------------------------------------------------------------------
import { renderDNINodeUI } from './renderers/dniRenderer.js';
import { renderDocBuilderNodeUI } from './renderers/docBuilderRenderer.js';

export class DNINode extends BaseNode {
    constructor(id, x, y) {
        super(id, x, y, 'dni', 'Empty');
        this.state = NodeStates.DNI.EMPTY;
        this.inputs = [{ id: `in_${id}`, name: 'Input' }];
        this.outputs = [{ id: `out_${id}`, name: 'Output' }];
        this.data = {
            name: '',
            surname: '',
            dateOfBirth: '',
            dni: '',
            address: ''
        };
    }

    renderContent(editor, container) {
        renderDNINodeUI(this, editor, container);
    }
}

// ---------------------------------------------------------------------------
// DocBuilder node – builds contract/document when both inputs are connected.
// ---------------------------------------------------------------------------
export class DocBuilderNode extends BaseNode {
    constructor(id, x, y) {
        super(id, x, y, 'DocBuilder', 'DocBuilder empty', 375, 150);
        this.state = NodeStates.DOC_BUILDER.DISCONNECTED;
        this.inputs = [
            { id: `in_${id}_vendedor`, name: 'Vendedor' },
            { id: `in_${id}_comprador`, name: 'Comprador' }
        ];
        this.outputs = [{ id: `out_${id}`, name: 'Output' }];
    }

    renderContent(editor, container) {
        renderDocBuilderNodeUI(this, editor, container);
    }
}

// ---------------------------------------------------------------------------
// Helper to revive plain JSON objects into proper class instances when loading
// from the backend. Keeps app.js free from node-type switch statements.
// ---------------------------------------------------------------------------
export function reviveNode(raw) {
    switch (raw.type) {
        case 'dni':
            return Object.assign(new DNINode(raw.id, raw.x, raw.y), raw);
        case 'DocBuilder':
            return Object.assign(new DocBuilderNode(raw.id, raw.x, raw.y), raw);
        default:
            return Object.assign(
                new BaseNode(raw.id, raw.x, raw.y, raw.type, raw.title),
                raw,
            );
    }
}
