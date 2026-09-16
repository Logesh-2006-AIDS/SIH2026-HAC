"""
Gold Standard Benchmark Dataset for Indian Criminal Investigation & FIR NLP
=============================================================================
Curated test documents with ground-truth entity, role, relationship,
and negation/uncertainty annotations.
"""

from typing import Dict, List, Any

GOLD_STANDARD_DATASET: List[Dict[str, Any]] = [
    # ── FIR 01: Cyber Financial Fraud ──────────────────────────────────────────
    {
        "id": "FIR-2025-CYBER-001",
        "title": "Online Banking & OTP Phishing Fraud",
        "text": (
            "FIR No. 89/2025 registered at Cyber Crime Police Station, Bengaluru on 14 January 2025. "
            "Complainant Rajesh Ramanathan, residing at Indiranagar, Bengaluru, reported that "
            "accused Amit Verma falsely called him from mobile 9845012345 pretending to be an officer from SBI Bank. "
            "Amit Verma defrauded him of Rs. 2,50,000 via unauthorized bank transfer. "
            "The accused did not return the stolen funds. "
            "Case registered under Section 420 IPC and Section 66D IT Act."
        ),
        "ground_truth": {
            "entities": [
                {"type": "CASE", "text": "89/2025"},
                {"type": "DATE", "text": "14 January 2025"},
                {"type": "LOCATION", "text": "Bengaluru"},
                {"type": "PERSON", "text": "Rajesh Ramanathan", "role": "COMPLAINANT"},
                {"type": "LOCATION", "text": "Indiranagar"},
                {"type": "PERSON", "text": "Amit Verma", "role": "ACCUSED"},
                {"type": "PHONE", "text": "9845012345"},
                {"type": "BANK", "text": "SBI Bank"},
                {"type": "MONETARY_AMOUNT", "text": "2,50,000"},
                {"type": "CRIME_TYPE", "text": "420"},
                {"type": "CRIME_TYPE", "text": "66D"},
            ],
            "relationships": [
                {"source": "Amit Verma", "target": "89/2025", "rel_type": "ACCUSED_IN"},
                {"source": "Rajesh Ramanathan", "target": "89/2025", "rel_type": "REPORTED"},
                {"source": "Amit Verma", "target": "9845012345", "rel_type": "CALLED"},
                {"source": "Rajesh Ramanathan", "target": "Indiranagar", "rel_type": "LOCATED_AT"},
            ],
            "forbidden_relationships": [
                # Rajesh Ramanathan is victim/complainant, NOT accused
                {"source": "Rajesh Ramanathan", "rel_type": "ACCUSED_IN"},
                # "did not return" must not produce confirmed positive transfer to victim
                {"source": "Amit Verma", "target": "Rajesh Ramanathan", "rel_type": "TRANSACTION_WITH", "status": "CONFIRMED"},
            ],
            "negations": [
                {"sentence_contains": "did not return", "is_negated": True}
            ]
        }
    },

    # ── FIR 02: Armed Highway Robbery ──────────────────────────────────────────
    {
        "id": "FIR-2025-ROB-002",
        "title": "Armed Highway Interception & Robbery",
        "text": (
            "FIR No. 342/2025 at Mehrauli Police Station dated 03 February 2025. "
            "Eyewitness Sunil Grover stated that he saw the accused Kuldeep Yadav driving vehicle DL-3C-AK-4589 "
            "near Saket Metro Station. "
            "Kuldeep Yadav assaulted the victim Harish Chopra and looted Rs. 75,000. "
            "Sunil Grover did not contact the accused prior to the attack. "
            "Inspector Arvind Rathore arrived at the crime scene."
        ),
        "ground_truth": {
            "entities": [
                {"type": "CASE", "text": "342/2025"},
                {"type": "DATE", "text": "03 February 2025"},
                {"type": "PERSON", "text": "Sunil Grover", "role": "WITNESS"},
                {"type": "PERSON", "text": "Kuldeep Yadav", "role": "ACCUSED"},
                {"type": "VEHICLE", "text": "DL-3C-AK-4589"},
                {"type": "LOCATION", "text": "Saket"},
                {"type": "PERSON", "text": "Harish Chopra", "role": "VICTIM"},
                {"type": "MONETARY_AMOUNT", "text": "75,000"},
                {"type": "PERSON", "text": "Arvind Rathore", "role": "OFFICER"},
            ],
            "relationships": [
                {"source": "Kuldeep Yadav", "target": "DL-3C-AK-4589", "rel_type": "DRIVES"},
                {"source": "Sunil Grover", "target": "342/2025", "rel_type": "WITNESS_IN"},
            ],
            "forbidden_relationships": [
                {"source": "Harish Chopra", "rel_type": "ACCUSED_IN"},
                {"source": "Sunil Grover", "target": "Kuldeep Yadav", "rel_type": "CONTACTED", "status": "CONFIRMED"},
            ],
            "negations": [
                {"sentence_contains": "did not contact", "is_negated": True}
            ]
        }
    },

    # ── FIR 03: Homicide & Forensic Investigation ──────────────────────────────
    {
        "id": "FIR-2025-MURD-003",
        "title": "Fatal Assault & Stabbing Case",
        "text": (
            "FIR No. 112/2025 under Section 302 IPC registered at Kotwali Police Station. "
            "The deceased victim Manoj Kumar was found at Civil Lines on 22 February 2025. "
            "Witness Dinesh Bhatia gave a statement that prime accused Suraj Bhan had a violent dispute with the victim. "
            "However, Suraj Bhan was not present at the railway station during the morning. "
            "Sub-Inspector Vikram Negi seized the blood-stained weapon."
        ),
        "ground_truth": {
            "entities": [
                {"type": "CASE", "text": "112/2025"},
                {"type": "CRIME_TYPE", "text": "302"},
                {"type": "PERSON", "text": "Manoj Kumar", "role": "VICTIM"},
                {"type": "LOCATION", "text": "Civil Lines"},
                {"type": "DATE", "text": "22 February 2025"},
                {"type": "PERSON", "text": "Dinesh Bhatia", "role": "WITNESS"},
                {"type": "PERSON", "text": "Suraj Bhan", "role": "ACCUSED"},
                {"type": "PERSON", "text": "Vikram Negi", "role": "OFFICER"},
            ],
            "relationships": [
                {"source": "Suraj Bhan", "target": "112/2025", "rel_type": "ACCUSED_IN"},
                {"source": "Dinesh Bhatia", "target": "112/2025", "rel_type": "WITNESS_IN"},
            ],
            "forbidden_relationships": [
                {"source": "Manoj Kumar", "rel_type": "ACCUSED_IN"},
                # "was not present" must not link Suraj Bhan to railway station
                {"source": "Suraj Bhan", "target": "railway station", "rel_type": "LOCATED_AT", "status": "CONFIRMED"},
            ],
            "negations": [
                {"sentence_contains": "was not present", "is_negated": True}
            ]
        }
    },

    # ── FIR 04: Narcotics & NDPS Interdiction ──────────────────────────────────
    {
        "id": "FIR-2025-NDPS-004",
        "title": "Narcotics Smuggling under NDPS Act",
        "text": (
            "FIR No. 78/2025 registered under Section 21 NDPS Act. "
            "As per secret informant, accused Tariq Ahmed was apprehended at Rohini, Delhi on 10 March 2025. "
            "Accused was found carrying 500 grams of contraband heroin. "
            "Tariq Ahmed called his associate Jagdish Prasad using mobile phone 9811223344. "
            "ACP Rakesh Asthana supervised the search operation."
        ),
        "ground_truth": {
            "entities": [
                {"type": "CASE", "text": "78/2025"},
                {"type": "CRIME_TYPE", "text": "21"},
                {"type": "PERSON", "text": "Tariq Ahmed", "role": "ACCUSED"},
                {"type": "LOCATION", "text": "Rohini"},
                {"type": "DATE", "text": "10 March 2025"},
                {"type": "PERSON", "text": "Jagdish Prasad", "role": "ACCUSED"},
                {"type": "PHONE", "text": "9811223344"},
                {"type": "PERSON", "text": "Rakesh Asthana", "role": "OFFICER"},
            ],
            "relationships": [
                {"source": "Tariq Ahmed", "target": "78/2025", "rel_type": "ACCUSED_IN"},
                {"source": "Tariq Ahmed", "target": "Rohini", "rel_type": "LOCATED_AT"},
                {"source": "Tariq Ahmed", "target": "Jagdish Prasad", "rel_type": "CONTACTED"},
            ],
            "forbidden_relationships": [
                {"source": "Rakesh Asthana", "rel_type": "ACCUSED_IN"},
            ],
            "negations": []
        }
    },

    # ── FIR 05: Vehicle Theft / Carjacking ─────────────────────────────────────
    {
        "id": "FIR-2025-AUTO-005",
        "title": "Motor Vehicle Theft from Parking Lot",
        "text": (
            "Case No. 512/2025 registered at Sector 18 Police Station, Noida on 19 March 2025. "
            "Complainant Pooja Sharma reported that her vehicle UP-16-BW-9999 was stolen from parking. "
            "Pooja Sharma is residing at Sector 62, Noida. "
            "CCTV footage showed accused Bunty alias Rahul Sharma driving the vehicle towards Greater Noida. "
            "The accused has not been traced yet."
        ),
        "ground_truth": {
            "entities": [
                {"type": "CASE", "text": "512/2025"},
                {"type": "DATE", "text": "19 March 2025"},
                {"type": "PERSON", "text": "Pooja Sharma", "role": "COMPLAINANT"},
                {"type": "VEHICLE", "text": "UP-16-BW-9999"},
                {"type": "LOCATION", "text": "Noida"},
                {"type": "PERSON", "text": "Rahul Sharma", "role": "ACCUSED"},
            ],
            "relationships": [
                {"source": "Pooja Sharma", "target": "512/2025", "rel_type": "REPORTED"},
                {"source": "Rahul Sharma", "target": "UP-16-BW-9999", "rel_type": "DRIVES"},
            ],
            "forbidden_relationships": [
                {"source": "Pooja Sharma", "rel_type": "ACCUSED_IN"},
            ],
            "negations": [
                {"sentence_contains": "has not been traced", "is_negated": True}
            ]
        }
    },

    # ── FIR 06: Kidnapping & Extortion ─────────────────────────────────────────
    {
        "id": "FIR-2025-EXT-006",
        "title": "Kidnapping for Ransom and Coercion",
        "text": (
            "FIR No. 401/2025 under Section 364A IPC at Hauz Khas Police Station. "
            "Accused Gurpreet Singh alias Vicky kidnapped victim Master Aryan on 25 March 2025. "
            "Gurpreet Singh dialed 9711002233 and demanded ransom of Rs. 50,00,000 from the family. "
            "Complainant Kamal Kishore stated that he refused to pay the ransom amount. "
            "Accused Gurpreet Singh was arrested from Dwarka."
        ),
        "ground_truth": {
            "entities": [
                {"type": "CASE", "text": "401/2025"},
                {"type": "CRIME_TYPE", "text": "364A"},
                {"type": "PERSON", "text": "Gurpreet Singh", "role": "ACCUSED"},
                {"type": "PERSON", "text": "Aryan", "role": "VICTIM"},
                {"type": "DATE", "text": "25 March 2025"},
                {"type": "PHONE", "text": "9711002233"},
                {"type": "MONETARY_AMOUNT", "text": "50,00,000"},
                {"type": "PERSON", "text": "Kamal Kishore", "role": "COMPLAINANT"},
                {"type": "LOCATION", "text": "Dwarka"},
            ],
            "relationships": [
                {"source": "Gurpreet Singh", "target": "401/2025", "rel_type": "ACCUSED_IN"},
                {"source": "Kamal Kishore", "target": "401/2025", "rel_type": "REPORTED"},
                {"source": "Gurpreet Singh", "target": "Dwarka", "rel_type": "LOCATED_AT"},
            ],
            "forbidden_relationships": [
                {"source": "Aryan", "rel_type": "ACCUSED_IN"},
                {"source": "Kamal Kishore", "rel_type": "ACCUSED_IN"},
                {"source": "Kamal Kishore", "target": "Gurpreet Singh", "rel_type": "TRANSACTION_WITH", "status": "CONFIRMED"},
            ],
            "negations": [
                {"sentence_contains": "refused to pay", "is_negated": True}
            ]
        }
    },

    # ── FIR 07: Real Estate Syndicate Cheating ─────────────────────────────────
    {
        "id": "FIR-2025-EOW-007",
        "title": "Corporate Real Estate Fraud & Embezzlement",
        "text": (
            "FIR No. 210/2025 registered at Economic Offences Wing, New Delhi. "
            "Complainant Ananya Roy filed a complaint against accused builder Pradeep Agarwal. "
            "Pradeep Agarwal transferred money to shell company account in HDFC Bank on 11 April 2025. "
            "The sum of Rs. 1,20,00,000 was siphoned off without delivering apartments. "
            "Pradeep Agarwal denied knowing co-conspirator Mahesh Goel."
        ),
        "ground_truth": {
            "entities": [
                {"type": "CASE", "text": "210/2025"},
                {"type": "LOCATION", "text": "New Delhi"},
                {"type": "PERSON", "text": "Ananya Roy", "role": "COMPLAINANT"},
                {"type": "PERSON", "text": "Pradeep Agarwal", "role": "ACCUSED"},
                {"type": "BANK", "text": "HDFC Bank"},
                {"type": "DATE", "text": "11 April 2025"},
                {"type": "MONETARY_AMOUNT", "text": "1,20,00,000"},
                {"type": "PERSON", "text": "Mahesh Goel", "role": "ACCUSED"},
            ],
            "relationships": [
                {"source": "Pradeep Agarwal", "target": "210/2025", "rel_type": "ACCUSED_IN"},
                {"source": "Ananya Roy", "target": "210/2025", "rel_type": "REPORTED"},
            ],
            "forbidden_relationships": [
                {"source": "Ananya Roy", "rel_type": "ACCUSED_IN"},
                # "denied knowing" must NOT create confirmed KNOWS relationship
                {"source": "Pradeep Agarwal", "target": "Mahesh Goel", "rel_type": "KNOWS", "status": "CONFIRMED"},
            ],
            "negations": [
                {"sentence_contains": "denied knowing", "is_negated": True}
            ]
        }
    },

    # ── FIR 08: Violent Neighborhood Assault ───────────────────────────────────
    {
        "id": "FIR-2025-ASST-008",
        "title": "Assault and Grievous Hurt Case",
        "text": (
            "FIR No. 65/2025 under Section 323 and Section 325 IPC at Shahdara Police Station. "
            "The injured victim Deepak Verma was assaulted by accused Satish Malik on 28 April 2025. "
            "Panch witness Om Prakash deposed in the inquiry. "
            "The accused did not carry any firearm during the clash. "
            "ASI Satbir Singh prepared the injury sheet."
        ),
        "ground_truth": {
            "entities": [
                {"type": "CASE", "text": "65/2025"},
                {"type": "CRIME_TYPE", "text": "323"},
                {"type": "CRIME_TYPE", "text": "325"},
                {"type": "PERSON", "text": "Deepak Verma", "role": "VICTIM"},
                {"type": "PERSON", "text": "Satish Malik", "role": "ACCUSED"},
                {"type": "DATE", "text": "28 April 2025"},
                {"type": "PERSON", "text": "Om Prakash", "role": "WITNESS"},
                {"type": "PERSON", "text": "Satbir Singh", "role": "OFFICER"},
            ],
            "relationships": [
                {"source": "Satish Malik", "target": "65/2025", "rel_type": "ACCUSED_IN"},
                {"source": "Om Prakash", "target": "65/2025", "rel_type": "WITNESS_IN"},
            ],
            "forbidden_relationships": [
                {"source": "Deepak Verma", "rel_type": "ACCUSED_IN"},
                {"source": "Satbir Singh", "rel_type": "ACCUSED_IN"},
            ],
            "negations": [
                {"sentence_contains": "did not carry", "is_negated": True}
            ]
        }
    },

    # ── FIR 09: Corruption & Anti-Corruption Trap ──────────────────────────────
    {
        "id": "FIR-2025-ACB-009",
        "title": "Anti-Corruption Bureau Trap & Bribe Seizure",
        "text": (
            "FIR No. 15/2025 registered at Anti-Corruption Branch, Jaipur on 05 May 2025. "
            "Complainant Hemant Joshi alleged that Executive Engineer Vijay Bansal demanded bribe of Rs. 50,000. "
            "DSP Alok Sharma conducted the trap at Secretariat, Jaipur. "
            "Vijay Bansal was apprehended red-handed while accepting currency notes. "
            "The accused has no prior departmental complaints on record."
        ),
        "ground_truth": {
            "entities": [
                {"type": "CASE", "text": "15/2025"},
                {"type": "LOCATION", "text": "Jaipur"},
                {"type": "DATE", "text": "05 May 2025"},
                {"type": "PERSON", "text": "Hemant Joshi", "role": "COMPLAINANT"},
                {"type": "PERSON", "text": "Vijay Bansal", "role": "ACCUSED"},
                {"type": "MONETARY_AMOUNT", "text": "50,000"},
                {"type": "PERSON", "text": "Alok Sharma", "role": "OFFICER"},
            ],
            "relationships": [
                {"source": "Vijay Bansal", "target": "15/2025", "rel_type": "ACCUSED_IN"},
                {"source": "Hemant Joshi", "target": "15/2025", "rel_type": "REPORTED"},
            ],
            "forbidden_relationships": [
                {"source": "Hemant Joshi", "rel_type": "ACCUSED_IN"},
                {"source": "Alok Sharma", "rel_type": "ACCUSED_IN"},
            ],
            "negations": [
                {"sentence_contains": "has no prior", "is_negated": True}
            ]
        }
    },

    # ── FIR 10: Gold Smuggling & Hawala Courier ────────────────────────────────
    {
        "id": "FIR-2025-CUST-010",
        "title": "Customs Gold Seizure & Hawala Ring",
        "text": (
            "Case No. 82/2025 at IGI Airport Police Station dated 18 May 2025. "
            "Accused Farooq Mansoor arrived from Dubai carrying concealed gold bars worth Rs. 85,00,000. "
            "Farooq Mansoor phoned accomplice Salim Merchant on phone 9920114477. "
            "Salim Merchant is residing at Bandra, Mumbai. "
            "Farooq Mansoor denied meeting any hawala operative in terminal."
        ),
        "ground_truth": {
            "entities": [
                {"type": "CASE", "text": "82/2025"},
                {"type": "LOCATION", "text": "Dubai"},
                {"type": "DATE", "text": "18 May 2025"},
                {"type": "PERSON", "text": "Farooq Mansoor", "role": "ACCUSED"},
                {"type": "MONETARY_AMOUNT", "text": "85,00,000"},
                {"type": "PERSON", "text": "Salim Merchant", "role": "ACCUSED"},
                {"type": "PHONE", "text": "9920114477"},
                {"type": "LOCATION", "text": "Bandra"},
                {"type": "LOCATION", "text": "Mumbai"},
            ],
            "relationships": [
                {"source": "Farooq Mansoor", "target": "82/2025", "rel_type": "ACCUSED_IN"},
                {"source": "Farooq Mansoor", "target": "Salim Merchant", "rel_type": "CONTACTED"},
                {"source": "Salim Merchant", "target": "Bandra", "rel_type": "LOCATED_AT"},
            ],
            "forbidden_relationships": [
                {"source": "Farooq Mansoor", "target": "hawala", "rel_type": "KNOWS", "status": "CONFIRMED"},
            ],
            "negations": [
                {"sentence_contains": "denied meeting", "is_negated": True}
            ]
        }
    },

    # ── FIR 11: Domestic Violence & Matrimonial Harassment ─────────────────────
    {
        "id": "FIR-2025-MAT-011",
        "title": "Domestic Violence and Dowry Harassment",
        "text": (
            "FIR No. 94/2025 under Section 498A IPC at Women Police Station, Ludhiana on 02 June 2025. "
            "Complainant Simran Kaur lodged the complaint against her husband accused Manpreet Dhillon. "
            "Manpreet Dhillon demanded dowry amount of Rs. 10,00,000 and vehicle PB-10-CZ-7711. "
            "Simran Kaur did not agree to the illegal demands. "
            "Inspector Gurleen Chahal is the investigating officer."
        ),
        "ground_truth": {
            "entities": [
                {"type": "CASE", "text": "94/2025"},
                {"type": "CRIME_TYPE", "text": "498A"},
                {"type": "LOCATION", "text": "Ludhiana"},
                {"type": "DATE", "text": "02 June 2025"},
                {"type": "PERSON", "text": "Simran Kaur", "role": "COMPLAINANT"},
                {"type": "PERSON", "text": "Manpreet Dhillon", "role": "ACCUSED"},
                {"type": "MONETARY_AMOUNT", "text": "10,00,000"},
                {"type": "VEHICLE", "text": "PB-10-CZ-7711"},
                {"type": "PERSON", "text": "Gurleen Chahal", "role": "OFFICER"},
            ],
            "relationships": [
                {"source": "Manpreet Dhillon", "target": "94/2025", "rel_type": "ACCUSED_IN"},
                {"source": "Simran Kaur", "target": "94/2025", "rel_type": "REPORTED"},
            ],
            "forbidden_relationships": [
                {"source": "Simran Kaur", "rel_type": "ACCUSED_IN"},
                {"source": "Gurleen Chahal", "rel_type": "ACCUSED_IN"},
            ],
            "negations": [
                {"sentence_contains": "did not agree", "is_negated": True}
            ]
        }
    },

    # ── FIR 12: Night-time Housebreak & Burglary ───────────────────────────────
    {
        "id": "FIR-2025-BURG-012",
        "title": "Lurking House Trespass and Burglary",
        "text": (
            "FIR No. 177/2025 under Section 457 and Section 380 IPC at Vasant Kunj Police Station. "
            "Complainant Dr. Ramesh Nair reported that his residence was burgled on 15 June 2025. "
            "Jewelry and cash amounting to Rs. 4,50,000 were stolen. "
            "Security guard witness Ramu Yadav deposed that he saw suspect Monu driving motorcycle DL-9S-XY-1234. "
            "The lock was broken without key."
        ),
        "ground_truth": {
            "entities": [
                {"type": "CASE", "text": "177/2025"},
                {"type": "CRIME_TYPE", "text": "457"},
                {"type": "CRIME_TYPE", "text": "380"},
                {"type": "PERSON", "text": "Ramesh Nair", "role": "COMPLAINANT"},
                {"type": "DATE", "text": "15 June 2025"},
                {"type": "MONETARY_AMOUNT", "text": "4,50,000"},
                {"type": "PERSON", "text": "Ramu Yadav", "role": "WITNESS"},
                {"type": "PERSON", "text": "Monu", "role": "ACCUSED"},
                {"type": "VEHICLE", "text": "DL-9S-XY-1234"},
            ],
            "relationships": [
                {"source": "Ramesh Nair", "target": "177/2025", "rel_type": "REPORTED"},
                {"source": "Ramu Yadav", "target": "177/2025", "rel_type": "WITNESS_IN"},
                {"source": "Monu", "target": "DL-9S-XY-1234", "rel_type": "DRIVES"},
            ],
            "forbidden_relationships": [
                {"source": "Ramesh Nair", "rel_type": "ACCUSED_IN"},
                {"source": "Ramu Yadav", "rel_type": "ACCUSED_IN"},
            ],
            "negations": []
        }
    },

    # ── FIR 13: Gang Conspiracy & Arms Dealing ─────────────────────────────────
    {
        "id": "FIR-2025-GANG-013",
        "title": "Organized Gang Syndicate and Arms Act",
        "text": (
            "FIR No. 305/2025 at Crime Branch, Special Cell, Delhi on 29 June 2025. "
            "Gangster accused Jaggu Bhagwanpuria is associate of co-conspirator Lawrence Bishnoi. "
            "Informant tipped off that accused Jaggu dialed 9818822446 to coordinate illicit weapon supply. "
            "Jaggu Bhagwanpuria was previously booked in Case No. 44/2022. "
            "The suspects were not granted bail."
        ),
        "ground_truth": {
            "entities": [
                {"type": "CASE", "text": "305/2025"},
                {"type": "LOCATION", "text": "Delhi"},
                {"type": "DATE", "text": "29 June 2025"},
                {"type": "PERSON", "text": "Jaggu Bhagwanpuria", "role": "ACCUSED"},
                {"type": "PERSON", "text": "Lawrence Bishnoi", "role": "ACCUSED"},
                {"type": "PHONE", "text": "9818822446"},
                {"type": "CASE", "text": "44/2022"},
            ],
            "relationships": [
                {"source": "Jaggu Bhagwanpuria", "target": "305/2025", "rel_type": "ACCUSED_IN"},
                {"source": "Jaggu Bhagwanpuria", "target": "Lawrence Bishnoi", "rel_type": "KNOWS"},
            ],
            "forbidden_relationships": [],
            "negations": [
                {"sentence_contains": "were not granted", "is_negated": True}
            ]
        }
    },

    # ── FIR 14: Hit-and-Run Fatal Collision ────────────────────────────────────
    {
        "id": "FIR-2025-MVA-014",
        "title": "Hit and Run Fatal Motor Incident",
        "text": (
            "FIR No. 58/2025 under Section 279 and Section 304A IPC at Noida Sector 20 Police Station. "
            "On 08 July 2025, victim cyclist Santosh Mishra was fatally hit near Atta Market. "
            "Eyewitness Balwant Singh stated that he saw truck HR-55-AB-9876 speeding away. "
            "Driver accused Devendra Pal did not stop to help the injured. "
            "SI Rajendra Prasad registered the case."
        ),
        "ground_truth": {
            "entities": [
                {"type": "CASE", "text": "58/2025"},
                {"type": "CRIME_TYPE", "text": "279"},
                {"type": "CRIME_TYPE", "text": "304A"},
                {"type": "DATE", "text": "08 July 2025"},
                {"type": "PERSON", "text": "Santosh Mishra", "role": "VICTIM"},
                {"type": "LOCATION", "text": "Atta Market"},
                {"type": "PERSON", "text": "Balwant Singh", "role": "WITNESS"},
                {"type": "VEHICLE", "text": "HR-55-AB-9876"},
                {"type": "PERSON", "text": "Devendra Pal", "role": "ACCUSED"},
                {"type": "PERSON", "text": "Rajendra Prasad", "role": "OFFICER"},
            ],
            "relationships": [
                {"source": "Balwant Singh", "target": "58/2025", "rel_type": "WITNESS_IN"},
            ],
            "forbidden_relationships": [
                {"source": "Santosh Mishra", "rel_type": "ACCUSED_IN"},
                {"source": "Balwant Singh", "rel_type": "ACCUSED_IN"},
                {"source": "Rajendra Prasad", "rel_type": "ACCUSED_IN"},
            ],
            "negations": [
                {"sentence_contains": "did not stop", "is_negated": True}
            ]
        }
    },

    # ── FIR 15: Corporate Cyber Espionage ─────────────────────────────────────
    {
        "id": "FIR-2025-CYBER-015",
        "title": "Trade Secret Theft & Data Exfiltration",
        "text": (
            "FIR No. 222/2025 registered at Cyber Crime PS, Cyberabad on 20 July 2025. "
            "Complainant Rajiv Nambiar, Director at Tech Solutions, reported unauthorized data exfiltration. "
            "Accused former engineer Nikhil Reddy transferred confidential source code to external servers. "
            "Nikhil Reddy used phone number 9949011223 to communicate with rival competitor. "
            "Accused Nikhil Reddy denied downloading proprietary files."
        ),
        "ground_truth": {
            "entities": [
                {"type": "CASE", "text": "222/2025"},
                {"type": "LOCATION", "text": "Cyberabad"},
                {"type": "DATE", "text": "20 July 2025"},
                {"type": "PERSON", "text": "Rajiv Nambiar", "role": "COMPLAINANT"},
                {"type": "PERSON", "text": "Nikhil Reddy", "role": "ACCUSED"},
                {"type": "PHONE", "text": "9949011223"},
            ],
            "relationships": [
                {"source": "Nikhil Reddy", "target": "222/2025", "rel_type": "ACCUSED_IN"},
                {"source": "Rajiv Nambiar", "target": "222/2025", "rel_type": "REPORTED"},
            ],
            "forbidden_relationships": [
                {"source": "Rajiv Nambiar", "rel_type": "ACCUSED_IN"},
            ],
            "negations": [
                {"sentence_contains": "denied downloading", "is_negated": True}
            ]
        }
    }
]
