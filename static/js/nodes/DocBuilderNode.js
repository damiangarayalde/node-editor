import BaseNode from './BaseNode.js';

/**
 * DocBuilder Node - Generates documents based on connected nodes
 */
class DocBuilderNode extends BaseNode {
    constructor(options = {}) {
        super({
            type: 'docBuilder',
            title: 'Generador de Documentos',
            inputs: [
                { name: 'Vendedor', type: 'vendedor' },
                { name: 'Comprador', type: 'comprador' }
            ],
            outputs: [
                { name: 'Documento', type: 'document' }
            ],
            data: {
                template: '',
                document: ''
            },
            ...options
        });

        // Customize the appearance
        this.width = 280;
        this.height = 150;
        this.colors = {
            ...this.colors,
            border: '#9b59b6',
            background: '#2c3e50',
            title: '#ecf0f1'
        };
    }

    /**
     * Draw the node content
     * @override
     */
    _drawContent(ctx) {
        const { width, height } = this;
        const startY = 40;
        const padding = 10;
        
        // Set text style
        ctx.fillStyle = this.colors.text;
        ctx.font = '10px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        
        // Draw status
        const statusY = startY + 15;
        ctx.fillText('Estado:', padding, statusY);
        
        // Draw status indicator
        const statusText = this._getStatusText();
        const statusColor = this._getStatusColor();
        
        ctx.fillStyle = statusColor;
        ctx.font = 'bold 10px Arial';
        ctx.fillText(statusText, padding + 50, statusY);
        
        // Draw template preview
        ctx.fillStyle = this.colors.text;
        ctx.font = '10px Arial';
        
        const previewY = startY + 35;
        ctx.fillText('Plantilla:', padding, previewY);
        
        // Show a preview of the template
        const previewText = this.data.template 
            ? 'Plantilla cargada' 
            : 'Sin plantilla';
            
        ctx.fillStyle = this.data.template ? '#2ecc71' : '#95a5a6';
        ctx.fillText(previewText, padding + 50, previewY);
        
        // Draw generate button
        this._drawButton(ctx, 'Generar Documento', width / 2, startY + 70, width - 20, 25);
    }
    
    /**
     * Get the status text based on node state
     * @private
     */
    _getStatusText() {
        switch (this.state) {
            case 'processing':
                return 'Procesando...';
            case 'success':
                return 'Completado';
            case 'error':
                return 'Error';
            default:
                return 'Listo';
        }
    }
    
    /**
     * Get the status color based on node state
     * @private
     */
    _getStatusColor() {
        switch (this.state) {
            case 'processing':
                return this.colors.processing;
            case 'success':
                return this.colors.success;
            case 'error':
                return this.colors.error;
            default:
                return this.colors.text;
        }
    }
    
    /**
     * Draw a button
     * @private
     */
    _drawButton(ctx, text, x, y, width, height) {
        const radius = 5;
        
        // Draw button background
        ctx.beginPath();
        ctx.roundRect(x - width / 2, y - height / 2, width, height, radius);
        
        // Button gradient
        const gradient = ctx.createLinearGradient(0, y - height / 2, 0, y + height / 2);
        gradient.addColorStop(0, '#3498db');
        gradient.addColorStop(1, '#2980b9');
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Button border
        ctx.strokeStyle = '#2980b9';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Button text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x, y);
        
        // Store button bounds for hit testing
        this.generateButton = {
            x: x - width / 2,
            y: y - height / 2,
            width,
            height
        };
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
        
        // Check if the click was on the generate button
        if (this.generateButton && 
            localX >= this.generateButton.x && 
            localX <= this.generateButton.x + this.generateButton.width &&
            localY >= this.generateButton.y && 
            localY <= this.generateButton.y + this.generateButton.height) {
            
            this._handleGenerateClick();
            return true;
        }
        
        return false;
    }
    
    /**
     * Handle generate button click
     * @private
     */
    _handleGenerateClick() {
        this.state = 'processing';
        
        // Simulate document generation
        setTimeout(() => {
            try {
                // In a real app, this would generate the document
                this.data.document = 'Documento generado';
                this.state = 'success';
            } catch (error) {
                console.error('Error generating document:', error);
                this.state = 'error';
            }
        }, 1000);
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
     * Create a DocBuilder node from JSON data
     * @static
     * @param {Object} data - The node data
     * @returns {DocBuilderNode}
     */
    static fromJSON(data) {
        return new this(data);
    }
}

export default DocBuilderNode;
