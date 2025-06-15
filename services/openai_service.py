from openai import OpenAI
from config import settings
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

class OpenAIServiceError(Exception):
    """Custom exception for OpenAI service errors"""
    pass

class OpenAIService:
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL

    def generate_contract_template(self, fields: Dict[str, Any]) -> str:
        """
        Generate a contract template using OpenAI
        
        Args:
            fields: Dictionary containing contract fields
            
        Returns:
            str: Generated contract template
            
        Raises:
            OpenAIServiceError: If there's an error generating the template
        """
        try:
            prompt = self._build_prompt(fields)
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a legal document assistant that generates contract templates. Always maintain the exact placeholder syntax provided."
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"Error generating contract template: {str(e)}")
            raise OpenAIServiceError(f"Failed to generate template: {str(e)}")
    
    def _build_prompt(self, fields: Dict[str, Any]) -> str:
        """Build the prompt for contract generation"""
        return f"""
            Generate a legal contract template in portuguese for a sale agreement.
            Use EXACTLY these placeholders for dynamic content:

            For vendors:
            {{{{#each vendedor}}}}
            - Name: {{{{this.name}}}}
            - Surname: {{{{this.surname}}}}
            - DNI: {{{{this.dni}}}}
            - Address: {{{{this.address}}}}
            {{{{/each}}}}

            For buyers:
            {{{{#each comprador}}}}
            - Name: {{{{this.name}}}}
            - Surname: {{{{this.surname}}}}
            - DNI: {{{{this.dni}}}}
            - Address: {{{{this.address}}}}
            {{{{/each}}}}

            Important:
            1. Keep all placeholder syntax exactly as shown above
            2. Generate a formal Spanish legal contract
            3. Include standard legal clauses for a sale agreement
            4. Ensure proper formatting and structure
            5. Use proper legal terminology in Spanish
            """
