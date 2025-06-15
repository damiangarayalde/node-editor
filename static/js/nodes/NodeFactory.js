import DNINode from './DNINode.js';
import DocBuilderNode from './DocBuilderNode.js';

/**
 * Factory for creating node instances
 */
class NodeFactory {
    /**
     * Create a node from a type string or configuration object
     * @param {string|Object} typeOrConfig - Node type or configuration object
     * @returns {BaseNode}
     */
    static createNode(typeOrConfig) {
        if (typeof typeOrConfig === 'string') {
            return this.createNodeByType(typeOrConfig);
        } else if (typeof typeOrConfig === 'object' && typeOrConfig !== null) {
            return this.createNodeFromConfig(typeOrConfig);
        }
        
        throw new Error('Invalid node configuration');
    }
    
    /**
     * Create a node by type
     * @param {string} type - Node type
     * @returns {BaseNode}
     */
    static createNodeByType(type) {
        const nodeClasses = {
            'dni': DNINode,
            'docBuilder': DocBuilderNode
            // Add more node types here
        };
        
        const NodeClass = nodeClasses[type];
        if (!NodeClass) {
            throw new Error(`Unknown node type: ${type}`);
        }
        
        return new NodeClass();
    }
    
    /**
     * Create a node from a configuration object
     * @param {Object} config - Node configuration
     * @returns {BaseNode}
     */
    static createNodeFromConfig(config) {
        const { type } = config;
        const nodeClasses = {
            'dni': DNINode,
            'docBuilder': DocBuilderNode
            // Add more node types here
        };
        
        const NodeClass = nodeClasses[type];
        if (!NodeClass) {
            throw new Error(`Unknown node type: ${type}`);
        }
        
        return NodeClass.fromJSON ? 
            NodeClass.fromJSON(config) : 
            new NodeClass(config);
    }
    
    /**
     * Get the default nodes configuration
     * @returns {Array<Object>}
     */
    static getDefaultNodes() {
        return [
            {
                id: 'node-1',
                type: 'dni',
                x: 200,
                y: 100,
                title: 'Persona',
                data: {
                    name: '',
                    surname: '',
                    dateOfBirth: '',
                    dni: '',
                    address: ''
                }
            },
            {
                id: 'node-2',
                type: 'docBuilder',
                x: 600,
                y: 100,
                title: 'Generador de Documentos'
            }
        ];
    }
}

export default NodeFactory;
