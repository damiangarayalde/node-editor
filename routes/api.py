from flask import Blueprint, jsonify, request
from services.openai_service import OpenAIService, OpenAIServiceError
from services.nodes_service import NodesService, NodesServiceError
from functools import wraps
import logging

logger = logging.getLogger(__name__)

# Create blueprint
api_bp = Blueprint('api', __name__)

def handle_errors(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except OpenAIServiceError as e:
            logger.error(f"Service error: {str(e)}")
            return jsonify({
                'status': 'error',
                'message': str(e)
            }), 500
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}", exc_info=True)
            return jsonify({
                'status': 'error',
                'message': 'An unexpected error occurred'
            }), 500
    return wrapper

@api_bp.route('/test-openai', methods=['GET'])
@handle_errors
def test_openai():
    """Test endpoint to verify OpenAI connectivity"""
    service = OpenAIService()
    response = service.client.chat.completions.create(
        model=service.model,
        messages=[{"role": "user", "content": "Say 'OpenAI is working!'"}]
    )
    return jsonify({
        'status': 'success',
        'message': response.choices[0].message.content
    })

@api_bp.route('/generate-template', methods=['POST'])
@handle_errors
def generate_template():
    """Generate a contract template based on provided fields"""
    data = request.get_json()
    
    if not data or 'fields' not in data:
        return jsonify({
            'status': 'error',
            'message': 'Missing required fields parameter'
        }), 400
    
    service = OpenAIService()
    template = service.generate_contract_template(data['fields'])
    
    return jsonify({
        'status': 'success',
        'template': template
    })

@api_bp.route('/nodes', methods=['GET', 'POST'])
@handle_errors
def handle_nodes():
    """Handle node-related operations
    
    GET: Returns the default nodes configuration
    POST: Saves the nodes configuration
    """
    if request.method == 'GET':
        try:
            nodes_data = NodesService.get_default_nodes()
            return jsonify(nodes_data)
        except NodesServiceError as e:
            logger.error(f"Error getting nodes: {str(e)}")
            return jsonify({
                'status': 'error',
                'message': 'Failed to load nodes configuration'
            }), 500
    
    elif request.method == 'POST':
        try:
            data = request.get_json()
            if not data or 'nodes' not in data:
                return jsonify({
                    'status': 'error',
                    'message': 'Missing required nodes data'
                }), 400
                
            NodesService.save_nodes(data)
            
            return jsonify({
                'status': 'success',
                'message': 'Nodes saved successfully'
            })
            
        except NodesServiceError as e:
            logger.error(f"Error saving nodes: {str(e)}")
            return jsonify({
                'status': 'error',
                'message': 'Failed to save nodes configuration'
            }), 500
