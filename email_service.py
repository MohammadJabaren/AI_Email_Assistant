import json
import requests
import argparse
import asyncio
import sys
from typing import Dict, Optional, List, Union
from dataclasses import dataclass
from enum import Enum
import os
import time
import aiohttp

class EmailTone(str, Enum):
    PROFESSIONAL = "professional"
    FRIENDLY = "friendly"
    CASUAL = "casual"
    CUSTOM = "custom"

@dataclass
class LanguageInfo:
    name: str
    formalGreeting: str
    closing: str
    dateFormat: str
    nameFormat: str
    honorifics: Dict[str, List[str]]
    culturalNotes: List[str]

class EmailService:
    def __init__(self, ollama_url: Optional[str] = None, debug: bool = False):
        self.ollama_url = ollama_url or os.getenv("OLLAMA_SERVICE_IP")
        if not self.ollama_url:
            raise ValueError("OLLAMA_SERVICE_IP environment variable is not set and no ollama_url provided") 
        self.debug = debug
        self.language_map = self._initialize_language_map()
        self.action = None

    def _initialize_language_map(self) -> Dict[str, LanguageInfo]:
        return {
            'en': LanguageInfo(
                name="English",
                formalGreeting="Dear",
                closing="Best regards,",
                dateFormat="MM/DD/YYYY",
                nameFormat="{title} {firstName} {lastName}",
                honorifics={
                    "male": ["Mr.", "Dr.", "Prof."],
                    "female": ["Ms.", "Mrs.", "Dr.", "Prof."],
                    "neutral": ["Mx.", "Dr.", "Prof."]
                },
                culturalNotes=[
                    "Use titles unless explicitly asked to use first names",
                    "Keep paragraphs concise and well-spaced",
                    "Be direct but polite"
                ]
            ),
            'fr': LanguageInfo(
                name="French (Français)",
                formalGreeting="Cher/Chère",
                closing="Cordialement,",
                dateFormat="DD/MM/YYYY",
                nameFormat="{honorific} {firstName} {lastName}",
                honorifics={
                    "male": ["M.", "Mme.", "Mlle.", "Dr.", "Prof."],
                    "female": ["Mme.", "Mlle.", "Dr.", "Prof."],
                    "neutral": ["Mx.", "Dr.", "Prof."]
                },
                culturalNotes=[
                    "Use formal language in business context",
                    "Keep paragraphs concise",
                    "Be polite and respectful",
                    "Use proper French punctuation and spacing"
                ]
            ),
            'es': LanguageInfo(
                name="Spanish (Español)",
                formalGreeting="Estimado/a",
                closing="Atentamente,",
                dateFormat="DD/MM/YYYY",
                nameFormat="{honorific} {firstName} {lastName}",
                honorifics={
                    "male": ["Sr.", "Dr.", "Prof."],
                    "female": ["Sra.", "Srita.", "Dr.", "Prof."],
                    "neutral": ["Sr.", "Dr.", "Prof."]
                },
                culturalNotes=[
                    "Use titles unless explicitly asked to use first names",
                    "Keep paragraphs concise and well-spaced",
                    "Be direct but polite"
                ]
            ),
            # Add more languages as needed
        }

    def get_tone_instructions(self, tone: EmailTone) -> str:
        tone_map = {
            EmailTone.PROFESSIONAL: "Write in a formal, business-appropriate tone using professional language and proper etiquette.",
            EmailTone.FRIENDLY: "Write in a warm and personable tone while maintaining professionalism.",
            EmailTone.CASUAL: "Write in a relaxed and informal tone, as if speaking to a friend.",
            EmailTone.CUSTOM: "Write in the user's preferred style based on the context."
        }
        return tone_map.get(tone, "Write in a professional tone.")

    def get_language_info(self, language: str) -> LanguageInfo:
        return self.language_map.get(language, self.language_map['en'])

    def create_email_prompt(self, text: str, tone: EmailTone, language: str, previous_email: Optional[str] = None, action: Optional[str] = None) -> str:
        tone_instructions = self.get_tone_instructions(tone)
        language_info = self.get_language_info(language)

        if action == 'reply':
            if not previous_email:
                raise ValueError("Previous email is required for reply action")
            return f"""You are an AI assistant helping to write an email response. Write a natural, conversational response to this email in {language_info.name}:

Original Email:
{previous_email}

Context and Instructions:
{text}

Requirements:
1. Write a natural, conversational response in {language_info.name} ONLY
2. Do NOT use templates or placeholders
3. Do NOT mix languages
4. Start with {language_info.formalGreeting}
5. Acknowledge the original email's main points
6. Provide your specific response
7. End with {language_info.closing}
8. Keep the tone {tone_instructions}
9. Use proper {language_info.name} grammar and punctuation
10. Make it personal and specific to the situation

Remember: Write as if you're having a natural conversation, not a formal template."""

        elif action == 'summarize':
            if not previous_email:
                raise ValueError("Previous email is required for summarize action")
            return f"""Summarize the following email in {language_info.name}:

{previous_email}

Instructions:
- Provide 2–3 concise bullet points
- Focus only on the main points and actions
- Exclude greetings, sign-offs, and extra details
- Keep the total summary under 50 words
- Be clear and direct"""

        elif action == 'enhance':
            if not previous_email:
                raise ValueError("Previous email is required for enhance action")
            return f"""Enhance this email in {language_info.name}:

Original Email:
{previous_email}

Enhancement Instructions:
{text}

Requirements:
1. Keep the same main message and intent
2. Improve the language and structure
3. Make it more professional and polished
4. Use proper {language_info.name} grammar and punctuation
5. Keep the tone {tone_instructions}
6. Start with {language_info.formalGreeting}
7. End with {language_info.closing}
8. Do NOT change the core message or add new information

Remember: This should be an enhanced version of the original email, maintaining its main points but improving its presentation."""

        else:  # write action
            return f"""Write a new email in {language_info.name}:
Content: {text}
Style: {tone_instructions}
Greeting: {language_info.formalGreeting}
Closing: {language_info.closing}
Requirements:
1. Write a complete email in {language_info.name} ONLY
2. Do NOT use templates or placeholders
3. Include proper greeting and closing
4. Keep it professional and clear
5. Use proper grammar and punctuation"""

    async def generate_with_ollama(self, prompt: str) -> str:
        try:
            params = {
                "model": "phi",
                "prompt": prompt,
                "stream": False,
                "max_tokens": 500,
                "temperature": 0.7,
                "top_p": 0.95,
                "top_k": 50,
                "repeat_penalty": 1.1,
                "stop": ["</email>", "---", "[Your", "[Company", "[Email", "[Today's"],
                "num_predict": 300,
                "num_ctx": 1024,
                "num_thread": 8,
                "num_gpu": 1,
                "seed": None
            }

            response = requests.post(
                f"{self.ollama_url}/api/generate",
                json=params
            )
            response.raise_for_status()
            data = response.json() 
            return data.get("response", "").strip()
    
        except Exception as e:
            raise Exception(f"Failed to generate email: {str(e)}")

    async def handle_email_action(
        self,
        action: str,
        text: str,
        tone: EmailTone,
        language: str,
        previous_email: Optional[str] = None
    ) -> str:
        prompt = self.create_email_prompt(text, tone, language, previous_email, action)

        start_time = time.time()  # ⏱ Start timing
        result = await self.generate_with_ollama(prompt)
        end_time = time.time()  # ⏱ End timing

        elapsed = end_time - start_time
        print(f"⏱ Prompt generation time: {elapsed:.2f} seconds")  # or return this value

        return result

async def main():
    parser = argparse.ArgumentParser(description='Generate or process emails using Ollama')
    parser.add_argument('--action', required=True, choices=['write', 'summarize', 'enhance', 'reply'], help='Action to perform')
    parser.add_argument('--text', required=True, help='Text content or instructions')
    parser.add_argument('--tone', default='professional', help='Email tone (professional/friendly/casual/custom)')
    parser.add_argument('--language', default='en', help='Language code')
    parser.add_argument('--previous-email', help='Previous email content for modifications')

    args = parser.parse_args()

    try:
        email_service = EmailService()
        
        # Create the prompt based on action type
        if args.action == 'reply' and not args.previous_email:
            raise ValueError("Previous email is required for reply action")
            
        prompt = email_service.create_email_prompt(
            text=args.text,
            tone=EmailTone(args.tone),
            language=args.language,
            previous_email=args.previous_email
        )
        
        result = await email_service.handle_email_action(
            action=args.action,
            text=args.text,
            tone=EmailTone(args.tone),
            language=args.language,
            previous_email=args.previous_email
        )
        
        print(result.strip())

    except Exception as e:
        # Output error as JSON
        error_response = {
            "status": "error",
            "error": str(e)
        }
        print(json.dumps(error_response), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main()) 