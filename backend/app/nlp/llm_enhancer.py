"""
SIH 2026: AI Criminal Network Investigation Platform
Unified Multi-Provider LLM Engine (Gemini / Groq / OpenAI / Local Fallback)
"""
import os
import json
import logging
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

logger = logging.getLogger(__name__)

class MultiLLMEngine:
    def __init__(self):
        self.reload_config()

    def reload_config(self):
        load_dotenv(override=True)
        self.gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.gemini_model_name = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
        
        self.groq_key = os.getenv("GROQ_API_KEY", "").strip()
        self.groq_model_name = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

        self.openai_key = os.getenv("OPENAI_API_KEY", "").strip()

        # Determine active provider
        if self.groq_key and self.groq_key != "your-groq-api-key":
            self.active_provider = "groq"
        elif self.gemini_key and self.gemini_key != "your-gemini-api-key":
            self.active_provider = "gemini"
        elif self.openai_key and self.openai_key != "your-openai-api-key":
            self.active_provider = "openai"
        else:
            self.active_provider = "local_fallback"

        # Initialize Groq client
        self.groq_client = None
        if self.groq_key and self.groq_key != "your-groq-api-key":
            try:
                from groq import Groq
                self.groq_client = Groq(api_key=self.groq_key)
                logger.info(f"Groq LLM Engine initialized with model {self.groq_model_name}")
            except Exception as e:
                logger.warning(f"Failed to init Groq client: {e}")

        # Initialize Gemini client
        self.gemini_model = None
        if self.gemini_key and self.gemini_key != "your-gemini-api-key":
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.gemini_key)
                self.gemini_model = genai.GenerativeModel(
                    model_name=self.gemini_model_name,
                    generation_config={"response_mime_type": "application/json"}
                )
                logger.info(f"Gemini LLM Engine initialized with model {self.gemini_model_name}")
            except Exception as e:
                logger.warning(f"Failed to init Gemini client: {e}")

    def is_available(self) -> bool:
        self.reload_config()
        return self.active_provider != "local_fallback"

    def get_provider_name(self) -> str:
        self.reload_config()
        return self.active_provider

    def answer_investigator_copilot(self, question: str, graph_context: str) -> Optional[Dict[str, Any]]:
        """
        Synthesizes answers for AI Copilot queries using Groq (Llama-3.3) or Gemini with graph grounding.
        """
        self.reload_config()
        if not self.is_available():
            return None

        prompt = f"""
You are CRIMENEXUS AI Copilot, a senior law enforcement intelligence assistant for the Police Department.
Answer the investigator's inquiry based STRICTLY on the provided criminal knowledge graph context and First Information Reports.

INVESTIGATOR QUESTION: "{question}"

ACTIVE GRAPH DATA & EVIDENCE CONTEXT:
{graph_context}

Respond in strict JSON with these 4 separate sections:
{{
  "intent": "QUERY_INTENT_CATEGORY",
  "answer": "Direct, clear natural-language answer to the investigator",
  "evidence_backed_facts": [
    "Fact 1 backed by specific FIR evidence citation",
    "Fact 2 backed by call records or seized vehicles"
  ],
  "ai_inferences": [
    "Logical network inference or syndicate pattern deduced from graph structure"
  ],
  "suggested_leads": [
    "Concrete, actionable next investigative lead for the officer to pursue"
  ],
  "confidence_score": 0.96
}}
"""
        # Option 1: Try Groq (Ultra-Fast Inference)
        if self.groq_client:
            try:
                chat_completion = self.groq_client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": "You are a police intelligence AI. Respond only in valid JSON matching the specified schema."},
                        {"role": "user", "content": prompt}
                    ],
                    model=self.groq_model_name,
                    response_format={"type": "json_object"}
                )
                content = chat_completion.choices[0].message.content.strip()
                if content.startswith("```"):
                    content = re.sub(r"^```(?:json)?\s*|\s*```$", "", content, flags=re.DOTALL).strip()
                return json.loads(content)
            except Exception as e:
                logger.warning(f"Groq API error: {e}. Trying secondary provider.")

        # Option 2: Try Gemini 3.6 Flash
        if self.gemini_model:
            try:
                response = self.gemini_model.generate_content(prompt)
                return json.loads(response.text)
            except Exception as e:
                logger.warning(f"Gemini API error: {e}")

        return None

    def extract_deep_intelligence(self, text: str) -> Optional[Dict[str, Any]]:
        """
        Extracts complex narrative entities, modus operandi, and relationships.
        """
        self.reload_config()
        if not self.is_available():
            return None

        prompt = f"""
You are an expert Criminal Intelligence Analyst analyzing an Indian Police First Information Report (FIR).
Extract all criminal entities, aliases, relationships, modus operandi, and executive judicial summaries.

CRITICAL JUDICIAL INSTRUCTIONS:
1. Ground every relationship in a verbatim sentence quote from the text.
2. Label entity types: SUSPECT_PERSON, PHONE_NUMBER, VEHICLE_NUMBER, LOCATION, CRIMINAL_ORGANIZATION, LEGAL_SECTION, FINANCIAL_AMOUNT.
3. Provide a clear threat assessment (CRITICAL, HIGH, MEDIUM).

Output strict JSON matching this schema:
{{
  "case_summary": "Concise 2-sentence police overview",
  "modus_operandi": "Detailed method of operation used by the perpetrators",
  "threat_level": "CRITICAL" | "HIGH" | "MEDIUM",
  "entities": [
    {{
      "name": "Entity Name",
      "type": "SUSPECT_PERSON" | "PHONE_NUMBER" | "VEHICLE_NUMBER" | "LOCATION" | "CRIMINAL_ORGANIZATION" | "LEGAL_SECTION",
      "alias": "optional nickname",
      "role": "Syndicate role",
      "confidence": 0.95
    }}
  ],
  "relationships": [
    {{
      "subject": "Subject Name",
      "predicate": "CO_ACCUSED" | "OPERATES_VEHICLE" | "COMMUNICATED_WITH" | "TRANSFERRED_MONEY" | "MEMBER_OF" | "SPOTTED_AT",
      "object": "Target Name",
      "evidence_quote": "Exact sentence quote from the FIR text",
      "confidence": 0.94
    }}
  ]
}}

FIR DOCUMENT:
\"\"\"{text}\"\"\"
"""
        # Option 1: Try Groq
        if self.groq_client:
            try:
                chat_completion = self.groq_client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": "You are a police intelligence NER analyst. Respond only in valid JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    model=self.groq_model_name,
                    response_format={"type": "json_object"}
                )
                content = chat_completion.choices[0].message.content
                return json.loads(content)
            except Exception as e:
                logger.warning(f"Groq extraction error: {e}")

        # Option 2: Try Gemini
        if self.gemini_model:
            try:
                response = self.gemini_model.generate_content(prompt)
                return json.loads(response.text)
            except Exception as e:
                logger.warning(f"Gemini extraction error: {e}")

        return None

# Singleton instance
multi_llm_engine = MultiLLMEngine()
gemini_engine = multi_llm_engine
llm_engine = multi_llm_engine
