"""
SIH 2026: Dataset Seeder
Generates the 9 CSV files matching the WinRAR archive in the screenshot:
- people.csv
- phones.csv
- vehicles.csv
- transactions.csv
- relationships.csv
- locations.csv
- court_cases.csv
- cluster_summaries.csv
- master_case_match.csv
"""
import os
import csv

DATASET_DIR = os.path.join(os.path.dirname(__file__), "data", "dataset")
os.makedirs(DATASET_DIR, exist_ok=True)

# 1. people.csv
people = [
    {"person_id": "P001", "name": "Ravi Kumar", "aliases": "Ravan;Ravi K", "role": "Kingpin / Syndicate Leader", "age": "38", "address": "Sector 7, Rohini, New Delhi"},
    {"person_id": "P002", "name": "Vikram Singh", "aliases": "Vicky;Viper", "role": "Key Operative / Bridge Node", "age": "34", "address": "MG Road, Gurgaon, Haryana"},
    {"person_id": "P003", "name": "Meena Sharma", "aliases": "Meena S", "role": "Financial Handler / Money Launderer", "age": "31", "address": "Karol Bagh, New Delhi"},
    {"person_id": "P004", "name": "Aarav Mehta", "aliases": "AJ;Aarav M", "role": "Smuggling Coordinator", "age": "42", "address": "Bandra West, Mumbai, Maharashtra"},
    {"person_id": "P005", "name": "Suresh Yadav", "aliases": "Chota Suresh;S. Yadav", "role": "Enforcer / Arms Dealer", "age": "29", "address": "Gomti Nagar, Lucknow, UP"},
    {"person_id": "P006", "name": "Priya Nair", "aliases": "Priya N", "role": "Cyber Operative / Crypto Mule", "age": "27", "address": "Koramangala, Bengaluru, Karnataka"},
    {"person_id": "P007", "name": "Deepak Srivastava", "aliases": "Deepak S", "role": "Logistics Provider", "age": "45", "address": "Civil Lines, Prayagraj, UP"},
    {"person_id": "P008", "name": "Manish Tiwari", "aliases": "Manu", "role": "Vehicle Transporter", "age": "33", "address": "Kanpur, UP"},
    {"person_id": "P009", "name": "Sanjay Gupta", "aliases": "Sanju", "role": "Hawala Courier", "age": "39", "address": "Salt Lake, Kolkata, WB"},
    {"person_id": "P010", "name": "Rohit Patel", "aliases": "Rohit P", "role": "Safehouse Custodian", "age": "36", "address": "Ahmedabad, Gujarat"}
]
with open(os.path.join(DATASET_DIR, "people.csv"), "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=people[0].keys())
    writer.writeheader()
    writer.writerows(people)

# 2. phones.csv
phones = [
    {"id": "PH01", "person_name": "Ravi Kumar", "phone_number": "+91-98110-44501", "imei": "864201045920191", "isp": "Airtel"},
    {"id": "PH02", "person_name": "Ravi Kumar", "phone_number": "+91-98110-44502", "imei": "864201045920192", "isp": "Vodafone-Idea"},
    {"id": "PH03", "person_name": "Vikram Singh", "phone_number": "+91-98765-32100", "imei": "359871049281720", "isp": "Jio"},
    {"id": "PH04", "person_name": "Vikram Singh", "phone_number": "+91-98765-32101", "imei": "359871049281721", "isp": "Airtel"},
    {"id": "PH05", "person_name": "Meena Sharma", "phone_number": "+91-70011-12345", "imei": "990182736451029", "isp": "Airtel"},
    {"id": "PH06", "person_name": "Aarav Mehta", "phone_number": "+91-99300-67890", "imei": "860192837465019", "isp": "Jio"},
    {"id": "PH07", "person_name": "Suresh Yadav", "phone_number": "+91-94221-11111", "imei": "350192837461928", "isp": "BSNL"},
    {"id": "PH08", "person_name": "Priya Nair", "phone_number": "+91-81111-55555", "imei": "869102938475610", "isp": "Airtel"}
]
with open(os.path.join(DATASET_DIR, "phones.csv"), "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=phones[0].keys())
    writer.writeheader()
    writer.writerows(phones)

# 3. vehicles.csv
vehicles = [
    {"id": "V01", "owner": "Ravi Kumar", "reg_number": "DL01AB1234", "model": "Hyundai Creta Black", "color": "Phantom Black"},
    {"id": "V02", "owner": "Vikram Singh", "reg_number": "HR26DQ5544", "model": "Toyota Fortuner White", "color": "Pearl White"},
    {"id": "V03", "owner": "Aarav Mehta", "reg_number": "MH02EZ9081", "model": "Mahindra Scorpio-N", "color": "Deep Forest"},
    {"id": "V04", "owner": "Suresh Yadav", "reg_number": "UP32XY4411", "model": "Mahindra Bolero", "color": "Silver"},
    {"id": "V05", "owner": "Manish Tiwari", "reg_number": "UP78KL7722", "model": "Tata Nexon", "color": "Daytona Grey"}
]
with open(os.path.join(DATASET_DIR, "vehicles.csv"), "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=vehicles[0].keys())
    writer.writeheader()
    writer.writerows(vehicles)

# 4. transactions.csv
transactions = [
    {"id": "TX001", "sender": "Ravi Kumar", "receiver": "Meena Sharma", "amount": "45,00,000", "date": "2025-01-15"},
    {"id": "TX002", "sender": "Meena Sharma", "receiver": "Aarav Mehta", "amount": "28,50,000", "date": "2025-01-20"},
    {"id": "TX003", "sender": "Vikram Singh", "receiver": "Suresh Yadav", "amount": "12,00,000", "date": "2025-02-02"},
    {"id": "TX004", "sender": "Aarav Mehta", "receiver": "Priya Nair", "amount": "18,00,000", "date": "2025-02-10"},
    {"id": "TX005", "sender": "Deepak Srivastava", "receiver": "Manish Tiwari", "amount": "7,50,000", "date": "2025-02-18"}
]
with open(os.path.join(DATASET_DIR, "transactions.csv"), "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=transactions[0].keys())
    writer.writeheader()
    writer.writerows(transactions)

# 5. relationships.csv
relationships = [
    {"source": "Ravi Kumar", "target": "Vikram Singh", "relationship": "CO_CONSPIRATOR", "confidence": "0.96"},
    {"source": "Ravi Kumar", "target": "Meena Sharma", "relationship": "FINANCIAL_HANDLER", "confidence": "0.94"},
    {"source": "Vikram Singh", "target": "Suresh Yadav", "relationship": "ARMS_SUPPLIER", "confidence": "0.92"},
    {"source": "Vikram Singh", "target": "Aarav Mehta", "relationship": "INTERSTATE_COORDINATOR", "confidence": "0.95"},
    {"source": "Aarav Mehta", "target": "Priya Nair", "relationship": "CRYPTO_MULE", "confidence": "0.89"},
    {"source": "Ravi Kumar", "target": "Deepak Srivastava", "relationship": "LOGISTICS_SUPPORTER", "confidence": "0.91"},
    {"source": "Deepak Srivastava", "target": "Manish Tiwari", "relationship": "GETAWAY_DRIVER", "confidence": "0.93"},
    {"source": "Suresh Yadav", "target": "Manish Tiwari", "relationship": "CO_ACCUSED", "confidence": "0.90"},
    {"source": "Aarav Mehta", "target": "Rohit Patel", "relationship": "SAFEHOUSE_HANDLER", "confidence": "0.88"},
    {"source": "Meena Sharma", "target": "Sanjay Gupta", "relationship": "HAWALA_OPERATOR", "confidence": "0.95"}
]
with open(os.path.join(DATASET_DIR, "relationships.csv"), "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=relationships[0].keys())
    writer.writeheader()
    writer.writerows(relationships)

# 6. locations.csv
locations = [
    {"id": "L01", "location_name": "Rohini Sector 7", "city": "New Delhi", "state": "Delhi"},
    {"id": "L02", "location_name": "MG Road", "city": "Gurgaon", "state": "Haryana"},
    {"id": "L03", "location_name": "Karol Bagh", "city": "New Delhi", "state": "Delhi"},
    {"id": "L04", "location_name": "Bandra West", "city": "Mumbai", "state": "Maharashtra"},
    {"id": "L05", "location_name": "Gomti Nagar", "city": "Lucknow", "state": "Uttar Pradesh"},
    {"id": "L06", "location_name": "Koramangala", "city": "Bengaluru", "state": "Karnataka"}
]
with open(os.path.join(DATASET_DIR, "locations.csv"), "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=locations[0].keys())
    writer.writeheader()
    writer.writerows(locations)

# 7. court_cases.csv
court_cases = [
    {"case_id": "CC-2024-901", "person_name": "Ravi Kumar", "ipc_sections": "302, 307, 120B IPC", "court_name": "Rohini District Court", "status": "Chargesheet Filed"},
    {"case_id": "CC-2024-412", "person_name": "Vikram Singh", "ipc_sections": "379, 411 IPC, Arms Act 25", "court_name": "Gurugram Sessions Court", "status": "Under Trial"},
    {"case_id": "CC-2025-104", "person_name": "Meena Sharma", "ipc_sections": "420, 467, 471 IPC", "court_name": "Patiala House Courts", "status": "Bail Granted with Conditions"},
    {"case_id": "CC-2024-789", "person_name": "Suresh Yadav", "ipc_sections": "Arms Act 25/54/59", "court_name": "Lucknow High Court Bench", "status": "Non-Bailable Warrant Issued"}
]
with open(os.path.join(DATASET_DIR, "court_cases.csv"), "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=court_cases[0].keys())
    writer.writeheader()
    writer.writerows(court_cases)

# 8. cluster_summaries.csv
cluster_summaries = [
    {"cluster_id": "SYN-001", "gang_name": "Viper Syndicate", "threat_level": "CRITICAL", "summary": "Interstate syndicate spanning Delhi, Haryana and UP involved in armed extortion, hawala laundering, and illegal firearm distribution."},
    {"cluster_id": "SYN-002", "gang_name": "Apex Logistics Front", "threat_level": "HIGH", "summary": "Commercial front company used for moving illicit contraband between Northern and Western corridors."},
    {"cluster_id": "SYN-003", "gang_name": "Crypto Hawala Cell", "threat_level": "SEVERE", "summary": "Decentralized money laundering ring converting extortion funds into cryptocurrency."}
]
with open(os.path.join(DATASET_DIR, "cluster_summaries.csv"), "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=cluster_summaries[0].keys())
    writer.writeheader()
    writer.writerows(cluster_summaries)

# 9. master_case_match.csv
case_matches = [
    {"case_1": "FIR-2025-ND-101", "case_2": "FIR-2025-ND-104", "match_score": "0.94", "common_entities": "Ravi Kumar;DL01AB1234;+91-98110-44501"},
    {"case_1": "FIR-2025-ND-102", "case_2": "FIR-2025-HR-203", "match_score": "0.89", "common_entities": "Vikram Singh;+91-98765-32100"},
    {"case_1": "FIR-2025-ND-101", "case_2": "FIR-2025-UP-505", "match_score": "0.82", "common_entities": "Meena Sharma;Suresh Yadav"}
]
with open(os.path.join(DATASET_DIR, "master_case_match.csv"), "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=case_matches[0].keys())
    writer.writeheader()
    writer.writerows(case_matches)

print("All 9 SIH Investigation dataset CSVs generated successfully!")
