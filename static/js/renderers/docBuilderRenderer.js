import { NodeStates } from '../nodes.js';

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

// Fallback template when API is not available
export function getFallbackTemplate() {
    return `Contrato de compraventa:

VENDEDORES:
{{#each vendedor}}
- {{this.name}} {{this.surname}}, con DNI {{this.dni}}, domiciliado en {{this.address}}
{{/each}}

COMPRADORES:
{{#each comprador}}
- {{this.name}} {{this.surname}}, con DNI {{this.dni}}, domiciliado en {{this.address}}
{{/each}}`;
}

// Replace template placeholders with actual values
export function replaceFieldValues(template, fields) {
    let text = template;
    
    // Handle each loops for multiple parties
    text = text.replace(/\{\{#each ([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, path, template) => {
        const array = path.split('.').reduce((acc, part) => acc?.[part], fields) || [];
        return array.map(item => {
            let result = template;
            // Replace individual fields
            result = result.replace(/\{\{this\.([^}]+)\}\}/g, (m, field) => {
                const value = item[field] || 'No disponible';
                return `<span class="highlight">${value}</span>`;
            });
            return result;
        }).join('\n');
    });
    
    return text;
}

// Get template text from API or fallback
export async function getTemplateText(fields) {
    try {
        console.log('Sending fields to API:', fields);  // Debug log
        
        const response = await fetch('/api/generate-template', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ fields })
        });
        
        const data = await response.json();
        console.log('API response:', data);  // Debug log
        
        if (data.status === 'success') {
            return data.template;
        } else {
            console.error('Error from API:', data.message);
            return getFallbackTemplate();
        }
    } catch (error) {
        console.error('Error calling template API:', error);
        return getFallbackTemplate();
    }
}

// Get input fields for a DocBuilder node
export function getInputFields(nodes, connections, outputNode) {
    const fields = {
        vendedor: [],
        comprador: []
    };
    
    // Get all Vendedor connections
    const vendedorConnections = connections.filter(conn => 
        conn.target === outputNode.inputs.find(i => i.name === 'Vendedor')?.id
    );
    
    // Get all Comprador connections
    const compradorConnections = connections.filter(conn => 
        conn.target === outputNode.inputs.find(i => i.name === 'Comprador')?.id
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

// Update the output text for a DocBuilder node
export function updateDocBuilderState(node, connections) {
    // Check if all inputs are connected
    const allInputsConnected = node.inputs.every(input =>
        connections.some(conn => conn.target === input.id)
    );
    
    if (!allInputsConnected) {
        node.state = NodeStates.DOC_BUILDER.DISCONNECTED;
    } else if (node.state === NodeStates.DOC_BUILDER.DISCONNECTED) {
        node.state = NodeStates.DOC_BUILDER.INPUTS_CONNECTED;
    }
    
    // Update the node display
    const nodeEl = document.querySelector(`[data-node-id="${node.id}"]`);
    if (nodeEl) {
        const titleSpan = nodeEl.querySelector('.node-title-main span');
        if (titleSpan) {
            titleSpan.textContent = `${node.title} (${node.state})`;
        }
    }
}

export async function updateOutputText(targetId, editor) {
    const outputNode = editor.nodes.find(node => {
        return node.type === 'DocBuilder' && node.inputs.some(input => input.id === targetId);
    });
    
    if (outputNode) {
        const nodeEl = document.querySelector(`[data-node-id="${outputNode.id}"]`);
        const textarea = nodeEl.querySelector('.node-textarea');
        
        if (textarea) {
            try {
                // Get the fields
                const fields = getInputFields(editor.nodes, editor.connections, outputNode);
                
                // Get the LLM-generated template and replace values
                const template = await getTemplateText(fields);
                const finalText = replaceFieldValues(template, fields);
                
                // Create the output div
                const textDiv = document.createElement('div');
                textDiv.className = 'node-textarea';
                textDiv.contentEditable = true;
                textDiv.style.whiteSpace = 'pre-wrap';
                textDiv.innerHTML = finalText;
                
                // Replace the old textarea
                textarea.parentNode.replaceChild(textDiv, textarea);
                
            } catch (error) {
                console.error('Error updating output text:', error);
            }
        }
    }
}
