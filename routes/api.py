from flask import Blueprint, jsonify, request
from services.openai_service import OpenAIService, OpenAIServiceError
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
    if request.method == 'GET':
        # TODO: Move this to a nodes service
        return jsonify({
            'nodes': [
                {
                    'id': 1,
                    'x': 200,
                    'y': 100,
                    'width': 375,
                    'height': 100,
                    'type': 'dni',
                    'title': 'Empty',
                    'state': 'empty',
                    'inputs': [{'id': 'in_1', 'name': 'Input'}],
                    'outputs': [{'id': 'out_1', 'name': 'Output'}],
                    'data': {
                        'name': '',
                        'surname': '',
                        'dateOfBirth': '',
                        'dni': '',
                        'address': ''
                    }
                },
                {
                    'id': 2,
                    'x': 800,
                    'y': 100,
                    'width': 375,
                    'height': 100,
                    'type': 'DocBuilder',
                    'title': 'DocBuilder empty',
                    'inputs': [
                        {'id': 'in_2_vendedor', 'name': 'Vendedor'},
                        {'id': 'in_2_comprador', 'name': 'Comprador'}
                    ],
                    'outputs': [{'id': 'out_2', 'name': 'Output'}]
                }
            ],
            'connections': []
        })
    
    elif request.method == 'POST':
        data = request.get_json()
        logger.info(f"Received nodes: {data.get('nodes', [])}")
        logger.info(f"Received connections: {data.get('connections', [])}")
        return jsonify({'status': 'success'})
