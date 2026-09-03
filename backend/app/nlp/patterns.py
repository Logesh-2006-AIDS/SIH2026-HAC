"""
SIH 2026: AI-Powered Criminal Network Analysis Platform
High-Precision Legal & Indian Law Enforcement Regex Patterns
"""
import re
from typing import Dict, List, Any

# Indian Phone Number Regexes (+91-98765-43210, +91 9876543210, 10-digit mobile)
PHONE_PATTERNS = [
    r'(?:\+91[\-\s]?)?[6789]\d{9}',
    r'\+91[\-\s]?\d{5}[\-\s]?\d{5}',
    r'\b\+91[\-\s]?\d{3}[\-\s]?\d{3}[\-\s]?\d{4}\b',
]

# Indian Vehicle Registration Number (e.g. DL 01 AB 1234, MH 12 DE 4455, HR 26 DQ 5544)
VEHICLE_PATTERNS = [
    r'\b[A-Z]{2}[-\s]?[0-9]{1,2}[-\s]?[A-Z]{1,3}[-\s]?[0-9]{4}\b',
]

# Indian Penal Code (IPC) & Criminal Law Acts
IPC_SECTION_PATTERNS = [
    r'\b(?:Section|Sec\.?|u/s)\s*([0-9A-Za-z\s,\/\-\&]{1,40})\s+(?:IPC|Indian\s+Penal\s+Code)\b',
    r'\b(?:Arms\s+Act|NDPS\s+Act|IT\s+Act|UAPA|MCOCA|PMLA)\s+(?:Section|Sec\.?|u/s)?\s*([0-9A-Za-z\/\-\&]{1,20})\b',
    r'\b(?:302|307|376|379|384|392|395|406|409|411|419|420|467|468|471|120B|34|147|148|149)\s*(?:IPC|I\.P\.C\.)\b',
    r'\bArms\s+Act\s+\d+\/\d+\/\d+\b'
]

# Indian Financial & Crypto Transactions
FINANCIAL_PATTERNS = [
    r'\b(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)\s*(?:lakhs?|crores?|k|million)?\b',
    r'\b[a-zA-Z0-9.\-_]{2,64}@[a-zA-Z]{2,64}\b',  # UPI ID
    r'\b(?:0x[a-fA-F0-9]{40}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})\b',  # Crypto Wallets (ETH/BTC)
]

# FIR Number & Court Case Patterns
FIR_PATTERNS = [
    r'\b(?:FIR\s*(?:No\.?|Number|#)?|Crime\s*(?:No\.?|#)?)\s*[:\-]?\s*([A-Za-z0-9\/\-]+)\b',
    r'\bFIR[_\-][0-9]{4}[_\-][A-Za-z0-9_\-]+\b',
    r'\b(?:CC|Case\s+No\.?|Cr\.?\s*No\.?)\s*[:\-]?\s*([A-Za-z0-9\/\-]+)\b',
]

# Specific Alias Patterns: Strict boundaries so single alias names like "Ravan", "Vicky", "Chota" are matched cleanly
ALIAS_PATTERNS = [
    r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+[@]\s+([A-Z][a-z0-9]+)\b',
    r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:alias|a\.?k\.?a\.?|nicknamed)\s+[\"\'\“\‘]?([A-Z][a-z0-9]+)[\"\'\”\’]?\b',
    r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*\((?:@|alias|a\.?k\.?a\.?|nicknamed)?\s*[\"\'\“\‘]?([A-Z][a-z0-9]+)[\"\'\”\’]?\)',
]


class PatternMatcher:
    """High performance regular expression extractor for deterministic legal entities."""

    def __init__(self):
        self.compiled_phones = [re.compile(p, re.IGNORECASE) for p in PHONE_PATTERNS]
        self.compiled_vehicles = [re.compile(p, re.IGNORECASE) for p in VEHICLE_PATTERNS]
        self.compiled_ipc = [re.compile(p, re.IGNORECASE) for p in IPC_SECTION_PATTERNS]
        self.compiled_finance = [re.compile(p, re.IGNORECASE) for p in FINANCIAL_PATTERNS]
        self.compiled_fir = [re.compile(p, re.IGNORECASE) for p in FIR_PATTERNS]

    def extract_pattern_entities(self, text: str) -> List[Dict[str, Any]]:
        results = []

        # 1. Phone Numbers
        for cp in self.compiled_phones:
            for match in cp.finditer(text):
                val = match.group(0).strip()
                digits = re.sub(r'\D', '', val)
                if len(digits) >= 10:
                    results.append({
                        "text": val,
                        "normalized": f"+91-{digits[-10:]}",
                        "label": "PHONE_NUMBER",
                        "start": match.start(),
                        "end": match.end(),
                        "confidence": 0.98,
                        "extractor": "REGEX_PATTERN"
                    })

        # 2. Vehicle Registration Numbers
        for cp in self.compiled_vehicles:
            for match in cp.finditer(text):
                val = match.group(0).strip()
                if any(char.isdigit() for char in val) and any(char.isalpha() for char in val) and len(val) >= 7:
                    clean_plate = re.sub(r'[\s\-]', '', val).upper()
                    results.append({
                        "text": val,
                        "normalized": clean_plate,
                        "label": "VEHICLE_NUMBER",
                        "start": match.start(),
                        "end": match.end(),
                        "confidence": 0.96,
                        "extractor": "REGEX_PATTERN"
                    })

        # 3. IPC Sections
        for cp in self.compiled_ipc:
            for match in cp.finditer(text):
                val = match.group(0).strip()
                if "\n" not in val and len(val) <= 50:
                    results.append({
                        "text": val,
                        "normalized": val.upper(),
                        "label": "LEGAL_SECTION",
                        "start": match.start(),
                        "end": match.end(),
                        "confidence": 0.97,
                        "extractor": "REGEX_PATTERN"
                    })

        # 4. Financial & Crypto
        for cp in self.compiled_finance:
            for match in cp.finditer(text):
                val = match.group(0).strip()
                if len(val) > 3 and not val.lower().startswith("rs,"):
                    label = "CRYPTO_WALLET" if val.startswith("0x") or (len(val) > 26 and "@" not in val) else ("UPI_ID" if "@" in val else "FINANCIAL_AMOUNT")
                    results.append({
                        "text": val,
                        "normalized": val,
                        "label": label,
                        "start": match.start(),
                        "end": match.end(),
                        "confidence": 0.93,
                        "extractor": "REGEX_PATTERN"
                    })

        # 5. FIR Numbers
        for cp in self.compiled_fir:
            for match in cp.finditer(text):
                val = match.group(0).strip()
                if len(val) >= 5 and "FIR" in val.upper():
                    results.append({
                        "text": val,
                        "normalized": val.upper(),
                        "label": "FIR_RECORD",
                        "start": match.start(),
                        "end": match.end(),
                        "confidence": 0.98,
                        "extractor": "REGEX_PATTERN"
                    })

        # Deduplicate
        deduped = []
        seen = set()
        for ent in results:
            key = (ent["label"], ent["normalized"])
            if key not in seen:
                seen.add(key)
                deduped.append(ent)

        return deduped
