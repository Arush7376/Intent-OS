import json
import os
import google.generativeai as genai
from typing import Dict, Any

class AIService:
    def __init__(self):
        # Instantiate with the API key from environment
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            self.model = None
        else:
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('gemini-2.5-flash')

    def _check_client(self):
        if not self.model:
            raise ValueError("GEMINI_API_KEY is not set in environment variables.")

    def analyze_intent(self, text: str) -> Dict[str, Any]:
        self._check_client()
        
        prompt = f"""
        You are an intelligent productivity assistant. Analyze the following user goal/intent and extract key parameters.
        Return ONLY a JSON object with the following schema:
        {{
            "category": "string (e.g. Learning, Fitness, Career, Personal)",
            "timeline": "string (e.g. 60 days, 1 year, unspecified)",
            "priority": "string (High, Medium, Low based on tone)",
            "constraints": ["list of strings (e.g. managing gym and college)"],
            "parallel_activities": ["list of strings"]
        }}
        
        User Goal: "{text}"
        """
        
        response = self.model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.3
            )
        )
        
        return json.loads(response.text)

    def generate_workflow(self, intent_data: Dict[str, Any], text: str) -> Dict[str, Any]:
        self._check_client()
        
        prompt = f"""
        You are an intelligent productivity assistant. Based on the user's goal and extracted constraints, generate a structured workflow.
        
        User Goal: "{text}"
        Extracted Info: {json.dumps(intent_data)}
        
        Create a detailed workflow with milestones and specific tasks.
        Return ONLY a JSON object with the following schema:
        {{
            "hierarchy": {{
                "phases": [
                    {{
                        "phase_name": "string",
                        "duration_suggestion": "string",
                        "tasks": [
                            {{"title": "string", "description": "string"}}
                        ]
                    }}
                ]
            }},
            "milestones": ["list of strings"],
            "scheduling_suggestions": {{
                "workload_distribution": "string advice",
                "recovery_days": "string advice",
                "optimal_timings": "string advice"
            }}
        }}
        """
        
        response = self.model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.7
            )
        )
        
        return json.loads(response.text)

    def get_recommendations(self, user_stats: Dict[str, Any]) -> Dict[str, Any]:
        self._check_client()
        
        prompt = f"""
        You are an intelligent productivity assistant. Analyze the user's recent activity stats and provide adaptive suggestions.
        
        User Stats: {json.dumps(user_stats)}
        
        Return ONLY a JSON object with the following schema:
        {{
            "insights": ["list of strings (e.g., 'Your workload is too high this week')"],
            "productivity_advice": ["list of strings"],
            "adaptive_suggestions": ["list of strings"]
        }}
        """
        
        response = self.model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.5
            )
        )
        
        return json.loads(response.text)

ai_service = AIService()
