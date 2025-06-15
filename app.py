import os
from flask import Flask, render_template, send_from_directory
from flask_cors import CORS
from config import settings
import logging
from logging.handlers import RotatingFileHandler
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging


def setup_logging(app):
    """Set up logging configuration"""
    if not os.path.exists('logs'):
        os.makedirs('logs')

    file_handler = RotatingFileHandler(
        'logs/app.log', maxBytes=10240, backupCount=10)
    file_handler.setFormatter(logging.Formatter(
        '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'))
    file_handler.setLevel(logging.INFO)

    app.logger.addHandler(file_handler)
    app.logger.setLevel(logging.INFO)
    app.logger.info('Application startup')


def create_app():
    """Application factory"""
    app = Flask(__name__,
                static_folder=os.path.abspath('static'),
                template_folder=os.path.abspath('templates'))

    # Load configuration
    app.config.from_object(settings)

    # Set maximum content length
    app.config['MAX_CONTENT_LENGTH'] = settings.MAX_CONTENT_LENGTH

    # Configure CORS
    CORS(
        app,
        resources={
            r"/api/*": {"origins": settings.CORS_ORIGINS}
        }
    )

    # Setup logging
    setup_logging(app)

    # Configure OpenAI with new client
    client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

    # Register blueprints
    from routes.api import api_bp
    app.register_blueprint(api_bp, url_prefix='/api')

    # Basic routes
    @app.route('/')
    def index():
        return render_template('index.html')

    @app.route('/static/<path:path>')
    def serve_static(path):
        return send_from_directory('static', path)

    return app


if __name__ == '__main__':
    # Ensure required directories exist
    os.makedirs('static', exist_ok=True)
    os.makedirs('templates', exist_ok=True)

    # Create and run the application
    app = create_app()
    app.run(
        host=settings.HOST,
        port=settings.PORT,
        debug=settings.DEBUG
    )
