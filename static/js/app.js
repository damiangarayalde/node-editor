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

class NodeEditor extends EventEmitter {
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
        this.selectedConnection = null; // Add this line
        
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
        const node = {
            id: nodeId,
            x,
            y,
            width: 250,
            height: type === 'Outputs' ? 150 : 100, // Increased height for Output nodes
            type: type,
            title: `${type} ${nodeId}`,
            inputs: type === 'Outputs' ? [
                { id: `in_${nodeId}_vendedor`, name: 'Vendedor' },
                { id: `in_${nodeId}_comprador`, name: 'Comprador' }
            ] : [{ id: `in_${nodeId}`, name: 'Input' }],
            outputs: [{ id: `out_${nodeId}`, name: 'Output' }],
            data: type === 'Inputs' ? {
                name: '',
                surname: '',
                dateOfBirth: '',
                dni: '',
                address: ''
            } : null
        };
        
        this.nodes.push(node);
        this.renderNode(node);
        return node;
    }

    // Update the renderNode method to include JSON fields for Input nodes
    renderNode(node) {
        const nodeEl = document.createElement('div');
        nodeEl.className = 'node';
        nodeEl.style.left = `${node.x}px`;
        nodeEl.style.top = `${node.y}px`;
        nodeEl.style.width = `${node.width}px`;
        nodeEl.dataset.nodeId = node.id;
        
        // Make node draggable
        nodeEl.draggable = true;
        nodeEl.addEventListener('dragstart', (e) => {
            e.preventDefault(); // Prevent default drag behavior
        });
        
        // Node header with title and delete button
        const header = document.createElement('div');
        header.className = 'node-header';
        
        const title = document.createElement('span');
        title.textContent = node.title;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-node-btn';
        deleteBtn.innerHTML = '🗑️';
        deleteBtn.title = 'Delete node';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            this.showDeleteConfirmation(node, () => {
                this.deleteNode(node.id);
            });
        };
        
        header.appendChild(title);
        header.appendChild(deleteBtn);
        
        // Node content
        const content = document.createElement('div');
        content.className = 'node-content';
        
        // Add text window for Output type nodes
        if (node.type === 'Outputs') {
            const textContainer = document.createElement('div');
            textContainer.className = 'node-text-container';
            textContainer.style.position = 'relative';
            textContainer.style.margin = '8px';
            
            const textarea = document.createElement('textarea');
            textarea.className = 'node-textarea';
            
            // Check if this output has a connection
            const connection = this.connections.find(conn => 
                node.inputs.some(input => input.id === conn.target)
            );
            
            textarea.value = connection ? 
                '' : // Will be updated by updateOutputText if connected
                'Contrato de compraventa entre Juan Perez y Tito Fuentes';
                
            textarea.style.resize = 'both';
            textarea.style.minHeight = '100px';
            textarea.style.width = '100%';
            
            textContainer.appendChild(textarea);
            content.appendChild(textContainer);
            
            // Update text if there's a connection
            if (connection) {
                this.updateOutputText(node.inputs[0].id);
            }
        }
        
        // Add buttons for Input type nodes
        if (node.type === 'Inputs') {
            // Add JSON editor before the buttons
            const jsonEditor = document.createElement('div');
            jsonEditor.className = 'json-editor';
            
            const fields = [
                { key: 'name', label: 'Name' },
                { key: 'surname', label: 'Surname' },
                { key: 'dateOfBirth', label: 'Date of Birth', type: 'date' },
                { key: 'dni', label: 'DNI' },
                { key: 'address', label: 'Address' }
            ];

            fields.forEach(field => {
                const fieldContainer = document.createElement('div');
                fieldContainer.className = 'json-field';
                
                const label = document.createElement('label');
                label.textContent = field.label;
                label.className = 'json-label';
                
                const input = document.createElement('input');
                input.type = field.type || 'text';
                input.value = node.data?.[field.key] || '';
                input.className = 'json-input';
                
                input.addEventListener('change', (e) => {
                    node.data = node.data || {};
                    node.data[field.key] = e.target.value;
                    console.log('Updated node data:', node.data);
                });
                
                fieldContainer.appendChild(label);
                fieldContainer.appendChild(input);
                jsonEditor.appendChild(fieldContainer);
            });
            
            content.appendChild(jsonEditor);

            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'node-buttons';
            buttonContainer.style.display = 'flex';
            buttonContainer.style.gap = '8px';
            buttonContainer.style.padding = '8px';
            
            const loadButton = document.createElement('button');
            loadButton.textContent = 'Load';
            loadButton.className = 'node-button';
            loadButton.onclick = (e) => {
                e.stopPropagation();
                console.log('Load clicked for node:', node.id);
            };
            
            const validateButton = document.createElement('button');
            validateButton.textContent = 'Validate';
            validateButton.className = 'node-button';
            validateButton.onclick = (e) => {
                e.stopPropagation();
                console.log('Validate clicked for node:', node.id);
            };
            
            buttonContainer.appendChild(loadButton);
            buttonContainer.appendChild(validateButton);
            content.appendChild(buttonContainer);
        }
        
        // Inputs
        const inputs = document.createElement('div');
        inputs.className = 'node-inputs';
        node.inputs.forEach(input => {
            const inputEl = document.createElement('div');
            inputEl.className = 'node-input';
            inputEl.dataset.connectorId = input.id;
            inputEl.innerHTML = `
                <div class="connector input-connector" 
                     data-connector-id="${input.id}" 
                     data-is-output="false">
                </div>
                <span>${input.name}</span>
            `;
            
            // Add click handler for input connector
            const connectorEl = inputEl.querySelector('.connector');
            connectorEl.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                const rect = connectorEl.getBoundingClientRect();
                const editorRect = this.editor.getBoundingClientRect();
                
                // Calculate the exact center of the connector
                const x = rect.left + (rect.width / 2) - editorRect.left;
                const y = rect.top + (rect.height / 2) - editorRect.top;
                
                this.startConnection(input.id, x, y, false);
            });
            
            inputs.appendChild(inputEl);
        });
        
        // Outputs
        const outputs = document.createElement('div');
        outputs.className = 'node-outputs';
        node.outputs.forEach(output => {
            const outputEl = document.createElement('div');
            outputEl.className = 'node-output';
            outputEl.dataset.connectorId = output.id;
            outputEl.innerHTML = `
                <span>${output.name}</span>
                <div class="connector output-connector" 
                     data-connector-id="${output.id}" 
                     data-is-output="true">
                </div>
            `;
            
            // Add click handler for output connector
            const connectorEl = outputEl.querySelector('.connector');
            connectorEl.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                const rect = connectorEl.getBoundingClientRect();
                const editorRect = this.editor.getBoundingClientRect();
                
                // Calculate the exact center of the connector
                const x = rect.left + (rect.width / 2) - editorRect.left;
                const y = rect.top + (rect.height / 2) - editorRect.top;
                
                this.startConnection(output.id, x, y, true);
            });
            
            outputs.appendChild(outputEl);
        });
        
        content.appendChild(inputs);
        content.appendChild(outputs);
        nodeEl.appendChild(header);
        nodeEl.appendChild(content);
        this.nodesContainer.appendChild(nodeEl);
        
        // Make node draggable
        header.addEventListener('mousedown', (e) => this.startNodeDrag(e, node));
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
        
        const editorRect = this.editor.getBoundingClientRect();
        const x1 = this.connectionStart.x;
        const y1 = this.connectionStart.y;
        const x2 = e.clientX; //- editorRect.left;
        const y2 = e.clientY - editorRect.top;
        
        // Update the temporary connection path
        this.tempConnection.setAttribute('d', NodeEditor.createConnectionPath(x1, y1, x2, y2));
        
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
        // Check if connection already exists
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
            this.updateOutputText(targetId); // Add this line
            
            // Emit event
            this.emit('connectionCreated', { sourceId, targetId });
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
                path.setAttribute('d', NodeEditor.createConnectionPath(x1, y1, x2, y2));
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
            
            this.nodes = data.nodes || [];
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

    // Add this method to NodeEditor class
    updateOutputText(targetId) {
        // Find the output node element
        const outputNode = this.nodes.find(node => {
            return node.type === 'Outputs' && node.inputs.some(input => input.id === targetId);
        });
        
        if (outputNode) {
            // Get connections for both inputs
            const vendedorConn = this.connections.find(conn => 
                conn.target === outputNode.inputs.find(i => i.name === 'Vendedor').id
            );
            const compradorConn = this.connections.find(conn => 
                conn.target === outputNode.inputs.find(i => i.name === 'Comprador').id
            );
            
            // Find source nodes for both connections
            const vendedorNode = vendedorConn ? this.nodes.find(node => 
                node.outputs.some(output => output.id === vendedorConn.source)
            ) : null;
            
            const compradorNode = compradorConn ? this.nodes.find(node => 
                node.outputs.some(output => output.id === compradorConn.source)
            ) : null;
            
            // Update textarea
            const nodeEl = document.querySelector(`[data-node-id="${outputNode.id}"]`);
            const textarea = nodeEl.querySelector('.node-textarea');
            if (textarea) {
                const vendedorName = vendedorNode?.data?.name || 'Unnamed Vendedor';
                const compradorName = compradorNode?.data?.name || 'Unnamed Comprador';
                
                textarea.value = `Contrato de compraventa: 
                El vendedor,  ${vendedorName} \n
                le vende al comprador: ${compradorName}`;
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
        
        // Update connections visualization
        this.updateConnections();
        
        // Update any connected output nodes
        this.nodes
            .filter(n => n.type === 'Outputs')
            .forEach(outputNode => {
                outputNode.inputs.forEach(input => {
                    this.updateOutputText(input.id);
                });
            });
    }

    // Update the showDeleteConfirmation method to call deleteNode
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

    // Add new method to handle connection deletion
    deleteConnection(connection) {
        // Remove from connections array
        const index = this.connections.findIndex(conn => 
            conn.source === connection.source && conn.target === connection.target
        );
        
        if (index > -1) {
            this.connections.splice(index, 1);
            
            // Remove 'connected' class from connectors
            document.querySelectorAll(
                `[data-connector-id="${connection.source}"], [data-connector-id="${connection.target}"]`
            ).forEach(el => el.classList.remove('connected'));
            
            // Clear selection
            this.selectedConnection = null;
            
            // Update output text if it was connected to an output node
            const outputNode = this.nodes.find(node => 
                node.type === 'Outputs' && 
                node.inputs.some(input => input.id === connection.target)
            );
            
            if (outputNode) {
                this.updateOutputText(connection.target);
            }
            
            // Redraw all connections
            this.updateConnections();
        }
    }
}

// Initialize the editor when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing editor...');
    window.nodeEditor = new NodeEditor();
    console.log('Editor initialized');
});
