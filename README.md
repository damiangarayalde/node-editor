# Node Editor

A simple node-based editor built with Flask and vanilla JavaScript. This project allows you to create, connect, and manage nodes in a visual interface similar to Blender's node editor or n8n.

## Features

- Create and delete nodes
- Connect nodes with draggable connections
- Save and load node configurations
- Simple and intuitive UI
- Responsive design

## Getting Started

### Prerequisites

- Python 3.6+
- pip (Python package manager)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd node-editor
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install the required packages:
   ```bash
   pip install -r requirements.txt
   ```

### Running the Application

1. Start the Flask development server:
   ```bash
   python app.py
   ```

2. Open your web browser and navigate to:
   ```
   http://localhost:5000
   ```

## Usage

- **Add Node**: Click the "Add Node" button to create a new node
- **Move Node**: Click and drag a node by its header
- **Connect Nodes**: Click and drag from an output connector to an input connector
- **Delete Node**: Right-click on a node and select "Delete"
- **Save**: Click the "Save" button to save the current node configuration

## Project Structure

```
node-editor/
├── app.py                # Flask application
├── requirements.txt      # Python dependencies
├── static/              # Static files (CSS, JS, images)
│   ├── css/             # Stylesheets
│   └── js/              # JavaScript files
├── templates/           # HTML templates
└── venv/                # Virtual environment
```

## Development

To start developing:

1. Make sure you have the virtual environment activated
2. Install development dependencies:
   ```bash
   pip install -r requirements-dev.txt
   ```
3. Run the development server with auto-reload:
   ```bash
   FLASK_APP=app.py FLASK_ENV=development flask run
   ```

## Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by Blender's node editor and n8n
- Built with Flask and vanilla JavaScript
- Uses Inter font from Google Fonts