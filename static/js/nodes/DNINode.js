import BaseNode from './BaseNode.js';

/**
 * DNI Node - Represents a person with DNI information
 */
class DNINode extends BaseNode {
    constructor(options = {}) {
        super({
            type: 'dni',
            title: 'Persona',
            inputs: [{ name: 'Input' }],
            outputs: [{ name: 'Output' }],
            data: {
                name: '',
                surname: '',
                dateOfBirth: '',
                dni: '',
                address: ''
            },
            ...options
        });

        // Customize the appearance
        this.width = 250;
        this.height = 180;
        this.colors = {
            ...this.colors,
            border: '#3498db',
            background: '#2c3e50',
            title: '#ecf0f1'
        };
    }

    /**
     * Draw the node content
     * @override
     */
    _drawContent(ctx) {
        const { width } = this;
        const startY = 40;
        const lineHeight = 20;
        const padding = 10;
        const labelWidth = 80;
        const valueX = labelWidth + padding * 2;
        
        // Set text style
        ctx.fillStyle = this.colors.text;
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        
        // Draw fields
        this._drawField(ctx, 'Nombre:', this.data.name, startY);
        this._drawField(ctx, 'Apellido:', this.data.surname, startY + lineHeight);
        this._drawField(ctx, 'DNI:', this.data.dni, startY + lineHeight * 2);
        this._drawField(ctx, 'Nacimiento:', this.data.dateOfBirth, startY + lineHeight * 3);
        this._drawField(ctx, 'Dirección:', this.data.address, startY + lineHeight * 4);
        
        // Draw a separator line
        ctx.beginPath();
        ctx.strokeStyle = '#7f8c8d';
        ctx.moveTo(padding, startY + lineHeight * 5 + 5);
        ctx.lineTo(width - padding, startY + lineHeight * 5 + 5);
        ctx.stroke();
    }
    
    /**
     * Draw a field with label and value
     * @private
     */
    _drawField(ctx, label, value, y) {
        const padding = 10;
        const labelWidth = 80;
        
        // Draw label
        ctx.fillStyle = '#95a5a6';
        ctx.fillText(label, padding, y);
        
        // Draw value
        ctx.fillStyle = this.colors.text;
        ctx.fillText(value || '______', labelWidth, y);
    }
    
    /**
     * Handle click on the node
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {boolean} True if the click was handled
     */
    handleClick(x, y) {
        // Convert to local coordinates
        const localX = x - this.x;
        const localY = y - this.y;
        
        // Check if the click was on the title bar
        if (localY <= 30) {
            // Start dragging
            this.dragging = true;
            this.dragOffsetX = localX;
            this.dragOffsetY = localY;
            return true;
        }
        
        return false;
    }
    
    /**
     * Handle mouse move
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    handleMouseMove(x, y) {
        if (this.dragging) {
            this.x = x - this.dragOffsetX;
            this.y = y - this.dragOffsetY;
            return true;
        }
        return false;
    }
    
    /**
     * Handle mouse up
     */
    handleMouseUp() {
        this.dragging = false;
    }
    
    /**
     * Create a DNI node from JSON data
     * @static
     * @param {Object} data - The node data
     * @returns {DNINode}
     */
    static fromJSON(data) {
        return new this(data);
    }
}

export default DNINode;
