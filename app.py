from flask import Flask, render_template, jsonify, request, send_from_directory
from flask_cors import CORS
import os
import openai

app = Flask(__name__, 
            static_folder=os.path.abspath('static'),
            template_folder=os.path.abspath('templates'))
CORS(app)

# Configure OpenAI
openai.api_key = os.getenv('OPENAI_API_KEY')  # Add this to your environment variables

@app.route('/api/generate-template', methods=['POST'])
def generate_template():
    try:
        data = request.get_json()
        fields = data.get('fields', {})
        
        # Construct the prompt for OpenAI
        prompt = f"""
Generate a legal contract template in Spanish for a sale agreement.
Use the following placeholders for dynamic content:

Vendedores (can be multiple):
{{{{#each vendedor}}}}
- Name: {{{{this.name}}}}
- Surname: {{{{this.surname}}}}
- DNI: {{{{this.dni}}}}
- Address: {{{{this.address}}}}
{{{{/each}}}}

Compradores (can be multiple):
{{{{#each comprador}}}}
- Name: {{{{this.name}}}}
- Surname: {{{{this.surname}}}}
- DNI: {{{{this.dni}}}}
- Address: {{{{this.address}}}}
{{{{/each}}}}

Generate a formal contract template that uses these placeholders and includes standard legal clauses for a sale agreement.
"""
        
        # Call OpenAI API
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a legal document assistant that generates contract templates with placeholders."},
                {"role": "user", "content": prompt}
            ]
        )
        
        template = response.choices[0].message.content
        
        return jsonify({
            'status': 'success',
            'template': template
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

# Serve static files from the root
@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/nodes', methods=['GET', 'POST'])
def handle_nodes():
    if request.method == 'GET':
        # Return initial nodes with Input and Output types
        return jsonify({
            'nodes': [
                {
                    'id': 1, 
                    'x': 100, 
                    'y': 100, 
                    'width': 250,
                    'height': 100,
                    'type': 'Inputs',
                    'title': 'Inputs 1',
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
                    'x': 400, 
                    'y': 100, 
                    'width': 200,
                    'height': 100,
                    'type': 'Outputs',  # Changed from 'default' to 'Outputs'
                    'title': 'Outputs 2',
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
        # Save node data
        data = request.get_json()
        print("Received nodes:", data.get('nodes', []))
        print("Received connections:", data.get('connections', []))
        return jsonify({'status': 'success'})

if __name__ == '__main__':
    # Ensure the static and template folders exist
    os.makedirs('static', exist_ok=True)
    os.makedirs('templates', exist_ok=True)
    
    # Run the app
    app.run(host='0.0.0.0', port=5001, debug=True)
