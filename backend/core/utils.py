import os
from google import genai
from django.conf import settings

def get_gemini_response(prompt):
    """
    Sends a prompt to the Gemini API and returns the string response.
    """
    if not settings.GEMINI_API_KEY:
        return "error: missing api key"

    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    
    try:
        response = client.models.generate_content(
            model="gemini-3-flash",
            contents=prompt,
        )
        return response.text.strip().lower()
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return "error"
