/**
 * Base class for all nodes in the editor
 */
class BaseNode {
    /**
     * Create a new node
     * @param {Object} options - Node configuration
     * @param {string} options.id - Unique identifier for the node
     * @param {number} options.x - X position
     * @param {number} options.y - Y position
     * @param {string} options.type - Node type
     * @param {string} options.title - Node title
     * @param {Array} options.inputs - Array of input ports
     * @param {Array} options.outputs - Array of output ports
     * @param {Object} options.data - Node-specific data
     * @param {string} options.state - Node state (e.g., 'empty', 'processing', 'success', 'error')
     */
    constructor({
        id,
        x = 0,
        y = 0,
        type = 'base',
        title = 'Node',
        inputs = [],
        outputs = [],
        data = {},
        state = 'empty'
    }) {
        this.id = id || `node-${Date.now()}`;
        this.x = x;
        this.y = y;
        this.type = type;
        this.title = title;
        this.inputs = inputs.map(input => ({
            id: input.id || `in-${Math.random().toString(36).substr(2, 9)}`,
            name: input.name || 'Input',
            ...input
        }));
        this.outputs = outputs.map(output => ({
            id: output.id || `out-${Math.random().toString(36).substr(2, 9)}`,
            name: output.name || 'Output',
            ...output
        }));
        this.data = data;
        this.state = state; // 'empty', 'processing', 'success', 'error'
        this.width = 200;
        this.height = 100;
        this.minimized = false;
        this.selected = false;
        
        // Default colors
        this.colors = {
            border: '#7f8c8d',
            background: '#2c3e50',
            title: '#ecf0f1',
            text: '#ecf0f1',
            success: '#2ecc71',
            error: '#e74c3c',
            processing: '#3498db',
            empty: '#7f8c8d'
        };
    }

    /**
     * Render the node to the canvas
     * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
     */
    render(ctx) {
        // Save the current context state
        ctx.save();
        
        // Set the node position
        ctx.translate(this.x, this.y);
        
        // Draw the node background
        this._drawBackground(ctx);
        
        // Draw the node title bar
        this._drawTitleBar(ctx);
        
        // Draw inputs and outputs
        this._drawPorts(ctx);
        
        // Draw the node content
        this._drawContent(ctx);
        
        // Draw the delete button if node is selected
        if (this.selected) {
            this._drawDeleteButton(ctx);
        }
        
        // Restore the context state
        ctx.restore();
    }
    
    /**
     * Draw the node background
     * @private
     */
    _drawBackground(ctx) {
        const { width, height, colors } = this;
        const borderRadius = 5;
        
        // Draw the node background with border
        ctx.beginPath();
        ctx.roundRect(0, 0, width, height, borderRadius);
        
        // Set the fill and stroke styles based on node state
        ctx.fillStyle = colors.background;
        ctx.strokeStyle = this._getBorderColor();
        ctx.lineWidth = 2;
        
        ctx.fill();
        ctx.stroke();
    }
    
    /**
     * Draw the node title bar
     * @private
     */
    _drawTitleBar(ctx) {
        const { width, colors } = this;
        const titleBarHeight = 30;
        const borderRadius = 5;
        
        // Draw the title bar background
        ctx.beginPath();
        ctx.roundRect(0, 0, width, titleBarHeight, [borderRadius, borderRadius, 0, 0]);
        
        // Create a gradient for the title bar
        const gradient = ctx.createLinearGradient(0, 0, 0, titleBarHeight);
        gradient.addColorStop(0, '#34495e');
        gradient.addColorStop(1, '#2c3e50');
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Draw the title
        ctx.fillStyle = colors.title;
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.title, width / 2, titleBarHeight / 2);
        
        // Draw state indicator
        const indicatorSize = 8;
        const indicatorX = width - 15;
        const indicatorY = titleBarHeight / 2;
        
        ctx.beginPath();
        ctx.arc(indicatorX, indicatorY, indicatorSize, 0, Math.PI * 2);
        ctx.fillStyle = this._getStateColor();
        ctx.fill();
    }
    
    /**
     * Draw input and output ports
     * @private
     */
    _drawPorts(ctx) {
        const { width, height, inputs, outputs } = this;
        const portRadius = 6;
        const portSpacing = 25;
        const startY = 40;
        
        // Draw input ports on the left
        inputs.forEach((input, index) => {
            const y = startY + (index * portSpacing);
            
            // Draw the port
            ctx.beginPath();
            ctx.arc(0, y, portRadius, 0, Math.PI * 2);
            ctx.fillStyle = this._getPortColor(input);
            ctx.fill();
            ctx.strokeStyle = '#ecf0f1';
            ctx.stroke();
            
            // Draw the port label
            ctx.fillStyle = this.colors.text;
            ctx.font = '10px Arial';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(input.name, portRadius + 5, y);
            
            // Store the port position for hit testing
            input.x = 0;
            input.y = y;
        });
        
        // Draw output ports on the right
        outputs.forEach((output, index) => {
            const y = startY + (index * portSpacing);
            
            // Draw the port
            ctx.beginPath();
            ctx.arc(width, y, portRadius, 0, Math.PI * 2);
            ctx.fillStyle = this._getPortColor(output);
            ctx.fill();
            ctx.strokeStyle = '#ecf0f1';
            ctx.stroke();
            
            // Draw the port label
            ctx.fillStyle = this.colors.text;
            ctx.font = '10px Arial';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';
            ctx.fillText(output.name, width - (portRadius + 5), y);
            
            // Store the port position for hit testing
            output.x = width;
            output.y = y;
        });
    }
    
    /**
     * Draw the node content
     * Override this method in child classes
     * @protected
     */
    _drawContent(ctx) {
        // Default implementation - can be overridden by child classes
        const { width, height } = this;
        
        ctx.fillStyle = this.colors.text;
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.type, width / 2, height / 2);
    }
    
    /**
     * Draw the delete button
     * @private
     */
    _drawDeleteButton(ctx) {
        const buttonSize = 15;
        const buttonX = this.width - 5;
        const buttonY = 5;
        
        // Draw the delete button background
        ctx.beginPath();
        ctx.arc(buttonX, buttonY, buttonSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#e74c3c';
        ctx.fill();
        
        // Draw the 'X' icon
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(buttonX - 3, buttonY - 3);
        ctx.lineTo(buttonX + 3, buttonY + 3);
        ctx.moveTo(buttonX + 3, buttonY - 3);
        ctx.lineTo(buttonX - 3, buttonY + 3);
        ctx.stroke();
        
        // Store the button position for hit testing
        this.deleteButton = {
            x: buttonX,
            y: buttonY,
            radius: buttonSize / 2
        };
    }
    
    /**
     * Get the border color based on node state
     * @private
     */
    _getBorderColor() {
        return this.selected ? '#f1c40f' : this.colors.border;
    }
    
    /**
     * Get the state indicator color
     * @private
     */
    _getStateColor() {
        switch (this.state) {
            case 'success':
                return this.colors.success;
            case 'error':
                return this.colors.error;
            case 'processing':
                return this.colors.processing;
            default:
                return this.colors.empty;
        }
    }
    
    /**
     * Get the port color based on connection status
     * @param {Object} port - The port object
     * @private
     */
    _getPortColor(port) {
        return port.connected ? '#2ecc71' : '#95a5a6';
    }
    
    /**
     * Check if a point is inside the node
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean}
     */
    containsPoint(x, y) {
        return (
            x >= this.x &&
            x <= this.x + this.width &&
            y >= this.y &&
            y <= this.y + this.height
        );
    }
    
    /**
     * Check if a point is inside the delete button
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean}
     */
    isOverDeleteButton(x, y) {
        if (!this.deleteButton) return false;
        
        const dx = x - (this.x + this.deleteButton.x);
        const dy = y - (this.y + this.deleteButton.y);
        return Math.sqrt(dx * dx + dy * dy) <= this.deleteButton.radius;
    }
    
    /**
     * Find a port at the given position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {Object|null} The port and its type ('input' or 'output'), or null if not found
     */
    findPortAt(x, y) {
        // Check input ports
        for (const port of this.inputs) {
            const dx = x - (this.x + port.x);
            const dy = y - (this.y + port.y);
            if (Math.sqrt(dx * dx + dy * dy) <= 8) { // 8px radius for hit testing
                return { port, type: 'input' };
            }
        }
        
        // Check output ports
        for (const port of this.outputs) {
            const dx = x - (this.x + port.x);
            const dy = y - (this.y + port.y);
            if (Math.sqrt(dx * dx + dy * dy) <= 8) { // 8px radius for hit testing
                return { port, type: 'output' };
            }
        }
        
        return null;
    }
    
    /**
     * Convert the node to a serializable object
     * @returns {Object}
     */
    toJSON() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            type: this.type,
            title: this.title,
            inputs: this.inputs.map(({ id, name }) => ({ id, name })),
            outputs: this.outputs.map(({ id, name }) => ({ id, name })),
            data: { ...this.data },
            state: this.state
        };
    }
    
    /**
     * Create a node from a JSON object
     * @static
     * @param {Object} data - The node data
     * @returns {BaseNode}
     */
    static fromJSON(data) {
        // This should be implemented by child classes
        return new this(data);
    }
}

export default BaseNode;
