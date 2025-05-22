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
            raise ValueError("OLLAMA_SERVICE_IP environment variable is not set") 
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
            'de': LanguageInfo(
                name="German (Deutsch)",
                formalGreeting="Sehr geehrte(r)",
                closing="Mit freundlichen Grüßen,",
                dateFormat="DD.MM.YYYY",
                nameFormat="{honorific} {firstName} {lastName}",
                honorifics={
                    "male": ["Herr", "Dr.", "Prof."],
                    "female": ["Frau", "Dr.", "Prof."],
                    "neutral": ["Dr.", "Prof."]
                },
                culturalNotes=[
                    "Use formal language in business context",
                    "Be precise and structured",
                    "Maintain professional distance",
                    "Use proper German punctuation"
                ]
            ),
            'it': LanguageInfo(
                name="Italian (Italiano)",
                formalGreeting="Gentile",
                closing="Cordiali saluti,",
                dateFormat="DD/MM/YYYY",
                nameFormat="{honorific} {firstName} {lastName}",
                honorifics={
                    "male": ["Sig.", "Dott.", "Prof."],
                    "female": ["Sig.ra", "Dott.ssa", "Prof.ssa"],
                    "neutral": ["Dott.", "Prof."]
                },
                culturalNotes=[
                    "Use formal language in business context",
                    "Be warm but professional",
                    "Use proper Italian punctuation",
                    "Maintain respectful tone"
                ]
            ),
            'pt': LanguageInfo(
                name="Portuguese (Português)",
                formalGreeting="Prezado(a)",
                closing="Atenciosamente,",
                dateFormat="DD/MM/YYYY",
                nameFormat="{honorific} {firstName} {lastName}",
                honorifics={
                    "male": ["Sr.", "Dr.", "Prof."],
                    "female": ["Sra.", "Dra.", "Profa."],
                    "neutral": ["Dr.", "Prof."]
                },
                culturalNotes=[
                    "Use formal language in business context",
                    "Be polite and respectful",
                    "Use proper Portuguese punctuation",
                    "Maintain professional tone"
                ]
            ),
            'nl': LanguageInfo(
                name="Dutch (Nederlands)",
                formalGreeting="Geachte",
                closing="Met vriendelijke groet,",
                dateFormat="DD-MM-YYYY",
                nameFormat="{honorific} {firstName} {lastName}",
                honorifics={
                    "male": ["Dhr.", "Dr.", "Prof."],
                    "female": ["Mevr.", "Dr.", "Prof."],
                    "neutral": ["Dr.", "Prof."]
                },
                culturalNotes=[
                    "Be direct but polite",
                    "Use formal language in business context",
                    "Keep communication clear and concise",
                    "Maintain professional distance"
                ]
            ),
            'ru': LanguageInfo(
                name="Russian (Русский)",
                formalGreeting="Уважаемый(ая)",
                closing="С уважением,",
                dateFormat="DD.MM.YYYY",
                nameFormat="{honorific} {firstName} {lastName}",
                honorifics={
                    "male": ["Господин", "Доктор", "Профессор"],
                    "female": ["Госпожа", "Доктор", "Профессор"],
                    "neutral": ["Доктор", "Профессор"]
                },
                culturalNotes=[
                    "Use formal language in business context",
                    "Be respectful and professional",
                    "Use proper Russian punctuation",
                    "Maintain formal tone"
                ]
            ),
            'zh': LanguageInfo(
                name="Chinese (中文)",
                formalGreeting="尊敬的",
                closing="此致",
                dateFormat="YYYY/MM/DD",
                nameFormat="{honorific}{lastName}{firstName}",
                honorifics={
                    "male": ["先生", "博士", "教授"],
                    "female": ["女士", "博士", "教授"],
                    "neutral": ["博士", "教授"]
                },
                culturalNotes=[
                    "Use formal language in business context",
                    "Be respectful and humble",
                    "Use proper Chinese punctuation",
                    "Maintain hierarchical respect"
                ]
            ),
            'ja': LanguageInfo(
                name="Japanese (日本語)",
                formalGreeting="拝啓",
                closing="敬具",
                dateFormat="YYYY/MM/DD",
                nameFormat="{lastName}{honorific} {firstName}",
                honorifics={
                    "male": ["様", "博士", "教授"],
                    "female": ["様", "博士", "教授"],
                    "neutral": ["様", "博士", "教授"]
                },
                culturalNotes=[
                    "Use formal language in business context",
                    "Be extremely polite and respectful",
                    "Use proper Japanese punctuation",
                    "Maintain hierarchical respect"
                ]
            ),
            'ko': LanguageInfo(
                name="Korean (한국어)",
                formalGreeting="존경하는",
                closing="감사합니다",
                dateFormat="YYYY/MM/DD",
                nameFormat="{lastName}{honorific} {firstName}",
                honorifics={
                    "male": ["님", "박사", "교수"],
                    "female": ["님", "박사", "교수"],
                    "neutral": ["님", "박사", "교수"]
                },
                culturalNotes=[
                    "Use formal language in business context",
                    "Be extremely polite and respectful",
                    "Use proper Korean punctuation",
                    "Maintain hierarchical respect"
                ]
            ),
            'ar': LanguageInfo(
                name="Arabic (العربية)",
                formalGreeting="عزيزي/عزيزتي",
                closing="مع تحياتي",
                dateFormat="DD/MM/YYYY",
                nameFormat="{honorific} {firstName} {lastName}",
                honorifics={
                    "male": ["السيد", "الدكتور", "الأستاذ"],
                    "female": ["السيدة", "الدكتورة", "الأستاذة"],
                    "neutral": ["الدكتور", "الأستاذ"]
                },
                culturalNotes=[
                    "Use formal language in business context",
                    "Be respectful and polite",
                    "Use proper Arabic punctuation",
                    "Maintain cultural sensitivity"
                ]
            ),
            'hi': LanguageInfo(
                name="Hindi (हिन्दी)",
                formalGreeting="प्रिय",
                closing="सादर",
                dateFormat="DD/MM/YYYY",
                nameFormat="{honorific} {firstName} {lastName}",
                honorifics={
                    "male": ["श्री", "डॉ.", "प्रो."],
                    "female": ["श्रीमती", "डॉ.", "प्रो."],
                    "neutral": ["डॉ.", "प्रो."]
                },
                culturalNotes=[
                    "Use formal language in business context",
                    "Be respectful and polite",
                    "Use proper Hindi punctuation",
                    "Maintain cultural sensitivity"
                ]
            ),
            'tr': LanguageInfo(
                name="Turkish (Türkçe)",
                formalGreeting="Sayın",
                closing="Saygılarımla,",
                dateFormat="DD.MM.YYYY",
                nameFormat="{honorific} {firstName} {lastName}",
                honorifics={
                    "male": ["Bay", "Dr.", "Prof."],
                    "female": ["Bayan", "Dr.", "Prof."],
                    "neutral": ["Dr.", "Prof."]
                },
                culturalNotes=[
                    "Use formal language in business context",
                    "Be respectful and polite",
                    "Use proper Turkish punctuation",
                    "Maintain professional tone"
                ]
            ),
            'pl': LanguageInfo(
                name="Polish (Polski)",
                formalGreeting="Szanowny(a)",
                closing="Z poważaniem,",
                dateFormat="DD.MM.YYYY",
                nameFormat="{honorific} {firstName} {lastName}",
                honorifics={
                    "male": ["Pan", "Dr.", "Prof."],
                    "female": ["Pani", "Dr.", "Prof."],
                    "neutral": ["Dr.", "Prof."]
                },
                culturalNotes=[
                    "Use formal language in business context",
                    "Be respectful and polite",
                    "Use proper Polish punctuation",
                    "Maintain professional tone"
                ]
            ),
            'he': LanguageInfo(
                name="Hebrew (עברית)",
                formalGreeting="יקר/ה",
                closing="בברכה,",
                dateFormat="DD/MM/YYYY",
                nameFormat="{honorific} {firstName} {lastName}",
                honorifics={
                    "male": ["מר", "ד\"ר", "פרופ'"],
                    "female": ["גב'", "ד\"ר", "פרופ'"],
                    "neutral": ["ד\"ר", "פרופ'"]
                },
                culturalNotes=[
                    "Use formal language in business context",
                    "Be respectful and polite",
                    "Use proper Hebrew punctuation",
                    "Maintain cultural sensitivity"
                ]
            )
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

    def create_email_prompt(self, text: str, tone: EmailTone, language: str, previous_email: Optional[str] = None) -> str:
        tone_instructions = self.get_tone_instructions(tone)
        language_info = self.get_language_info(language)

        if self.action == 'reply':
            if not previous_email:
                raise ValueError("Previous email is required for reply action")
            return f"""Write a response to this email in {language_info.name}:

Original Email:
{previous_email}

Your Response Instructions:
{text}

Requirements:
1. Write a completely new response in {language_info.name} ONLY
2. Do NOT use templates or placeholders like [Your Name] or [Date]
3. Do NOT mix languages
4. Do NOT copy or repeat any part of the original email
5. Start with {language_info.formalGreeting}
6. Acknowledge the original email's main points
7. Provide your specific response to the dinner invitation
8. End with {language_info.closing}
9. Keep the tone {tone_instructions}
10. Use proper {language_info.name} grammar and punctuation
11. Make it personal and specific to the situation

Remember: This should be a new response, not a template or modification of the original."""

        elif self.action == 'summarize':
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

        elif self.action == 'enhance':
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
                "model": "tinyllama",
                "prompt": prompt,
                "stream": False,
                "max_tokens": 250,
                "temperature": 0.8,
                "top_p": 0.9,
                "top_k": 40,
                "repeat_penalty": 1.2,
                "stop": ["</email>", "---", "[Your", "[Company", "[Email", "[Today's"],
                "num_predict": 150,
                "num_ctx": 512,
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
        self.action = action  # Set the action type
        prompt = self.create_email_prompt(text, tone, language, previous_email)

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