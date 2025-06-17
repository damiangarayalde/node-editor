import { NodeStates } from './nodeStates.js';
import { renderDocBuilderUI } from '../renderers/docBuilderRenderer.js';

export class DocBuilderNode extends BaseNode {
    constructor(id, x, y) {
        super(id, x, y, 'DocBuilder', 'Document Builder', 400, 300);
        
        // Define inputs and outputs
        this.inputs = [
            { id: `in_${id}_vendedor`, name: 'Vendedor' },
            { id: `in_${id}_comprador`, name: 'Comprador' }
        ];
        
        this.outputs = [
            { id: `out_${id}`, name: 'Documento' }
        ];
        
        this.state = NodeStates.DOC_BUILDER.DISCONNECTED;
    }
    
    // Override render method to add DocBuilder specific UI
    render(editor, container) {
        super.render(editor, container);
        
        // Add DocBuilder specific UI
        const content = this.element.querySelector('.node-content');
        renderDocBuilderUI(this, editor, content);
        
        return this.element;
    }
    
    // Update node state based on connections
    updateState(connections) {
        const allInputsConnected = this.inputs.every(input =>
            connections.some(conn => conn.target === input.id)
        );
        
        if (!allInputsConnected) {
            this.state = NodeStates.DOC_BUILDER.DISCONNECTED;
        } else if (this.state === NodeStates.DOC_BUILDER.DISCONNECTED) {
            this.state = NodeStates.DOC_BUILDER.INPUTS_CONNECTED;
        }
        
        this.updateDisplay();
    }
    
    // Update the node's visual representation
    updateDisplay() {
        if (!this.element) return;
        
        const titleSpan = this.element.querySelector('.node-title-main span');
        if (titleSpan) {
            titleSpan.textContent = `${this.title} (${this.state})`;
        }
    }
    
    // Get connected input fields
    getInputFields(nodes, connections) {
        const fields = {
            vendedor: [],
            comprador: []
        };
        
        // Get all Vendedor connections
        const vendedorConnections = connections.filter(conn => 
            conn.target === this.inputs.find(i => i.name === 'Vendedor')?.id
        );
        
        // Get all Comprador connections
        const compradorConnections = connections.filter(conn => 
            conn.target === this.inputs.find(i => i.name === 'Comprador')?.id
        );
        
        // Process Vendedor connections
        vendedorConnections.forEach(conn => {
            const vendedorNode = nodes.find(node => 
                node.outputs.some(output => output.id === conn.source)
            );
            if (vendedorNode?.data) {
                fields.vendedor.push(vendedorNode.data);
            }
        });
        
        // Process Comprador connections
        compradorConnections.forEach(conn => {
            const compradorNode = nodes.find(node => 
                node.outputs.some(output => output.id === conn.source)
            );
            if (compradorNode?.data) {
                fields.comprador.push(compradorNode.data);
            }
        });
        
        return fields;
    }
    
    // Static method to create from serialized data
    static deserialize(data) {
        const node = new this(data.id, data.x, data.y);
        node.state = data.state;
        node.inputs = [...data.inputs];
        node.outputs = [...data.outputs];
        node.data = { ...data.data };
        return node;
    }
}
