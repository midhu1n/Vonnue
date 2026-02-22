import os
import google.generativeai as genai
from django.conf import settings

def get_gemini_response(prompt):
    """
    Sends a prompt to the Gemini API and returns the string response.
    """
    if not settings.GEMINI_API_KEY:
        return "error: missing api key"

    genai.configure(api_key=settings.GEMINI_API_KEY)
    
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        return response.text.strip().lower()
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return "error"
