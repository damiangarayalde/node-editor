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
