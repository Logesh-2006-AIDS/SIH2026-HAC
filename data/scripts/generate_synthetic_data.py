"""
SIH 2026 — AI-Powered Criminal Network Analysis Platform
PHASE 2: Synthetic Dataset Generator
======================================
Uses ONLY Python stdlib — no external packages required.
Run: python data/scripts/generate_synthetic_data.py

Generates:
  data/raw/fir_reports/FIR_2025_ND_101-105.txt
  data/raw/cdr/call_detail_records.csv
  data/raw/financial/financial_transactions.csv
  data/raw/intelligence/informant_briefs.json
  data/metadata/ground_truth_entities.json
  data/metadata/ground_truth_graph.json
  data/metadata/cross_case_scenarios.json
"""

import csv
import json
import os
import random
from datetime import datetime, timedelta

# ── Deterministic seed for reproducibility ──────────────────────────────────
random.seed(42)

# ── Base directories ─────────────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIRS = {
    "fir":        os.path.join(BASE_DIR, "raw", "fir_reports"),
    "cdr":        os.path.join(BASE_DIR, "raw", "cdr"),
    "financial":  os.path.join(BASE_DIR, "raw", "financial"),
    "intel":      os.path.join(BASE_DIR, "raw", "intelligence"),
    "metadata":   os.path.join(BASE_DIR, "metadata"),
}
for d in DIRS.values():
    os.makedirs(d, exist_ok=True)


# ═══════════════════════════════════════════════════════════════════════════════
# MASTER ENTITY REGISTRY (Shared across cases — cross-case connectors built in)
# ═══════════════════════════════════════════════════════════════════════════════

PERSONS = [
    # id, full_name, aliases, phone_primary, phone_secondary, address, role
    {"id": "P001", "name": "Ravi Kumar",       "aliases": ["Ravan", "R. Kumar", "Ravi K."],
     "phone": "+91-98110-44501", "phone2": "+91-98110-44502", "address": "C-14, Sector 7, Rohini, New Delhi",
     "role": "Suspect", "cases": ["101", "105"]},

    {"id": "P002", "name": "Vikram Singh",     "aliases": ["Vicky", "Vikram S.", "V. Singh"],
     "phone": "+91-98765-32100", "phone2": "+91-98765-32101", "address": "Flat 3B, MG Road, Gurgaon, Haryana",
     "role": "Suspect", "cases": ["101", "102", "103"]},           # HIGH Betweenness — bridge node

    {"id": "P003", "name": "Meena Sharma",     "aliases": ["Meena S.", "M. Sharma"],
     "phone": "+91-70011-12345", "phone2": None, "address": "12, Karol Bagh, New Delhi",
     "role": "Suspect", "cases": ["101"]},

    {"id": "P004", "name": "Aarav Mehta",      "aliases": ["AJ Mehta", "Aarav M."],
     "phone": "+91-99300-67890", "phone2": "+91-99300-67891", "address": "Bandra West, Mumbai, Maharashtra",
     "role": "Suspect", "cases": ["102", "105"]},

    {"id": "P005", "name": "Suresh Yadav",     "aliases": ["Suresh Y.", "S. Yadav"],
     "phone": "+91-94221-11111", "phone2": None, "address": "Gomti Nagar, Lucknow, UP",
     "role": "Suspect", "cases": ["103"]},

    {"id": "P006", "name": "Priya Nair",       "aliases": ["Priya N.", "P. Nair"],
     "phone": "+91-81111-55555", "phone2": None, "address": "Koramangala, Bengaluru, Karnataka",
     "role": "Suspect", "cases": ["104"]},

    {"id": "P007", "name": "Deepak Srivastava","aliases": ["Deepak S.", "D. Srivastava"],
     "phone": "+91-76543-21000", "phone2": None, "address": "Civil Lines, Allahabad, UP",
     "role": "Suspect", "cases": ["105"]},

    {"id": "P008", "name": "Manish Tiwari",    "aliases": ["Manu", "M. Tiwari"],
     "phone": "+91-87654-32100", "phone2": None, "address": "Shyamnagar, Kanpur, UP",
     "role": "Associate", "cases": ["101", "103"]},

    {"id": "P009", "name": "Sanjay Gupta",     "aliases": ["Sanju", "S. Gupta", "Sanjay G."],
     "phone": "+91-91234-56780", "phone2": None, "address": "Salt Lake, Kolkata, WB",
     "role": "Associate", "cases": ["102"]},

    {"id": "P010", "name": "Rohit Patel",      "aliases": ["Rohit P.", "R. Patel"],
     "phone": "+91-96000-12345", "phone2": None, "address": "Satellite Area, Ahmedabad, Gujarat",
     "role": "Associate", "cases": ["104", "105"]},

    # Burner / Unregistered — shared cross-case connector
    {"id": "P011", "name": "Unknown (Burner)", "aliases": ["Caller X", "Unknown Suspect"],
     "phone": "+91-98110-99999", "phone2": None, "address": "Unknown",
     "role": "Unknown", "cases": ["102", "103"]},
]

ORGANIZATIONS = [
    {"id": "O001", "name": "Apex Global Logistics Pvt Ltd",
     "alias": "Apex Logistics", "reg": "U74120DL2018PTC123456",
     "address": "Plot 45, Okhla Industrial Area, Phase II, New Delhi",
     "type": "Shell Company / Front Business", "cases": ["101", "105"]},

    {"id": "O002", "name": "DarkNet Crypto Exchange Services",
     "alias": "DCES", "reg": "N/A (Unregistered)",
     "address": "Online (Tor-accessible)", "type": "Illicit Crypto Exchange", "cases": ["102"]},

    {"id": "O003", "name": "North Star Arms Traders",
     "alias": "NSAT", "reg": "N/A (Illicit)",
     "address": "Meerut, UP (Mobile Base)", "type": "Illicit Arms Syndicate", "cases": ["103"]},

    {"id": "O004", "name": "Luxe Motor Exports Pvt Ltd",
     "alias": "Luxe Motors", "reg": "U50400MH2020PTC987654",
     "address": "Andheri East, Mumbai", "type": "Vehicle Theft Front", "cases": ["104"]},

    {"id": "O005", "name": "Shroff Money Services",
     "alias": "SMS Hawala", "reg": "N/A (Unregistered Hawala)",
     "address": "Pahar Ganj, New Delhi", "type": "Hawala Operator", "cases": ["105"]},
]

VEHICLES = [
    {"id": "V001", "plate": "DL-01-AB-1234", "type": "SUV",  "model": "Toyota Fortuner", "color": "Black", "cases": ["101"]},
    {"id": "V002", "plate": "MH-12-CD-5678", "type": "Sedan","model": "Honda City",     "color": "White", "cases": ["104"]},
    {"id": "V003", "plate": "UP-32-GH-9012", "type": "Truck","model": "Tata Ace",       "color": "Blue",  "cases": ["103"]},
    {"id": "V004", "plate": "HR-26-EF-3456", "type": "SUV",  "model": "Ford Endeavour", "color": "Grey",  "cases": ["104"]},
    {"id": "V005", "plate": "DL-05-XY-7890", "type": "Bike", "model": "Pulsar 220",     "color": "Red",   "cases": ["101", "103"]},
]

LOCATIONS = [
    {"id": "L001", "name": "Rohini, New Delhi",          "lat": 28.7041, "lon": 77.1025, "cases": ["101"]},
    {"id": "L002", "name": "Karol Bagh, New Delhi",      "lat": 28.6511, "lon": 77.1907, "cases": ["101", "105"]},
    {"id": "L003", "name": "Bandra West, Mumbai",        "lat": 19.0596, "lon": 72.8295, "cases": ["102"]},
    {"id": "L004", "name": "Okhla Industrial Area, Delhi","lat": 28.5355, "lon": 77.2710, "cases": ["101","105"]},
    {"id": "L005", "name": "Meerut, Uttar Pradesh",      "lat": 28.9845, "lon": 77.7064, "cases": ["103"]},
    {"id": "L006", "name": "Andheri East, Mumbai",       "lat": 19.1136, "lon": 72.8697, "cases": ["104"]},
    {"id": "L007", "name": "Pahar Ganj, New Delhi",      "lat": 28.6432, "lon": 77.2120, "cases": ["105"]},
    {"id": "L008", "name": "Salt Lake City, Kolkata",    "lat": 22.5726, "lon": 88.3639, "cases": ["102"]},
]

ACCOUNTS = [
    {"id": "A001", "number": "303040404050505", "ifsc": "SBIN0001234", "bank": "State Bank of India",    "holder_id": "P001", "cases": ["101"]},
    {"id": "A002", "number": "202030303040404", "ifsc": "HDFC0002345", "bank": "HDFC Bank",               "holder_id": "P002", "cases": ["101","102"]},
    {"id": "A003", "number": "112233445566778", "ifsc": "ICIC0003456", "bank": "ICICI Bank",              "holder_id": "P004", "cases": ["102","105"]},
    {"id": "A004", "number": "998877665544332", "ifsc": "PUNB0004567", "bank": "Punjab National Bank",    "holder_id": "P007", "cases": ["105"]},
    {"id": "A005", "number": "556677889900112", "ifsc": "AXIS0005678", "bank": "Axis Bank",               "holder_id": "P010", "cases": ["105"]},
    {"id": "A006", "number": "777666555444333", "ifsc": "KKBK0006789", "bank": "Kotak Mahindra Bank",     "holder_id": "O001", "cases": ["101","105"]},
]

CELL_TOWERS = [
    {"id": "CT001", "location": "Rohini Sector 7, Delhi",   "lat": 28.7041, "lon": 77.1025},
    {"id": "CT002", "location": "Karol Bagh, Delhi",        "lat": 28.6511, "lon": 77.1907},
    {"id": "CT003", "location": "Okhla Phase II, Delhi",    "lat": 28.5355, "lon": 77.2710},
    {"id": "CT004", "location": "Bandra West, Mumbai",      "lat": 19.0596, "lon": 72.8295},
    {"id": "CT005", "location": "Meerut City, UP",          "lat": 28.9845, "lon": 77.7064},
    {"id": "CT006", "location": "Andheri East, Mumbai",     "lat": 19.1136, "lon": 72.8697},
    {"id": "CT007", "location": "Salt Lake, Kolkata",       "lat": 22.5726, "lon": 88.3639},
    {"id": "CT008", "location": "MG Road, Gurgaon",         "lat": 28.4801, "lon": 77.0886},
]


def rand_dt(start_days_ago=365, end_days_ago=0):
    """Random datetime within range."""
    start = datetime.now() - timedelta(days=start_days_ago)
    delta = timedelta(days=random.randint(end_days_ago, start_days_ago),
                      hours=random.randint(0, 23),
                      minutes=random.randint(0, 59))
    return start + delta


def fmt(dt):
    return dt.strftime("%Y-%m-%d %H:%M:%S")


# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 2.1A — FIR TEXT REPORTS
# ═══════════════════════════════════════════════════════════════════════════════

FIRS = {
    "FIR_2025_ND_101": {
        "case_no": "FIR No. 101/2025",
        "ps": "Crime Branch, North District, Delhi Police",
        "sections": "BNS Sections 308(2), 351(2), 61(2) r/w Sec. 3(1) MCOCA",
        "title": "Armed Robbery, Extortion Syndicate & Organized Crime",
        "incident_date": "15/04/2025",
        "complainant": "Deputy Commissioner of Police, North District",
        "narrative": """
FIRST INFORMATION REPORT
Case No.: FIR No. 101/2025
Police Station: Crime Branch, North District, Delhi Police
Date & Time of Report: 15/04/2025, 22:30 hrs
Applicable Sections: BNS Sections 308(2), 351(2), 61(2) r/w Sec. 3(1) MCOCA

INCIDENT SUMMARY:
On the night of 12/04/2025 at approximately 21:00 hrs, armed members of an organized extortion syndicate
forcibly entered the business premises of M/s Royal Jewellers, Karol Bagh, New Delhi. The gang, led by
Ravi Kumar (also known as "Ravan"), threatened the proprietor and extracted Rs. 15,00,000 in cash.

ACCUSED PERSONS:
1. Ravi Kumar alias "Ravan" alias "R. Kumar" (s/o Ramesh Kumar)
   Address: C-14, Sector 7, Rohini, New Delhi
   Mobile: +91-98110-44501 (Primary), +91-98110-44502 (Secondary)
   Role: Gang leader, mastermind and primary extortionist

2. Vikram Singh alias "Vicky" (s/o Joginder Singh)
   Address: Flat 3B, MG Road, Gurgaon, Haryana
   Mobile: +91-98765-32100
   Role: Ground coordinator, transported gang to incident location in vehicle DL-01-AB-1234

3. Meena Sharma alias "Meena S." (d/o Suresh Sharma)
   Address: 12, Karol Bagh, New Delhi
   Mobile: +91-70011-12345
   Role: Provided interior intelligence on jewellery shop vault

4. Manish Tiwari alias "Manu" (s/o Kailash Tiwari)
   Address: Shyamnagar, Kanpur, UP
   Mobile: +91-87654-32100
   Role: Armed guard / muscle during robbery

VEHICLE USED:
Toyota Fortuner (Black), Registration: DL-01-AB-1234 — confirmed by CCTV footage near incident location.
Royal Enfield Bullet (Red), Registration: DL-05-XY-7890 — used as scouting vehicle.

FINANCIAL INTELLIGENCE:
Post-robbery proceeds of Rs. 15,00,000 were routed through:
- Account No. 303040404050505 (SBIN0001234, SBI) — Holder: Ravi Kumar
- Account No. 606060606060606 — Apex Global Logistics Pvt Ltd (Okhla Industrial Area)
Intelligence suggests Apex Global Logistics Pvt Ltd is a shell company operated by the syndicate
for laundering criminal proceeds.

SEIZED PROPERTY:
- 2 illegal firearms (pistols, .32 bore)
- Cash: Rs. 2,40,000 recovered from Ravi Kumar's residence
- Mobile handset (IMEI: 352456000123456) belonging to Meena Sharma

EVIDENCE SOURCES:
- CCTV footage: Royal Jewellers premises, 12/04/2025, 21:00-22:30 hrs
- CDR (Call Detail Records): +91-98110-44501 shows 14 calls to +91-98765-32100 in 24 hrs prior to incident
- Informant intelligence (Source Ref: INF/2025/ND/007) corroborates identities
""",
    },
    "FIR_2025_ND_102": {
        "case_no": "FIR No. 102/2025",
        "ps": "Cyber Crime Branch, Delhi Police",
        "sections": "IT Act Sections 66C, 66D; BNS Section 318; PMLA 2002",
        "title": "Cyber Fraud, Darknet Crypto Laundering Ring",
        "incident_date": "28/05/2025",
        "complainant": "Reserve Bank of India, Cybercrime Cell",
        "narrative": """
FIRST INFORMATION REPORT
Case No.: FIR No. 102/2025
Police Station: Cyber Crime Branch, Delhi Police
Date & Time of Report: 28/05/2025, 15:00 hrs
Applicable Sections: IT Act Sections 66C, 66D; BNS Section 318(Cheating); PMLA 2002

INCIDENT SUMMARY:
An international cyber fraud operation defrauded over 1,200 victims of a total of Rs. 4.8 Crore
through phishing portals impersonating Government payment portals (NEFT/UPI). The proceeds were
layered through DarkNet Crypto Exchange Services (DCES) and converted to Tether (USDT).

ACCUSED PERSONS:
1. Vikram Singh alias "V. Singh" alias "Vicky"
   Address: Flat 3B, MG Road, Gurgaon, Haryana
   Mobile: +91-98765-32100, +91-98765-32101
   Role: Technical mastermind; operated phishing servers, coordinated money mules

2. Aarav Mehta alias "AJ Mehta"
   Address: Bandra West, Mumbai, Maharashtra
   Mobile: +91-99300-67890, +91-99300-67891
   Role: Crypto wallet handler; converted INR to USDT via DCES

3. Sanjay Gupta alias "Sanju" (s/o Naresh Gupta)
   Address: Salt Lake, Kolkata, WB
   Mobile: +91-91234-56780
   Role: Money mule coordinator; controlled bank accounts used to receive victim transfers

UNIDENTIFIED CALLER (Burner Phone):
A critical unregistered number +91-98110-99999 (Burner Phone) communicated with both Vikram Singh
and Aarav Mehta via 22 encrypted calls/SMS between 01/05/2025 and 25/05/2025.
Identity of burner phone subscriber remains UNKNOWN — pending verification.

FINANCIAL TRACE:
- Victim funds received in Account No. 202030303040404 (HDFC0002345, HDFC) — Vikram Singh
- Crypto conversion via DCES: ~Rs. 3.2 Crore converted to 47,000 USDT
- INR layering via: Account No. 112233445566778 (ICICI Bank) — Aarav Mehta

NOTE: Account No. 112233445566778 (ICICI) also appears in Case 105 (Hawala operations).
This constitutes a potential CROSS-CASE financial link requiring verification.

EVIDENCE:
- Digital forensics: Phishing server logs (IP: 185.220.101.x, Tor exit node)
- Bank transaction records: 1,847 fraudulent NEFT entries
- Crypto blockchain trace: USDT Wallet 0xABCD...EF12 linked to DCES
""",
    },
    "FIR_2025_ND_103": {
        "case_no": "FIR No. 103/2025",
        "ps": "Special Crime Branch, UP Police (Meerut)",
        "sections": "Arms Act 1959 Sections 25, 27; UAPA; BNS Section 61",
        "title": "Illicit Arms Smuggling & Supply Network",
        "incident_date": "10/06/2025",
        "complainant": "SSP, Meerut, Uttar Pradesh",
        "narrative": """
FIRST INFORMATION REPORT
Case No.: FIR No. 103/2025
Police Station: Special Crime Branch, UP Police, Meerut
Date & Time of Report: 10/06/2025, 11:30 hrs
Applicable Sections: Arms Act 1959 Sec. 25, 27; UAPA; BNS Sec. 61 (Criminal Conspiracy)

INCIDENT SUMMARY:
Intelligence-led operation at National Highway 58, Meerut, UP on 08/06/2025 resulted in the
interception of a Tata Ace truck (Registration: UP-32-GH-9012) transporting 34 illegal firearms
(pistols and country-made rifles) concealed inside factory machinery consignments.

ACCUSED PERSONS:
1. Suresh Yadav alias "S. Yadav"
   Address: Gomti Nagar, Lucknow, UP
   Mobile: +91-94221-11111
   Role: Arms procurement coordinator — North Star Arms Traders (NSAT) operative

2. Manish Tiwari alias "Manu" (s/o Kailash Tiwari)
   Address: Shyamnagar, Kanpur, UP
   Mobile: +91-87654-32100
   Role: Logistics coordinator; arranged transport truck and delivery route

CRITICAL INTELLIGENCE — CROSS-CASE LINK:
An unregistered burner phone +91-98110-99999 communicated with Suresh Yadav on 7 occasions
between 02/06/2025 and 07/06/2025 — THIS IS THE SAME BURNER NUMBER appearing in FIR No. 102/2025 
(Cyber Fraud case). This constitutes a HIGH PRIORITY cross-case link.

VEHICLE SEIZED:
Tata Ace (Blue), Registration: UP-32-GH-9012 — Registered to a fictitious address.
Royal Enfield Bullet (Red), Registration: DL-05-XY-7890 — Same vehicle appearing in Case 101.

SEIZED CONTRABAND:
- 34 illegal firearms (pistols + country-made rifles)
- 850 rounds of ammunition (.32 bore, 9mm)
- Transaction ledger (handwritten) indicating payment to "Organization X"

EVIDENCE:
- Informant tip-off: Source Ref: INF/2025/UP/014
- CDR Analysis: +91-94221-11111 shows burst calling pattern 48 hrs before interception
""",
    },
    "FIR_2025_ND_104": {
        "case_no": "FIR No. 104/2025",
        "ps": "Maharashtra Auto Crime Cell, Mumbai",
        "sections": "BNS Sections 303(2), 317(2); MV Act 1988",
        "title": "Inter-State Luxury Vehicle Theft & Cloning Ring",
        "incident_date": "22/06/2025",
        "complainant": "DCP, Auto Crime Cell, Mumbai Police",
        "narrative": """
FIRST INFORMATION REPORT
Case No.: FIR No. 104/2025
Police Station: Maharashtra Auto Crime Cell, Mumbai
Date & Time of Report: 22/06/2025, 16:00 hrs
Applicable Sections: BNS Sec. 303(2) (Theft), 317(2) (Cheating); MV Act 1988

INCIDENT SUMMARY:
Investigation into a syndicate that steals luxury vehicles (SUVs and sedans) across Delhi-NCR,
clones registration plates, and sells at deflated prices through Luxe Motor Exports Pvt Ltd,
a shell firm registered in Mumbai operating at Andheri East.

ACCUSED PERSONS:
1. Priya Nair alias "P. Nair"
   Address: Koramangala, Bengaluru, Karnataka
   Mobile: +91-81111-55555
   Role: Syndicate head; manages buyer network and forged documents

2. Rohit Patel alias "Rohit P." alias "R. Patel"
   Address: Satellite Area, Ahmedabad, Gujarat
   Mobile: +91-96000-12345
   Role: Vehicle delivery coordinator; handles inter-state transport and document forgery

VEHICLES RECOVERED (Stolen + Cloned):
1. Honda City (White), Original Plate: MH-12-CD-5678 — reported stolen 10/04/2025, Andheri East
2. Ford Endeavour (Grey), Registration: HR-26-EF-3456 — stolen Gurgaon, 18/03/2025

FRONT COMPANY:
Luxe Motor Exports Pvt Ltd (Reg No: U50400MH2020PTC987654)
Registered Address: Andheri East, Mumbai
Directors (suspected frontmen): Priya Nair, Rohit Patel

EVIDENCE:
- VIN chassis number database cross-reference (cloned plates detected)
- 28 sale deeds with forged buyer signatures
""",
    },
    "FIR_2025_ND_105": {
        "case_no": "FIR No. 105/2025",
        "ps": "Economic Offences Wing, Delhi Police",
        "sections": "PMLA 2002 Sec. 3, 4; FEMA; BNS Sec. 316 (Criminal Breach of Trust)",
        "title": "Commercial Hawala Network & Shell Company Money Laundering",
        "incident_date": "05/07/2025",
        "complainant": "Director, Enforcement Directorate, Delhi Zone",
        "narrative": """
FIRST INFORMATION REPORT
Case No.: FIR No. 105/2025
Police Station: Economic Offences Wing, Delhi Police / Enforcement Directorate
Date & Time of Report: 05/07/2025, 10:00 hrs
Applicable Sections: PMLA 2002 Sec. 3, 4; FEMA; BNS Sec. 316

INCIDENT SUMMARY:
ED investigation reveals a large-scale Hawala money laundering operation processing
approximately Rs. 22 Crore between January 2025 and June 2025 through Shroff Money Services
(SMS Hawala, Pahar Ganj, New Delhi) and multiple shell accounts of Apex Global Logistics Pvt Ltd.

ACCUSED PERSONS:
1. Ravi Kumar alias "Ravan" (s/o Ramesh Kumar)
   Address: C-14, Sector 7, Rohini, New Delhi
   Mobile: +91-98110-44501
   Role: Beneficial owner of Apex Global Logistics Pvt Ltd shell company;
         laundered extortion proceeds from FIR 101/2025 through Apex and SMS Hawala.
   NOTE: Ravi Kumar is the PRIMARY ACCUSED in FIR 101/2025 (Extortion).

2. Deepak Srivastava alias "D. Srivastava"
   Address: Civil Lines, Allahabad, UP
   Mobile: +91-76543-21000
   Role: Hawala broker; managed informal fund transfers through Shroff Money Services

3. Aarav Mehta alias "AJ Mehta"
   Address: Bandra West, Mumbai, Maharashtra
   Mobile: +91-99300-67890
   Role: Receiving end of laundered crypto proceeds from Case 102; converted back to INR
   via Apex Logistics accounts.
   NOTE: Aarav Mehta is also accused in FIR 102/2025 (Cyber Fraud).

4. Rohit Patel alias "R. Patel"
   Address: Satellite Area, Ahmedabad, Gujarat
   Mobile: +91-96000-12345
   Role: Financial intermediary; laundered vehicle theft proceeds via SMS Hawala.
   NOTE: Rohit Patel also appears in FIR 104/2025 (Vehicle Theft).

CROSS-CASE FINANCIAL NEXUS — APEX GLOBAL LOGISTICS PVT LTD:
Bank Account No. 606060606060606 (Apex Global Logistics Pvt Ltd, Kotak Bank) appears in:
  - FIR 101/2025 — Extortion proceeds routing
  - FIR 105/2025 — Hawala layering
This constitutes a HIGH-CONFIDENCE cross-case link and the entity is flagged for deep graph analysis.

FINANCIAL TRANSACTIONS:
- Total Rs. 22 Crore routed through 417 transactions (NEFT, RTGS, Cash deposits)
- Account No. 998877665544332 (PNB) — Deepak Srivastava: Rs. 6.4 Crore received
- Account No. 112233445566778 (ICICI) — Aarav Mehta: Rs. 4.2 Crore (appears in Case 102 also)
- Account No. 556677889900112 (Axis) — Rohit Patel: Rs. 3.8 Crore

EVIDENCE:
- Banking transaction statements (417 transactions)
- Hawala ledger seized from Shroff Money Services premises on 01/07/2025
- Statement of informant (Ref: INF/2025/EOW/021)
""",
    },
}


def write_firs():
    print("[1/5] Generating FIR reports...")
    for fname, data in FIRS.items():
        path = os.path.join(DIRS["fir"], f"{fname}.txt")
        with open(path, "w", encoding="utf-8") as f:
            f.write(data["narrative"].strip())
        print(f"  ✓ {fname}.txt")


# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 2.1B — CALL DETAIL RECORDS (CDR)
# ═══════════════════════════════════════════════════════════════════════════════

def write_cdr():
    print("[2/5] Generating Call Detail Records (CDR)...")
    phones = [p["phone"] for p in PERSONS if p["phone"]] + [p["phone2"] for p in PERSONS if p["phone2"]]
    towers = CELL_TOWERS
    rows = []
    call_id = 1000

    # Structured cross-case communication chains
    key_pairs = [
        ("+91-98110-44501", "+91-98765-32100"),   # Ravi → Vikram (Case 101)
        ("+91-98765-32100", "+91-99300-67890"),   # Vikram → Aarav  (102)
        ("+91-98110-99999", "+91-98765-32100"),   # Burner → Vikram (102↔103)
        ("+91-98110-99999", "+91-94221-11111"),   # Burner → Suresh (103)
        ("+91-98110-44501", "+91-76543-21000"),   # Ravi → Deepak   (105)
        ("+91-99300-67890", "+91-76543-21000"),   # Aarav → Deepak  (102, 105)
        ("+91-98765-32100", "+91-98765-32100"),   # Vikram self-loop guard skip
        ("+91-96000-12345", "+91-81111-55555"),   # Rohit → Priya   (104)
        ("+91-87654-32100", "+91-94221-11111"),   # Manu → Suresh   (103)
        ("+91-87654-32100", "+91-98110-44501"),   # Manu → Ravi     (101)
    ]

    case_map = {
        ("+91-98110-44501", "+91-98765-32100"): "101",
        ("+91-98765-32100", "+91-99300-67890"): "102",
        ("+91-98110-99999", "+91-98765-32100"): "102",
        ("+91-98110-99999", "+91-94221-11111"): "103",
        ("+91-98110-44501", "+91-76543-21000"): "105",
        ("+91-99300-67890", "+91-76543-21000"): "105",
        ("+91-96000-12345", "+91-81111-55555"): "104",
        ("+91-87654-32100", "+91-94221-11111"): "103",
        ("+91-87654-32100", "+91-98110-44501"): "101",
    }

    # Key structured calls
    for (caller, receiver) in key_pairs:
        if caller == receiver:
            continue
        n_calls = random.randint(8, 22)
        base_dt = datetime(2025, random.randint(3, 6), random.randint(1, 28))
        for i in range(n_calls):
            dt = base_dt + timedelta(hours=random.randint(0, 240), minutes=random.randint(0, 59))
            tower = random.choice(towers)
            call_type = random.choice(["VOICE", "VOICE", "VOICE", "SMS"])
            duration = random.randint(30, 480) if call_type == "VOICE" else 0
            case_id = case_map.get((caller, receiver), case_map.get((receiver, caller), ""))
            rows.append({
                "call_id": f"CDR{call_id:06d}",
                "caller_number": caller,
                "receiver_number": receiver,
                "timestamp": fmt(dt),
                "duration_seconds": duration,
                "call_type": call_type,
                "cell_tower_id": tower["id"],
                "tower_location": tower["location"],
                "imei_caller": f"35{random.randint(1000000000000, 9999999999999)}",
                "imei_receiver": f"35{random.randint(1000000000000, 9999999999999)}",
                "source_case_id": case_id,
                "flagged_suspicious": "YES" if call_type == "VOICE" and duration > 300 else "NO",
            })
            call_id += 1

    # Random background noise calls between lesser-known numbers
    noise_phones = phones[:8]
    for _ in range(300):
        caller = random.choice(noise_phones)
        receiver = random.choice(noise_phones)
        if caller == receiver:
            continue
        tower = random.choice(towers)
        call_type = random.choice(["VOICE", "SMS"])
        dt = rand_dt(300, 30)
        rows.append({
            "call_id": f"CDR{call_id:06d}",
            "caller_number": caller,
            "receiver_number": receiver,
            "timestamp": fmt(dt),
            "duration_seconds": random.randint(10, 200) if call_type == "VOICE" else 0,
            "call_type": call_type,
            "cell_tower_id": tower["id"],
            "tower_location": tower["location"],
            "imei_caller": f"35{random.randint(1000000000000, 9999999999999)}",
            "imei_receiver": f"35{random.randint(1000000000000, 9999999999999)}",
            "source_case_id": "",
            "flagged_suspicious": "NO",
        })
        call_id += 1

    path = os.path.join(DIRS["cdr"], "call_detail_records.csv")
    fieldnames = ["call_id","caller_number","receiver_number","timestamp","duration_seconds",
                  "call_type","cell_tower_id","tower_location","imei_caller","imei_receiver",
                  "source_case_id","flagged_suspicious"]
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)
    print(f"  ✓ call_detail_records.csv ({len(rows)} rows)")


# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 2.1C — FINANCIAL TRANSACTIONS
# ═══════════════════════════════════════════════════════════════════════════════

def write_financial():
    print("[3/5] Generating Financial Transactions...")
    txn_id = 5000
    rows = []

    txn_types = ["NEFT", "RTGS", "UPI", "IMPS", "CASH", "HAWALA"]

    # Structured suspicious transactions (evidence-linked)
    structured = [
        # (from_acc_id, to_acc_id, amount_min, amount_max, n_txns, txn_type, case_id, flagged)
        ("A001", "A006", 100000, 500000, 12, "NEFT",   "101", "YES"),  # Ravi → Apex
        ("A006", "A003", 50000,  200000, 8,  "HAWALA", "105", "YES"),  # Apex → Aarav
        ("A002", "A003", 80000,  300000, 10, "NEFT",   "102", "YES"),  # Vikram → Aarav
        ("A003", "A005", 50000,  150000, 7,  "RTGS",   "105", "YES"),  # Aarav → Rohit
        ("A004", "A006", 200000, 800000, 9,  "HAWALA", "105", "YES"),  # Deepak → Apex
        ("A005", "A004", 100000, 400000, 6,  "NEFT",   "104", "YES"),  # Rohit → Deepak
        ("A002", "A001", 30000,  100000, 5,  "UPI",    "101", "YES"),  # Vikram → Ravi
        ("A001", "A004", 50000,  250000, 4,  "CASH",   "105", "YES"),  # Ravi → Deepak
    ]

    acc_map = {a["id"]: a for a in ACCOUNTS}

    for (from_id, to_id, amin, amax, n, txn_type, case_id, flagged) in structured:
        fa = acc_map[from_id]
        ta = acc_map[to_id]
        holder_from = next((p["name"] for p in PERSONS if p["id"] == fa.get("holder_id")), fa.get("holder_id", ""))
        holder_to   = next((p["name"] for p in PERSONS if p["id"] == ta.get("holder_id")), ta.get("holder_id", ""))
        for _ in range(n):
            amount = round(random.randint(amin, amax) / 1000) * 1000
            dt = rand_dt(300, 30)
            rows.append({
                "txn_id": f"TXN{txn_id:07d}",
                "timestamp": fmt(dt),
                "sender_account": fa["number"],
                "sender_name": holder_from,
                "sender_ifsc": fa["ifsc"],
                "sender_bank": fa["bank"],
                "receiver_account": ta["number"],
                "receiver_name": holder_to,
                "receiver_ifsc": ta["ifsc"],
                "receiver_bank": ta["bank"],
                "amount_inr": amount,
                "txn_type": txn_type,
                "source_case_id": case_id,
                "flagged_suspicious": flagged,
                "remarks": f"Unstructured payment - no invoice reference" if flagged == "YES" else "",
            })
            txn_id += 1

    # Background legitimate-looking transactions
    all_acc = ACCOUNTS
    for _ in range(150):
        fa = random.choice(all_acc)
        ta = random.choice(all_acc)
        if fa["id"] == ta["id"]:
            continue
        holder_from = next((p["name"] for p in PERSONS if p["id"] == fa.get("holder_id")), "")
        holder_to   = next((p["name"] for p in PERSONS if p["id"] == ta.get("holder_id")), "")
        rows.append({
            "txn_id": f"TXN{txn_id:07d}",
            "timestamp": fmt(rand_dt(365, 30)),
            "sender_account": fa["number"],
            "sender_name": holder_from,
            "sender_ifsc": fa["ifsc"],
            "sender_bank": fa["bank"],
            "receiver_account": ta["number"],
            "receiver_name": holder_to,
            "receiver_ifsc": ta["ifsc"],
            "receiver_bank": ta["bank"],
            "amount_inr": round(random.randint(1000, 50000) / 500) * 500,
            "txn_type": random.choice(txn_types),
            "source_case_id": "",
            "flagged_suspicious": "NO",
            "remarks": "",
        })
        txn_id += 1

    path = os.path.join(DIRS["financial"], "financial_transactions.csv")
    fieldnames = ["txn_id","timestamp","sender_account","sender_name","sender_ifsc","sender_bank",
                  "receiver_account","receiver_name","receiver_ifsc","receiver_bank",
                  "amount_inr","txn_type","source_case_id","flagged_suspicious","remarks"]
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)
    print(f"  ✓ financial_transactions.csv ({len(rows)} rows)")


# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 2.1D — INFORMANT INTELLIGENCE BRIEFS
# ═══════════════════════════════════════════════════════════════════════════════

def write_intelligence():
    print("[4/5] Generating Informant Intelligence Briefs...")
    briefs = [
        {"ref": "INF/2025/ND/007", "date": "10/04/2025", "type": "Human Intelligence",
         "source_reliability": "B2 (Reliable / Probably True)", "case_ids": ["101"],
         "content": "Source reports that 'Ravan' (Ravi Kumar) held a planning meeting with Vicky (Vikram Singh) and two others at a dhaba near Rohini Sector 7 on 10/04/2025 at 19:00 hrs. A black Fortuner was spotted outside (Plate: DL-01-AB-1234). Topic of meeting: planned robbery at a jewellery shop in Karol Bagh within 3 days."},
        {"ref": "INF/2025/UP/014", "date": "05/06/2025", "type": "Electronic Intelligence",
         "source_reliability": "A1 (Completely Reliable / Confirmed)", "case_ids": ["103"],
         "content": "Intercepted communication on +91-94221-11111 (Suresh Yadav) references a consignment of 'machinery' being transported on NH-58. Contact with unknown number (+91-98110-99999) confirmed at 03/06/2025, 23:45 hrs. CROSS-NOTE: Same +91-98110-99999 is flagged in Case 102 (Cyber Fraud)."},
        {"ref": "INF/2025/EOW/021", "date": "28/06/2025", "type": "Financial Intelligence",
         "source_reliability": "B1 (Reliable / Confirmed)", "case_ids": ["105", "101"],
         "content": "Bank examination of Apex Global Logistics Pvt Ltd reveals 417 transactions totalling Rs. 22 Crore with no genuine business invoices. Directors are frontmen for Ravi Kumar alias Ravan (primary accused in Case 101). Deepak Srivastava (Shroff Money Services) is the hawala operator routing proceeds offshore."},
        {"ref": "INF/2025/MH/009", "date": "18/06/2025", "type": "Human Intelligence",
         "source_reliability": "C2 (Fairly Reliable / Possibly True)", "case_ids": ["104"],
         "content": "Priya Nair (Koramangala, Bengaluru) is believed to be the head of an inter-state vehicle cloning ring. She is in contact with Rohit Patel (Ahmedabad) who arranges delivery of cloned vehicles to buyers in NCR and Gujarat. Luxe Motor Exports appears to be a front entity."},
    ]
    path = os.path.join(DIRS["intel"], "informant_briefs.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(briefs, f, indent=2, ensure_ascii=False)
    print(f"  ✓ informant_briefs.json ({len(briefs)} briefs)")


# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 2.1E — GROUND TRUTH METADATA
# ═══════════════════════════════════════════════════════════════════════════════

def write_metadata():
    print("[5/5] Generating Ground Truth Metadata...")

    # Ground truth entities
    entities = {
        "persons": PERSONS,
        "organizations": ORGANIZATIONS,
        "vehicles": VEHICLES,
        "locations": LOCATIONS,
        "financial_accounts": ACCOUNTS,
        "phone_numbers": [
            {"number": p["phone"], "person_id": p["id"], "registered": True}
            for p in PERSONS if p["phone"]
        ] + [
            {"number": p["phone2"], "person_id": p["id"], "registered": True}
            for p in PERSONS if p["phone2"]
        ] + [
            {"number": "+91-98110-99999", "person_id": None, "registered": False,
             "note": "Unregistered burner phone — cross-case connector (102, 103)"}
        ],
    }
    with open(os.path.join(DIRS["metadata"], "ground_truth_entities.json"), "w", encoding="utf-8") as f:
        json.dump(entities, f, indent=2, ensure_ascii=False)
    print("  ✓ ground_truth_entities.json")

    # Ground truth relationship graph
    edges = [
        {"from_id": "P001", "to_id": "P002", "relation": "ASSOCIATED_WITH",     "source_case": "101", "confidence": 0.97},
        {"from_id": "P001", "to_id": "P003", "relation": "ASSOCIATED_WITH",     "source_case": "101", "confidence": 0.92},
        {"from_id": "P001", "to_id": "P008", "relation": "ASSOCIATED_WITH",     "source_case": "101", "confidence": 0.88},
        {"from_id": "P002", "to_id": "P004", "relation": "COMMUNICATES_WITH",   "source_case": "102", "confidence": 0.95},
        {"from_id": "P002", "to_id": "P009", "relation": "ASSOCIATED_WITH",     "source_case": "102", "confidence": 0.85},
        {"from_id": "P011", "to_id": "P002", "relation": "COMMUNICATES_WITH",   "source_case": "102", "confidence": 0.93},
        {"from_id": "P011", "to_id": "P005", "relation": "COMMUNICATES_WITH",   "source_case": "103", "confidence": 0.91},
        {"from_id": "P005", "to_id": "P008", "relation": "ASSOCIATED_WITH",     "source_case": "103", "confidence": 0.87},
        {"from_id": "P006", "to_id": "P010", "relation": "ASSOCIATED_WITH",     "source_case": "104", "confidence": 0.90},
        {"from_id": "P001", "to_id": "P007", "relation": "FINANCIAL_TRANSFER_TO","source_case": "105","confidence": 0.96},
        {"from_id": "P004", "to_id": "P007", "relation": "FINANCIAL_TRANSFER_TO","source_case": "105","confidence": 0.94},
        {"from_id": "P010", "to_id": "P007", "relation": "FINANCIAL_TRANSFER_TO","source_case": "105","confidence": 0.89},
        {"from_id": "P001", "to_id": "O001", "relation": "OWNS",                 "source_case": "105", "confidence": 0.98},
        {"from_id": "P004", "to_id": "O002", "relation": "ASSOCIATED_WITH",      "source_case": "102", "confidence": 0.88},
        {"from_id": "P005", "to_id": "O003", "relation": "ASSOCIATED_WITH",      "source_case": "103", "confidence": 0.90},
        {"from_id": "P006", "to_id": "O004", "relation": "OWNS",                 "source_case": "104", "confidence": 0.92},
        {"from_id": "P007", "to_id": "O005", "relation": "ASSOCIATED_WITH",      "source_case": "105", "confidence": 0.95},
        {"from_id": "O001", "to_id": "L004", "relation": "LOCATED_AT",           "source_case": "101", "confidence": 1.0},
        {"from_id": "P001", "to_id": "V001", "relation": "OWNS",                 "source_case": "101", "confidence": 0.85},
        {"from_id": "P002", "to_id": "V001", "relation": "APPEARED_IN",          "source_case": "101", "confidence": 0.80},
        {"from_id": "P001", "to_id": "L001", "relation": "LOCATED_AT",           "source_case": "101", "confidence": 1.0},
        {"from_id": "P004", "to_id": "L003", "relation": "LOCATED_AT",           "source_case": "102", "confidence": 1.0},
    ]
    graph = {"nodes": entities["persons"] + entities["organizations"], "edges": edges}
    with open(os.path.join(DIRS["metadata"], "ground_truth_graph.json"), "w", encoding="utf-8") as f:
        json.dump(graph, f, indent=2, ensure_ascii=False)
    print("  ✓ ground_truth_graph.json")

    # Cross-case scenarios (documented ground truth links)
    scenarios = [
        {
            "scenario_id": "XC-001",
            "title": "Shared Shell Company: Apex Global Logistics Pvt Ltd",
            "description": "Apex Global Logistics Pvt Ltd (O001) is the financial conduit appearing in both FIR 101/2025 (Extortion) and FIR 105/2025 (Hawala). Ravi Kumar (P001) is the beneficial owner operating both criminal activities through the same front company.",
            "case_ids": ["101", "105"],
            "shared_entities": ["O001", "P001", "A006"],
            "priority": "HIGH",
            "algorithm_hint": "Common Neighbors / Shared Node Detection",
        },
        {
            "scenario_id": "XC-002",
            "title": "Burner Phone Bridge: +91-98110-99999 connecting Cyber Fraud and Arms Smuggling",
            "description": "An unregistered burner phone (+91-98110-99999) communicated with Vikram Singh (P002, Case 102 mastermind) and Suresh Yadav (P005, Case 103 arms coordinator). This constitutes a hidden cross-case connector between two seemingly unrelated crimes.",
            "case_ids": ["102", "103"],
            "shared_entities": ["P011"],
            "priority": "HIGH",
            "algorithm_hint": "Common Neighbors via Phone Entity / Betweenness Centrality",
        },
        {
            "scenario_id": "XC-003",
            "title": "Vikram Singh: High-Betweenness Bridge Node across Cases 101-102-103",
            "description": "Vikram Singh (P002) appears as an active participant in Cases 101, 102, and 103. Graph analysis shows he is the critical bridge connecting extortion, cyber fraud, and arms networks — indicating possible role as a central coordinator or fixer.",
            "case_ids": ["101", "102", "103"],
            "shared_entities": ["P002"],
            "priority": "CRITICAL",
            "algorithm_hint": "Betweenness Centrality — P002 expected to rank #1",
        },
        {
            "scenario_id": "XC-004",
            "title": "Aarav Mehta: Shared Financial Account across Cases 102 & 105",
            "description": "Account No. 112233445566778 (ICICI, Aarav Mehta / P004) appears in FIR 102/2025 as a crypto layering account AND in FIR 105/2025 as a hawala receiving account. This is a direct financial cross-case link.",
            "case_ids": ["102", "105"],
            "shared_entities": ["P004", "A003"],
            "priority": "HIGH",
            "algorithm_hint": "Shared Account Node / Path Analysis",
        },
        {
            "scenario_id": "XC-005",
            "title": "Rohit Patel: Vehicle Theft proceeds laundered via Hawala (Cases 104 & 105)",
            "description": "Rohit Patel (P010) appears in Case 104 (Vehicle Theft) and Case 105 (Hawala). Financial records show vehicle theft proceeds were routed through Shroff Money Services (O005) — connecting the auto crime cell to the hawala network.",
            "case_ids": ["104", "105"],
            "shared_entities": ["P010", "O005"],
            "priority": "MEDIUM",
            "algorithm_hint": "Common Neighbors / Shared Transaction Trace",
        },
    ]
    with open(os.path.join(DIRS["metadata"], "cross_case_scenarios.json"), "w", encoding="utf-8") as f:
        json.dump(scenarios, f, indent=2, ensure_ascii=False)
    print("  ✓ cross_case_scenarios.json")


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("=" * 60)
    print("  SIH 2026 — Synthetic Dataset Generator")
    print("  AI-Powered Criminal Network Analysis Platform")
    print("=" * 60)
    write_firs()
    write_cdr()
    write_financial()
    write_intelligence()
    write_metadata()
    print("=" * 60)
    print("  Dataset generation complete.")
    print(f"  Output location: {BASE_DIR}")
    print("=" * 60)
