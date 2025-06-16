import { NodeStates, BaseNode, DNINode, DocBuilderNode, reviveNode } from './nodes.js';

class EventEmitter {
    constructor() {
        this.events = {};
    }

    on(event, listener) {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
        return this;
    }

    off(event, listener) {
        if (!this.events[event]) return this;
        
        const idx = this.events[event].indexOf(listener);
        if (idx > -1) {
            this.events[event].splice(idx, 1);
        }
        return this;
    }

    emit(event, ...args) {
        if (!this.events[event]) return false;
        
        const listeners = this.events[event].slice();
        for (let i = 0; i < listeners.length; i++) {
            listeners[i].apply(this, args);
        }
        return true;
    }
}


class NodeGraphEditor extends EventEmitter {
    // Generate a smooth SVG path for connections
    static createConnectionPath(x1, y1, x2, y2) {
        const deltaX = Math.abs(x2 - x1);
        const curve = Math.min(deltaX * 0.5, 100); // Limit the curve size
        
        // Calculate control points for a smooth curve
        const cp1x = x1 + curve;
        const cp1y = y1;
        const cp2x = x2 - curve;
        const cp2y = y2;
        
        return `M${x1},${y1} C${cp1x},${cp1y} ${cp2x},${cp2y} ${x2},${y2}`;
    }
    constructor() {
        super();
        console.log('NodeEditor constructor called');
        this.nodes = [];
        this.connections = [];
        this.selectedNode = null;
        this.dragging = false;
        this.connecting = false;
        this.connectionStart = null;
        this.tempConnection = null;
        this.offsetX = 0;
        this.offsetY = 0;
        this.nextNodeId = 1;
        this.selectedConnection = null; 
        
        this.init();
    }

    init() {
        console.log('Initializing editor...');
        this.editor = document.getElementById('editor');
        this.nodesContainer = document.getElementById('nodes');
        this.connectionsSvg = document.getElementById('connections');
        
        console.log('Editor elements:', {
            editor: this.editor,
            nodesContainer: this.nodesContainer,
            connectionsSvg: this.connectionsSvg
        });
        
        // Set up SVG for connections
        this.connectionsSvg.style.position = 'absolute';
        this.connectionsSvg.style.top = '0';
        this.connectionsSvg.style.left = '0';
        this.connectionsSvg.style.width = '100%';
        this.connectionsSvg.style.height = '100%';
        this.connectionsSvg.style.pointerEvents = 'none';
        
        this.setupEventListeners();
        this.loadNodes();
    }

    setupEventListeners() {
        // Update node button listeners with console logs for debugging
        document.querySelectorAll('.node-type-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                console.log('Button clicked:', button.dataset.nodeType);
                const nodeType = button.dataset.nodeType;
                const node = this.addNode(100, 100, nodeType);
                console.log('Node added:', node);
            });
        });
        
        // Save button
        document.getElementById('save').addEventListener('click', () => this.saveNodes());
        
        // Editor mouse events
        this.editor.addEventListener('mousedown', (e) => this.startDrag(e));
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        // Prevent default drag behavior
        this.editor.addEventListener('dragover', (e) => e.preventDefault());
        this.editor.addEventListener('drop', (e) => e.preventDefault());
        
        // Add click handler to editor for deselecting connections
        this.editor.addEventListener('click', (e) => {
            if (e.target === this.editor || e.target === this.connectionsSvg) {
                if (this.selectedConnection) {
                    const path = document.querySelector(`[data-connection-id="${this.selectedConnection.id}"]`);
                    if (path) {
                        path.classList.remove('selected');
                    }
                    this.selectedConnection = null;
                }
            }
        });
        
        // Add keyboard event listener for deleting connections
        document.addEventListener('keydown', (e) => {
            if ((e.key === 'Delete' || e.key === 'Backspace') && this.selectedConnection) {
                e.preventDefault(); // Prevent browser back navigation on backspace
                this.deleteConnection(this.selectedConnection);
            }
        });
    }

    // Update the addNode method to include default JSON data
    addNode(x = 100, y = 100, type = 'default') {
        const nodeId = this.nextNodeId++;
        let node;
        switch (type) {
            case 'dni':
                node = new DNINode(nodeId, x, y);
                break;
            case 'DocBuilder':
                node = new DocBuilderNode(nodeId, x, y);
                break;
            default:
                node = new BaseNode(nodeId, x, y, type, `${type} ${nodeId}`);
                node.inputs = [{ id: `in_${nodeId}`, name: 'Input' }];
                node.outputs = [{ id: `out_${nodeId}`, name: 'Output' }];
        }

        
        this.nodes.push(node);
        this.renderNode(node);
        return node;
    }

    renderNode(node) {
        const nodeEl = document.createElement('div');
        nodeEl.className = 'node';
        nodeEl.style.left = `${node.x}px`;
        nodeEl.style.top = `${node.y}px`;
        nodeEl.style.width = `${node.width}px`;
        nodeEl.dataset.nodeId = node.id;
        nodeEl.dataset.state = node.state;
        
        // Make node draggable
        nodeEl.draggable = true;
        nodeEl.addEventListener('dragstart', (e) => e.preventDefault());
        
        // Create base structure
        const header = this.createNodeHeader(node);
        const content = document.createElement('div');
        content.className = 'node-content';

        // Render node's UI via its own renderer
        node.renderContent(this, content);
        
        nodeEl.appendChild(header);
        nodeEl.appendChild(content);
        this.nodesContainer.appendChild(nodeEl);
        
        // Make node draggable
        header.addEventListener('mousedown', (e) => this.startNodeDrag(e, node));
    }

    createNodeHeader(node) {
        const header = document.createElement('div');
        header.className = 'node-header';
        
        const titleContainer = document.createElement('div');
        titleContainer.className = 'node-title';
        
        const titleMain = document.createElement('div');
        titleMain.className = 'node-title-main';
        
        const title = document.createElement('span');
        title.textContent = node.title;
        titleMain.appendChild(title);
        
        // Add delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-node-btn';
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            this.showDeleteConfirmation(node, () => this.deleteNode(node.id));
        };
        
        titleContainer.appendChild(titleMain);
        titleContainer.appendChild(deleteBtn);
        header.appendChild(titleContainer);
        
        return header;
    }





    renderDefaultNode(node, content) {
        // Add inputs/outputs for default node type
        const ioContainer = this.createIOContainer(node);
        content.appendChild(ioContainer);
    }

    createIOContainer(node) {
        const container = document.createElement('div');
        
        // Create inputs
        const inputs = document.createElement('div');
        inputs.className = 'node-inputs';
        node.inputs.forEach(input => {
            const inputEl = this.createConnector(input, false);
            inputs.appendChild(inputEl);
        });
        
        // Create outputs
        const outputs = document.createElement('div');
        outputs.className = 'node-outputs';
        node.outputs.forEach(output => {
            const outputEl = this.createConnector(output, true);
            outputs.appendChild(outputEl);
        });
        
        container.appendChild(inputs);
        container.appendChild(outputs);
        return container;
    }

    createConnector(connector, isOutput) {
        const el = document.createElement('div');
        el.className = isOutput ? 'node-output' : 'node-input';
        
        const connectorEl = document.createElement('div');
        connectorEl.className = `connector ${isOutput ? 'output-connector' : 'input-connector'}`;
        connectorEl.dataset.connectorId = connector.id;
        
        const label = document.createElement('span');
        label.textContent = connector.name;
        
        if (isOutput) {
            el.appendChild(label);
            el.appendChild(connectorEl);
        } else {
            el.appendChild(connectorEl);
            el.appendChild(label);
        }
        
        // Add connector event listeners
        this.setupConnectorEvents(connectorEl, isOutput);
        
        return el;
    }

    setupConnectorEvents(connectorEl, isOutput) {
        connectorEl.addEventListener('mousedown', (e) => {
            if (e.button === 0) {  // Left click only
                e.stopPropagation();
                const rect = connectorEl.getBoundingClientRect();
                const x = rect.left + rect.width / 2;
                const y = rect.top + rect.height / 2;
                this.startConnection(connectorEl.dataset.connectorId, x, y, isOutput);
            }
        });
    }


    createCollapsibleSection(node) {
        const collapsible = document.createElement('div');
        collapsible.className = 'collapsible';
        
        // Create header
        const collapsibleHeader = document.createElement('div');
        collapsibleHeader.className = 'collapsible-header';
        
        const arrow = document.createElement('span');
        arrow.className = 'collapsible-arrow';
        arrow.textContent = '▼';
        
        const headerText = document.createElement('span');
        headerText.textContent = 'Info';
        
        collapsibleHeader.appendChild(arrow);
        collapsibleHeader.appendChild(headerText);
        
        // Create content
        const collapsibleContent = document.createElement('div');
        collapsibleContent.className = 'collapsible-content';
        
        // Add JSON editor
        const jsonEditor = this.createJSONEditor(node);
        collapsibleContent.appendChild(jsonEditor);
        
        // Add toggle functionality
        collapsibleHeader.addEventListener('click', () => {
            arrow.classList.toggle('collapsed');
            collapsibleContent.classList.toggle('expanded');
        });
        
        // Assemble
        collapsible.appendChild(collapsibleHeader);
        collapsible.appendChild(collapsibleContent);
        
        return collapsible;
    }

    createJSONEditor(node) {
        const jsonEditor = document.createElement('div');
        jsonEditor.className = 'json-editor';
        
        const fields = [
            { key: 'name', label: 'Name' },
            { key: 'surname', label: 'Surname' },
            { key: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
            { key: 'dni', label: 'DNI' },
            { key: 'address', label: 'Address' }
        ];
    
        fields.forEach(field => this.createField(field, node, jsonEditor));
        
        return jsonEditor;
    }

    createField(field, node, container) {
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
            this.updateNodeTitle(node);
            this.updateNodeSubtitle(node);
        });
        
        fieldContainer.appendChild(label);
        fieldContainer.appendChild(input);
        container.appendChild(fieldContainer);
    }


    
    // Add method to update node display
    updateNodeDisplay(node) {
        const nodeEl = document.querySelector(`[data-node-id="${node.id}"]`);
        if (!nodeEl) return;
        
        const titleSpan = nodeEl.querySelector('.node-title-main span:last-child');
        if (titleSpan && node.type === 'dni') {
            titleSpan.textContent = `DNI: ${node.data?.dni || 'sin datos'} (${node.state})`;
        }
    }

    startNodeDrag(e, node) {
        e.stopPropagation();
        e.preventDefault();
        
        // Only start dragging on left mouse button
        if (e.button !== 0) return;
        
        this.dragging = true;
        this.selectedNode = node;
        
        // Store the initial offset from the mouse to the node's position
        const nodeEl = document.querySelector(`[data-node-id="${node.id}"]`);
        if (nodeEl) {
            const rect = nodeEl.getBoundingClientRect();
            this.offsetX = e.clientX - rect.left;
            this.offsetY = e.clientY - rect.top;
            
            // Add dragging class for visual feedback
            nodeEl.classList.add('dragging');
            
            // Bring node to front
            const maxZIndex = Math.max(
                ...Array.from(document.querySelectorAll('.node'))
                    .map(el => parseInt(window.getComputedStyle(el).zIndex) || 0)
            );
            nodeEl.style.zIndex = maxZIndex + 1;
        }
    }

    handleMouseMove(e) {
        if (this.dragging && this.selectedNode) {
            e.preventDefault();
            
            const nodeEl = document.querySelector(`[data-node-id="${this.selectedNode.id}"]`);
            if (!nodeEl) return;
            
            const editorRect = this.editor.getBoundingClientRect();
            
            // Calculate new position with bounds checking
            let x = e.clientX - editorRect.left - this.offsetX;
            let y = e.clientY - editorRect.top - this.offsetY;
            
            // Keep node within editor bounds
            const nodeWidth = nodeEl.offsetWidth;
            const nodeHeight = nodeEl.offsetHeight;
            
            x = Math.max(0, Math.min(x, editorRect.width - nodeWidth));
            y = Math.max(0, Math.min(y, editorRect.height - nodeHeight));
            
            // Update node position
            nodeEl.style.left = `${x}px`;
            nodeEl.style.top = `${y}px`;
            
            // Update the node's position in the data model
            this.selectedNode.x = x;
            this.selectedNode.y = y;
            
            // Update connections immediately for smooth dragging
            this.updateConnections();
        } else if (this.connecting) {
            this.updateTempConnection(e);
        }
    }
    
    handleMouseUp(e) {
        if (this.dragging) {
            // Remove dragging class from all nodes
            document.querySelectorAll('.node').forEach(node => {
                node.classList.remove('dragging');
            });
            
            this.dragging = false;
            this.selectedNode = null;
        } else if (this.connecting && this.connectionStart) {
            this.finishConnection(e);
        }
    }
    
    stopDrag() {
        if (this.dragging) {
            // Remove dragging class from all nodes
            document.querySelectorAll('.node').forEach(node => {
                node.classList.remove('dragging');
            });
            
            this.dragging = false;
            this.selectedNode = null;
        }
    }
    
    startConnection(connectorId, x, y, isOutput) {
        this.connecting = true;
        this.connectionStart = { connectorId, x, y, isOutput };
        
        // Create a temporary connection
        this.tempConnection = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.tempConnection.classList.add('connection', 'temp');
        this.connectionsSvg.appendChild(this.tempConnection);
    }
    
    updateTempConnection(e) {
        if (!this.connectionStart) return;
        
        // ---
        // const sourceRect = sourceConnector.getBoundingClientRect();
        // const editorRect = this.editor.getBoundingClientRect();

        // // Calculate center points of the connector circles
        // const x1 = sourceRect.left - editorRect.left + sourceRect.width ;
        // const y1 = sourceRect.top + (sourceRect.height / 2) - editorRect.top;
      
        
        
        const editorRect = this.editor.getBoundingClientRect();
        const x1 = this.connectionStart.x;
        const y1 = this.connectionStart.y - editorRect.top;
        const x2 = e.clientX; 
        const y2 = e.clientY - editorRect.top;
        
        // Update the temporary connection path
        this.tempConnection.setAttribute('d', NodeGraphEditor.createConnectionPath(x1, y1, x2, y2));
        
        // Check if we're hovering over a valid connector
        const targetEl = document.elementFromPoint(e.clientX, e.clientY);
        const targetConnector = targetEl?.closest('[data-connector-id]');
        
        if (targetConnector) {
            const isTargetOutput = targetConnector.classList.contains('output-connector');
            const isValid = this.connectionStart.isOutput !== isTargetOutput;
            
            // Update connection style based on validity
            this.tempConnection.classList.toggle('invalid', !isValid);
            this.tempConnection.classList.toggle('valid', isValid);
            
            // Highlight the target connector
            document.querySelectorAll('.connector.highlight').forEach(el => {
                el.classList.remove('highlight');
            });
            
            if (isValid) {
                targetConnector.classList.add('highlight');
            }
        } else {
            // Reset styles when not hovering over a connector
            this.tempConnection.classList.remove('invalid', 'valid');
            document.querySelectorAll('.connector.highlight').forEach(el => {
                el.classList.remove('highlight');
            });
        }
    }
    
    finishConnection(e) {
        if (!this.connectionStart) return;
        
        // Find the target connector
        const targetEl = document.elementFromPoint(e.clientX, e.clientY);
        const targetConnector = targetEl?.closest('[data-connector-id]');
        
        if (targetConnector) {
            const targetConnectorId = targetConnector.dataset.connectorId;
            const isTargetOutput = targetConnector.classList.contains('output-connector');
            
            // Only connect output to input or vice versa
            if (this.connectionStart.isOutput !== isTargetOutput) {
                const sourceId = this.connectionStart.isOutput ? this.connectionStart.connectorId : targetConnectorId;
                const targetId = this.connectionStart.isOutput ? targetConnectorId : this.connectionStart.connectorId;
                
                // Check if this would create a cycle
                if (!this.wouldCreateCycle(sourceId, targetId, isTargetOutput)) {
                    // Add the connection
                    this.addConnection(sourceId, targetId);
                } else {
                    console.warn('Connection would create a cycle');
                }
            }
        }
        
        // Clean up
        this.cleanupConnection();
    }
    
    cleanupConnection() {
        if (this.tempConnection) {
            this.connectionsSvg.removeChild(this.tempConnection);
            this.tempConnection = null;
        }
        this.connecting = false;
        this.connectionStart = null;
    }
    
    wouldCreateCycle(sourceId, targetId, isTargetOutput) {
        // If we're connecting an output to an input, check for cycles
        if (!isTargetOutput) {
            const visited = new Set();
            const queue = [targetId];
            
            while (queue.length > 0) {
                const current = queue.shift();
                
                // If we've seen this node before, we have a cycle
                if (visited.has(current)) {
                    return true;
                }
                
                visited.add(current);
                
                // Find all nodes connected to the current node's outputs
                const connectedNodes = this.connections
                    .filter(conn => conn.source === current)
                    .map(conn => conn.target);
                
                queue.push(...connectedNodes);
            }
        }
        
        return false;
    }
    
    addConnection(sourceId, targetId) {
        // Check if this exact connection already exists
        const exists = this.connections.some(
            conn => conn.source === sourceId && conn.target === targetId
        );
        
        if (!exists) {
            // Mark connectors as connected
            document.querySelectorAll(`[data-connector-id="${sourceId}"], [data-connector-id="${targetId}"]`)
                .forEach(el => el.classList.add('connected'));
                
            this.connections.push({
                id: `${sourceId}-${targetId}`,
                source: sourceId,
                target: targetId
            });
            
            this.updateConnections();
           
            this.emit('connectionCreated', { sourceId, targetId });

            // Update DocBuilder state if needed
            const targetNode = this.nodes.find(node =>
                node.type === 'DocBuilder' && node.inputs.some(input => input.id === targetId)
            );
            if (targetNode) {
                this.updateDocBuilderState(targetNode);
            }
        }
   }

    updateConnections() {
        // Clear existing connections
        this.connectionsSvg.innerHTML = '';
        
        // Update all connections
        this.connections.forEach(conn => {
            const sourceConnector = document.querySelector(`[data-connector-id="${conn.source}"]`);
            const targetConnector = document.querySelector(`[data-connector-id="${conn.target}"]`);
            
            if (sourceConnector && targetConnector) {
                const sourceRect = sourceConnector.getBoundingClientRect();
                const targetRect = targetConnector.getBoundingClientRect();
                const editorRect = this.editor.getBoundingClientRect();
                
                // Calculate center points of the connector circles
                const x1 = sourceRect.left - editorRect.left + sourceRect.width ;
                const y1 = sourceRect.top + (sourceRect.height / 2) - editorRect.top;
                const x2 = targetRect.left - editorRect.left;  
                const y2 = targetRect.top + (targetRect.height / 2) - editorRect.top;


                // Create path for the connection
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', NodeGraphEditor.createConnectionPath(x1, y1, x2, y2));
                path.classList.add('connection');
                path.dataset.connectionId = conn.id;
                
                // Add click handler for selection
                path.addEventListener('click', (e) => {
                    e.stopPropagation();
                    
                    // Deselect previously selected connection
                    if (this.selectedConnection) {
                        const prevPath = document.querySelector(`[data-connection-id="${this.selectedConnection.id}"]`);
                        if (prevPath) {
                            prevPath.classList.remove('selected');
                        }
                    }
                    
                    // Select this connection
                    this.selectedConnection = conn;
                    path.classList.add('selected');
                });
                
                this.connectionsSvg.appendChild(path);
            }
        });
    }

    async loadNodes() {
        try {
            const response = await fetch('/api/nodes');
            const data = await response.json();
            
            // Clear existing nodes
            this.nodesContainer.innerHTML = '';
            
            this.nodes = (data.nodes || []).map(reviveNode);
            this.connections = data.connections || [];
            
            // Fix the syntax error and update nextNodeId
            if (this.nodes.length > 0) {
                this.nextNodeId = Math.max(...this.nodes.map(n => n.id)) + 1;
            }
            
            // Render each node
            this.nodes.forEach(node => this.renderNode(node));
            
            // Update connections after nodes are rendered
            setTimeout(() => this.updateConnections(), 0);
            
        } catch (error) {
            console.error('Error loading nodes:', error);
            // Add a default node if loading fails
            this.addNode(100, 100);
        }
    }

    async saveNodes() {
        try {
            await fetch('/api/nodes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nodes: this.nodes,
                    connections: this.connections
                }),
            });
            alert('Nodes saved successfully!');
        } catch (error) {
            console.error('Error saving nodes:', error);
            alert('Failed to save nodes');
        }
    }

    // Step 1: Get input fields from connected nodes
    getInputFields(outputNode) {
        const fields = {
            vendedor: [],
            comprador: []
        };
        
        // Get all Vendedor connections
        const vendedorConnections = this.connections.filter(conn => 
            conn.target === outputNode.inputs.find(i => i.name === 'Vendedor').id
        );
        
        // Get all Comprador connections
        const compradorConnections = this.connections.filter(conn => 
            conn.target === outputNode.inputs.find(i => i.name === 'Comprador').id
        );
        
        // Process Vendedor connections
        vendedorConnections.forEach(conn => {
            const vendedorNode = this.nodes.find(node => 
                node.outputs.some(output => output.id === conn.source)
            );
            if (vendedorNode?.data) {
                fields.vendedor.push(vendedorNode.data);
            }
        });
        
        // Process Comprador connections
        compradorConnections.forEach(conn => {
            const compradorNode = this.nodes.find(node => 
                node.outputs.some(output => output.id === conn.source)
            );
            if (compradorNode?.data) {
                fields.comprador.push(compradorNode.data);
            }
        });
        
        return fields;
    }

    // Update getTemplateText to be async
    async getTemplateText(fields) {
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
                return this.getFallbackTemplate();
            }
        } catch (error) {
            console.error('Error calling template API:', error);
            return this.getFallbackTemplate();
        }
    }

    // Add fallback template method
    getFallbackTemplate() {
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

    // Step 3: Replace placeholders with actual values
    replaceFieldValues(template, fields) {
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

    // Update the existing updateOutputText method to use the new methods
    async updateOutputText(targetId) {
        const outputNode = this.nodes.find(node => {
            return node.type === 'DocBuilder' && node.inputs.some(input => input.id === targetId);
        });
        
        if (outputNode) {
            const nodeEl = document.querySelector(`[data-node-id="${outputNode.id}"]`);
            const textarea = nodeEl.querySelector('.node-textarea');
            
            if (textarea) {
                try {
                    // Get the fields
                    const fields = this.getInputFields(outputNode);
                    
                    // Get the LLM-generated template
                    const template = await this.getTemplateText(fields);
                    
                    // Replace the values
                    const finalText = this.replaceFieldValues(template, fields);
                    
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
    
    // Add this method to NodeEditor class
    deleteNode(nodeId) {
        // Find the node to be deleted
        const node = this.nodes.find(n => n.id === nodeId);
        if (!node) return;
        
        // Find all connections related to this node's inputs and outputs
        const relatedConnections = this.connections.filter(conn => {
            // Check both node's inputs and outputs
            return node.inputs.some(input => input.id === conn.target) ||
                   node.outputs.some(output => output.id === conn.source);
        });
        
        // Remove all related connections
        relatedConnections.forEach(conn => {
            const index = this.connections.findIndex(c => 
                c.source === conn.source && c.target === conn.target
            );
            if (index > -1) {
                this.connections.splice(index, 1);
            }
        });
        
        // Remove node from array
        const nodeIndex = this.nodes.findIndex(n => n.id === nodeId);
        if (nodeIndex > -1) {
            this.nodes.splice(nodeIndex, 1);
        }
        
        // Remove node element from DOM
        const nodeEl = document.querySelector(`[data-node-id="${nodeId}"]`);
        if (nodeEl) {
            nodeEl.remove();
        }
        
        this.updateConnections();
        
        this.nodes
            .filter(n => n.type === 'Outputs')
            .forEach(outputNode => {
                outputNode.inputs.forEach(input => {
                    this.updateOutputText(input.id);
                });
            });
    }

    showDeleteConfirmation(node, onConfirm) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        
        const content = document.createElement('div');
        content.className = 'modal-content';
        
        const message = document.createElement('p');
        message.textContent = `Are you sure you want to delete ${node.title}?`;
        
        const buttons = document.createElement('div');
        buttons.className = 'modal-buttons';
        
        const confirmBtn = document.createElement('button');
        confirmBtn.className = 'modal-button confirm';
        confirmBtn.textContent = 'Delete';
        confirmBtn.onclick = () => {
            this.deleteNode(node.id); // Call deleteNode directly
            document.body.removeChild(overlay);
        };
        
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'modal-button cancel';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.onclick = () => {
            document.body.removeChild(overlay);
        };
        
        buttons.appendChild(cancelBtn);
        buttons.appendChild(confirmBtn);
        content.appendChild(message);
        content.appendChild(buttons);
        overlay.appendChild(content);
        document.body.appendChild(overlay);
    }

    deleteConnection(connection) {

        const index = this.connections.findIndex(conn => 
            conn.source === connection.source && conn.target === connection.target
        );
        
        if (index > -1) {
            this.connections.splice(index, 1);
            
            document.querySelectorAll(
                `[data-connector-id="${connection.source}"], [data-connector-id="${connection.target}"]`
            ).forEach(el => el.classList.remove('connected'));
            
            // Clear selection
            this.selectedConnection = null;
            
            // Redraw all connections
            this.updateConnections();

            // Update DocBuilder state if needed
            const targetNode = this.nodes.find(node =>
                node.type === 'DocBuilder' && node.inputs.some(input => input.id === connection.target)
            );
            if (targetNode) {
                this.updateDocBuilderState(targetNode);
            }
        }
    }

    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }
    // Add this to the NodeEditor class in app.js
    updateNodeTitle(node) {
        if (node.type === 'dni' && node.data) {
            const nodeEl = document.querySelector(`[data-node-id="${node.id}"]`);
            if (nodeEl) {
                const titleSpan = nodeEl.querySelector('.node-title-main span:last-child');
                if (titleSpan) {
                    titleSpan.textContent = ` ${node.data.dni || 'sin datos del dni'}`;
                }
            }
        }
    }

    // Add new method for subtitle updates
    updateNodeSubtitle(node) {
        if (node.type === 'dni' && node.data) {
            const nodeEl = document.querySelector(`[data-node-id="${node.id}"]`);
            if (nodeEl) {
                const subtitle = nodeEl.querySelector('.node-subtitle');
                if (subtitle) {
                    subtitle.textContent = node.data.surname || node.data.name ? 
                        `${(node.data.surname || '').toUpperCase()} ${this.capitalizeFirstLetter(node.data.name || '')}` : 
                        'sin datos del apellido y nombre';
                }
            }
        }
   }

    updateDocBuilderState(node) {
        // Check if all inputs are connected
        const allInputsConnected = node.inputs.every(input =>
            this.connections.some(conn => conn.target === input.id)
        );
        
        if (!allInputsConnected) {
            node.state = NodeStates.DOC_BUILDER.DISCONNECTED;
        } else if (node.state === NodeStates.DOC_BUILDER.DISCONNECTED) {
            node.state = NodeStates.DOC_BUILDER.INPUTS_CONNECTED;
        }
        
        this.updateNodeDisplay(node);
    }

    updateNodeDisplay(node) {
        const nodeEl = document.querySelector(`[data-node-id="${node.id}"]`);
        if (!nodeEl) return;
        
        const titleSpan = nodeEl.querySelector(node.type === 'dni' ? 
            '.node-title-main span:last-child' : 
            '.node-title-main span');
        
        if (titleSpan) {
            if (node.type === 'dni') {
                titleSpan.textContent = ` ${node.data?.dni || 'sin datos del dni'} (${node.state})`;
            } else if (node.type === 'DocBuilder') {
                titleSpan.textContent = `${node.title} (${node.state})`;
            }
        }
    }
}

// Initialize the editor when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing editor...');
    window.nodeGraphEditor = new NodeGraphEditor();
    console.log('Editor initialized');
}

);