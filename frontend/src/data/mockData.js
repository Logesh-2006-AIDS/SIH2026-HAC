/**
 * SIH26189 — Centralized Mock Investigation Dataset
 * All entities, relationships, and evidence are internally consistent.
 * Ravi Kumar (PERSON-001), Phone-001, and Account-204 appear across all 3 cases.
 */

// ─── PERSONS ────────────────────────────────────────────────────────────────
export const PERSONS = [
  {
    id: 'PERSON-001', name: 'Ravi Kumar', alias: 'Ravi K.', role: 'Primary Suspect',
    age: 38, occupation: 'Shipping Agent', phone: 'PHONE-001',
    cases: ['CASE-101', 'CASE-102', 'CASE-103'],
    accounts: ['ACC-001'], organizations: ['ORG-001'],
    address: 'Chennai Port Area, Tamil Nadu',
    confidence: 0.97, type: 'Person',
    fir_mentions: ['CASE-101', 'CASE-102', 'CASE-103'],
    cdr_mentions: ['CASE-101', 'CASE-102'],
    financial_mentions: ['CASE-101', 'CASE-102'],
  },
  {
    id: 'PERSON-002', name: 'Arun Selvam', alias: 'A. Selvam', role: 'Associate',
    age: 34, occupation: 'Hawala Operator', phone: 'PHONE-002',
    cases: ['CASE-101', 'CASE-102'],
    accounts: ['ACC-002'], organizations: ['ORG-002'],
    address: 'T. Nagar, Chennai, Tamil Nadu',
    confidence: 0.94, type: 'Person',
    fir_mentions: ['CASE-101'],
    cdr_mentions: ['CASE-101', 'CASE-102'],
    financial_mentions: ['CASE-102'],
  },
  {
    id: 'PERSON-003', name: 'Meena Krishnan', alias: 'Meena K.', role: 'Courier',
    age: 29, occupation: 'Logistics Coordinator', phone: 'PHONE-003',
    cases: ['CASE-102', 'CASE-103'],
    accounts: ['ACC-003'], organizations: ['ORG-003'],
    address: 'Trichy Road, Coimbatore, Tamil Nadu',
    confidence: 0.91, type: 'Person',
    fir_mentions: ['CASE-103'],
    cdr_mentions: ['CASE-102', 'CASE-103'],
    financial_mentions: ['CASE-102'],
  },
  {
    id: 'PERSON-004', name: 'Vikram Nair', alias: 'V. Nair', role: 'Driver / Courier',
    age: 42, occupation: 'Transport Operator', phone: 'PHONE-004',
    cases: ['CASE-101', 'CASE-103'],
    accounts: [], organizations: [],
    address: 'Koyambedu, Chennai, Tamil Nadu',
    confidence: 0.88, type: 'Person',
    fir_mentions: ['CASE-101'],
    cdr_mentions: ['CASE-103'],
    financial_mentions: [],
  },
  {
    id: 'PERSON-005', name: 'Suresh Babu', alias: 'S. Babu', role: 'Financier',
    age: 52, occupation: 'Businessman', phone: 'PHONE-005',
    cases: ['CASE-102'],
    accounts: ['ACC-004'], organizations: ['ORG-002'],
    address: 'Anna Nagar, Chennai, Tamil Nadu',
    confidence: 0.86, type: 'Person',
    fir_mentions: [],
    cdr_mentions: ['CASE-102'],
    financial_mentions: ['CASE-102'],
  },
  {
    id: 'PERSON-006', name: 'Priya Ramesh', alias: 'P. Ramesh', role: 'Front Person',
    age: 31, occupation: 'Shop Owner', phone: 'PHONE-006',
    cases: ['CASE-103'],
    accounts: ['ACC-005'], organizations: ['ORG-004'],
    address: 'Madurai Main Road, Tamil Nadu',
    confidence: 0.83, type: 'Person',
    fir_mentions: ['CASE-103'],
    cdr_mentions: ['CASE-103'],
    financial_mentions: [],
  },
  {
    id: 'PERSON-007', name: 'Dinesh Rao', alias: 'D. Rao', role: 'Middleman',
    age: 45, occupation: 'Import/Export Dealer', phone: 'PHONE-001',
    cases: ['CASE-101'],
    accounts: [], organizations: ['ORG-001'],
    address: 'Tuticorin Port, Tamil Nadu',
    confidence: 0.79, type: 'Person',
    fir_mentions: ['CASE-101'],
    cdr_mentions: ['CASE-101'],
    financial_mentions: [],
  },
  {
    id: 'PERSON-008', name: 'Kavitha Murugan', alias: 'K. Murugan', role: 'Intelligence Source',
    age: 36, occupation: 'Customs Official (Under Investigation)', phone: 'PHONE-003',
    cases: ['CASE-101', 'CASE-103'],
    accounts: [], organizations: [],
    address: 'Chennai Customs Office, Tamil Nadu',
    confidence: 0.76, type: 'Person',
    fir_mentions: [],
    cdr_mentions: ['CASE-101', 'CASE-103'],
    financial_mentions: [],
  },
];

// ─── PHONES ─────────────────────────────────────────────────────────────────
export const PHONES = [
  { id: 'PHONE-001', number: '+91-9876543210', owner: 'PERSON-001', cases: ['CASE-101', 'CASE-102', 'CASE-103'], imei: '354875091234567', carrier: 'Airtel', type: 'Phone' },
  { id: 'PHONE-002', number: '+91-9123456780', owner: 'PERSON-002', cases: ['CASE-101', 'CASE-102'], imei: '356872041234568', carrier: 'Jio', type: 'Phone' },
  { id: 'PHONE-003', number: '+91-9988776655', owner: 'PERSON-003', cases: ['CASE-102', 'CASE-103'], imei: '353456091234560', carrier: 'BSNL', type: 'Phone' },
  { id: 'PHONE-004', number: '+91-9345678901', owner: 'PERSON-004', cases: ['CASE-101', 'CASE-103'], imei: '354756091234569', carrier: 'Vodafone', type: 'Phone' },
  { id: 'PHONE-005', number: '+91-9845671234', owner: 'PERSON-005', cases: ['CASE-102'], imei: '356745091234561', carrier: 'Airtel', type: 'Phone' },
  { id: 'PHONE-006', number: '+91-9234567891', owner: 'PERSON-006', cases: ['CASE-103'], imei: '353890091234562', carrier: 'Jio', type: 'Phone' },
];

// ─── ORGANIZATIONS ──────────────────────────────────────────────────────────
export const ORGANIZATIONS = [
  { id: 'ORG-001', name: 'Chennai Coastal Exports Pvt. Ltd', type: 'Front Company', cases: ['CASE-101', 'CASE-102'], gst: 'GSTIN33AABCC1234D1ZX', address: 'Chennai Port Area, TN', confidence: 0.93, entityType: 'Organization' },
  { id: 'ORG-002', name: 'Southern Hawala Exchange', type: 'Hawala Network', cases: ['CASE-102'], gst: 'GSTIN33AACDE5678F1ZY', address: 'T. Nagar, Chennai, TN', confidence: 0.96, entityType: 'Organization' },
  { id: 'ORG-003', name: 'Inland Cargo Services', type: 'Logistics', cases: ['CASE-103'], gst: 'GSTIN33AAFGH9012G1ZZ', address: 'Coimbatore Industrial Area, TN', confidence: 0.88, entityType: 'Organization' },
  { id: 'ORG-004', name: 'Madurai Trading Syndicate', type: 'Shell Company', cases: ['CASE-103'], gst: 'GSTIN33AAIJK3456H1ZA', address: 'Madurai, TN', confidence: 0.85, entityType: 'Organization' },
];

// ─── FINANCIAL ACCOUNTS ─────────────────────────────────────────────────────
export const ACCOUNTS = [
  { id: 'ACC-001', account_number: 'Account-204', owner: 'PERSON-001', bank: 'State Bank of India', balance: 2340000, cases: ['CASE-101', 'CASE-102'], type: 'FinancialAccount' },
  { id: 'ACC-002', account_number: 'Account-319', owner: 'PERSON-002', bank: 'HDFC Bank', balance: 1850000, cases: ['CASE-102'], type: 'FinancialAccount' },
  { id: 'ACC-003', account_number: 'Account-457', owner: 'PERSON-003', bank: 'Axis Bank', balance: 780000, cases: ['CASE-102', 'CASE-103'], type: 'FinancialAccount' },
  { id: 'ACC-004', account_number: 'Account-512', owner: 'PERSON-005', bank: 'ICICI Bank', balance: 4500000, cases: ['CASE-102'], type: 'FinancialAccount' },
  { id: 'ACC-005', account_number: 'Account-683', owner: 'PERSON-006', bank: 'Punjab National Bank', balance: 340000, cases: ['CASE-103'], type: 'FinancialAccount' },
];

// ─── VEHICLES ───────────────────────────────────────────────────────────────
export const VEHICLES = [
  { id: 'VEH-001', reg_number: 'TN-09-BX-4532', type: 'Container Truck', owner: 'PERSON-007', cases: ['CASE-101'], entityType: 'Vehicle' },
  { id: 'VEH-002', reg_number: 'TN-38-AC-7721', type: 'SUV', owner: 'PERSON-004', cases: ['CASE-101', 'CASE-103'], entityType: 'Vehicle' },
  { id: 'VEH-003', reg_number: 'TN-58-KL-1190', type: 'Minivan', owner: 'PERSON-006', cases: ['CASE-103'], entityType: 'Vehicle' },
];

// ─── LOCATIONS ──────────────────────────────────────────────────────────────
export const LOCATIONS = [
  { id: 'LOC-001', name: 'Chennai Port Area', lat: 13.0827, lon: 80.2707, type: 'Port', cases: ['CASE-101', 'CASE-102'], crime_count: 12, crime_types: ['Drug Trafficking', 'Hawala'], entityType: 'Location' },
  { id: 'LOC-002', name: 'T. Nagar, Chennai', lat: 13.0418, lon: 80.2341, type: 'Residential/Commercial', cases: ['CASE-102'], crime_count: 5, crime_types: ['Hawala Money Laundering'], entityType: 'Location' },
  { id: 'LOC-003', name: 'Tuticorin Port', lat: 8.7642, lon: 78.1348, type: 'Port', cases: ['CASE-101', 'CASE-103'], crime_count: 8, crime_types: ['Drug Trafficking', 'Arms Smuggling'], entityType: 'Location' },
  { id: 'LOC-004', name: 'Madurai District', lat: 9.9252, lon: 78.1198, type: 'District', cases: ['CASE-103'], crime_count: 6, crime_types: ['Arms Smuggling'], entityType: 'Location' },
];

// ─── RELATIONSHIPS / EDGES ──────────────────────────────────────────────────
export const RELATIONSHIPS = [
  // Ravi Kumar ↔ Phone
  { id: 'REL-001', source: 'PERSON-001', target: 'PHONE-001', type: 'USES', case_refs: ['CASE-101', 'CASE-102', 'CASE-103'], confidence: 0.99, evidence: 'CDR records show PHONE-001 registered to Ravi Kumar', source_doc: 'CDR-CASE-101' },
  // Phone ↔ Phone (communication)
  { id: 'REL-002', source: 'PHONE-001', target: 'PHONE-002', type: 'COMMUNICATES_WITH', case_refs: ['CASE-101', 'CASE-102'], confidence: 0.97, evidence: '38 calls detected in 6-hour window before CASE-101 incident', source_doc: 'CDR-CASE-101', call_count: 38, duration_hrs: 6 },
  { id: 'REL-003', source: 'PHONE-001', target: 'PHONE-003', type: 'COMMUNICATES_WITH', case_refs: ['CASE-102', 'CASE-103'], confidence: 0.91, evidence: '14 calls between PHONE-001 and PHONE-003 across 2 cases', source_doc: 'CDR-CASE-102', call_count: 14, duration_hrs: 3 },
  { id: 'REL-004', source: 'PHONE-001', target: 'PHONE-004', type: 'COMMUNICATES_WITH', case_refs: ['CASE-101', 'CASE-103'], confidence: 0.88, evidence: 'Coordinated calls around incident times', source_doc: 'CDR-CASE-103', call_count: 9, duration_hrs: 2 },
  // Arun Selvam ↔ Phone
  { id: 'REL-005', source: 'PERSON-002', target: 'PHONE-002', type: 'USES', case_refs: ['CASE-101', 'CASE-102'], confidence: 0.96, evidence: 'Phone registered to Arun Selvam — confirmed via subscriber records', source_doc: 'CDR-CASE-102' },
  // Arun Selvam ↔ Account-319
  { id: 'REL-006', source: 'PERSON-002', target: 'ACC-002', type: 'OWNS', case_refs: ['CASE-102'], confidence: 0.98, evidence: 'Bank KYC documents confirm ownership', source_doc: 'FIN-CASE-102' },
  // Ravi Kumar ↔ Account-204
  { id: 'REL-007', source: 'PERSON-001', target: 'ACC-001', type: 'OWNS', case_refs: ['CASE-101', 'CASE-102'], confidence: 0.97, evidence: 'SBI KYC records link Account-204 to Ravi Kumar', source_doc: 'FIN-CASE-101' },
  // Account-204 → Account-319 (suspicious transfer)
  { id: 'REL-008', source: 'ACC-001', target: 'ACC-002', type: 'TRANSFERRED_TO', case_refs: ['CASE-101', 'CASE-102'], confidence: 0.95, evidence: '₹8,50,000 transferred from Account-204 to Account-319 on 2026-03-14, 2 days before CASE-101 incident', source_doc: 'FIN-CASE-101', amount: 850000 },
  // Account-319 → Account-457 (multi-hop)
  { id: 'REL-009', source: 'ACC-002', target: 'ACC-003', type: 'TRANSFERRED_TO', case_refs: ['CASE-102'], confidence: 0.89, evidence: '₹4,20,000 layered transfer to Account-457 to obscure funds', source_doc: 'FIN-CASE-102', amount: 420000 },
  // Account-512 → Account-319 (financier funding)
  { id: 'REL-010', source: 'ACC-004', target: 'ACC-002', type: 'TRANSFERRED_TO', case_refs: ['CASE-102'], confidence: 0.92, evidence: '₹12,00,000 from Suresh Babu account to Arun Selvam account', source_doc: 'FIN-CASE-102', amount: 1200000 },
  // Ravi Kumar ↔ Organization
  { id: 'REL-011', source: 'PERSON-001', target: 'ORG-001', type: 'ASSOCIATED_WITH', case_refs: ['CASE-101', 'CASE-102'], confidence: 0.94, evidence: 'Listed as Director in Chennai Coastal Exports Pvt. Ltd MCA filings', source_doc: 'FIR-CASE-101' },
  // Arun Selvam ↔ Hawala org
  { id: 'REL-012', source: 'PERSON-002', target: 'ORG-002', type: 'ASSOCIATED_WITH', case_refs: ['CASE-102'], confidence: 0.96, evidence: 'Intelligence report confirms Arun as primary operator of Southern Hawala Exchange', source_doc: 'INT-CASE-102' },
  // Meena Krishnan
  { id: 'REL-013', source: 'PERSON-003', target: 'PHONE-003', type: 'USES', case_refs: ['CASE-102', 'CASE-103'], confidence: 0.93, evidence: 'PHONE-003 registered to Meena Krishnan', source_doc: 'CDR-CASE-103' },
  { id: 'REL-014', source: 'PERSON-003', target: 'ACC-003', type: 'OWNS', case_refs: ['CASE-102', 'CASE-103'], confidence: 0.94, evidence: 'Axis Bank KYC confirms ownership of Account-457', source_doc: 'FIN-CASE-102' },
  { id: 'REL-015', source: 'PERSON-003', target: 'ORG-003', type: 'ASSOCIATED_WITH', case_refs: ['CASE-103'], confidence: 0.87, evidence: 'Employment records link Meena to Inland Cargo Services', source_doc: 'FIR-CASE-103' },
  // Organization ↔ Case involvement
  { id: 'REL-016', source: 'ORG-001', target: 'LOC-001', type: 'LOCATED_AT', case_refs: ['CASE-101', 'CASE-102'], confidence: 0.99, evidence: 'Registered office at Chennai Port Area', source_doc: 'FIR-CASE-101' },
  { id: 'REL-017', source: 'PERSON-007', target: 'VEH-001', type: 'OWNS', case_refs: ['CASE-101'], confidence: 0.91, evidence: 'Vehicle registration records confirm Dinesh Rao as owner of TN-09-BX-4532', source_doc: 'FIR-CASE-101' },
  // Vikram Nair ↔ Vehicle
  { id: 'REL-018', source: 'PERSON-004', target: 'VEH-002', type: 'OWNS', case_refs: ['CASE-101', 'CASE-103'], confidence: 0.88, evidence: 'SUV detected at both incident locations via CCTV', source_doc: 'FIR-CASE-103' },
  // Location associations
  { id: 'REL-019', source: 'PERSON-001', target: 'LOC-001', type: 'LOCATED_AT', case_refs: ['CASE-101', 'CASE-102'], confidence: 0.90, evidence: 'CCTV footage places Ravi Kumar at Chennai Port Area on incident dates', source_doc: 'FIR-CASE-101' },
  { id: 'REL-020', source: 'PERSON-004', target: 'LOC-003', type: 'LOCATED_AT', case_refs: ['CASE-101', 'CASE-103'], confidence: 0.86, evidence: 'Vehicle GPS data and toll records confirm presence at Tuticorin Port', source_doc: 'FIR-CASE-103' },
  // Priya Ramesh ↔ CASE-103
  { id: 'REL-021', source: 'PERSON-006', target: 'ORG-004', type: 'ASSOCIATED_WITH', case_refs: ['CASE-103'], confidence: 0.84, evidence: 'Listed as proprietor of Madurai Trading Syndicate', source_doc: 'FIR-CASE-103' },
  { id: 'REL-022', source: 'PERSON-006', target: 'VEH-003', type: 'OWNS', case_refs: ['CASE-103'], confidence: 0.85, evidence: 'Vehicle registration records', source_doc: 'FIR-CASE-103' },
  { id: 'REL-023', source: 'PERSON-006', target: 'LOC-004', type: 'LOCATED_AT', case_refs: ['CASE-103'], confidence: 0.87, evidence: 'Multiple sightings confirmed by local intelligence', source_doc: 'INT-CASE-103' },
  // Cross-case bridge: PHONE-001 in CASE-103
  { id: 'REL-024', source: 'PHONE-001', target: 'PHONE-006', type: 'COMMUNICATES_WITH', case_refs: ['CASE-103'], confidence: 0.82, evidence: 'PHONE-001 called PHONE-006 (Priya Ramesh) 6 times 4 hours before CASE-103 incident', source_doc: 'CDR-CASE-103', call_count: 6, duration_hrs: 1 },
  // Suresh Babu ↔ CASE-102
  { id: 'REL-025', source: 'PERSON-005', target: 'ORG-002', type: 'ASSOCIATED_WITH', case_refs: ['CASE-102'], confidence: 0.90, evidence: 'Intelligence source confirms Suresh Babu as financier of Southern Hawala Exchange', source_doc: 'INT-CASE-102' },
  // Meena ↔ Ravi (cross-case bridge through CASE-103)
  { id: 'REL-026', source: 'PERSON-001', target: 'PERSON-003', type: 'ASSOCIATED_WITH', case_refs: ['CASE-103'], confidence: 0.79, evidence: 'CDR analysis and intelligence brief confirm coordination between Ravi Kumar and Meena Krishnan in CASE-103', source_doc: 'INT-CASE-103' },
  // Kavitha Murugan — intelligence source bridging cases
  { id: 'REL-027', source: 'PERSON-008', target: 'LOC-001', type: 'LOCATED_AT', case_refs: ['CASE-101'], confidence: 0.85, evidence: 'Customs official identified at Chennai Port during CASE-101 seizure window', source_doc: 'INT-CASE-101' },
];

// ─── CASES ───────────────────────────────────────────────────────────────────
export const CASES = [
  {
    case_number: '101',
    title: 'Operation Coastal Wind (CASE-101)',
    crime_category: 'Drug Trafficking',
    status: 'ACTIVE',
    jurisdiction: 'Chennai Port Area, Tamil Nadu',
    incident_date: '2026-03-16',
    summary: 'Intelligence-led operation targeting a cross-border drug trafficking network operating through Chennai and Tuticorin ports. Primary suspect Ravi Kumar coordinated shipments via front company Chennai Coastal Exports Pvt. Ltd. CDR analysis revealed 38 calls in a 6-hour window before the incident. Financial records show ₹8,50,000 transferred from Account-204 to Account-319 two days prior.',
    accused: ['Ravi Kumar', 'Arun Selvam', 'Vikram Nair', 'Dinesh Rao'],
    entities: ['PERSON-001', 'PERSON-002', 'PERSON-004', 'PERSON-007', 'PERSON-008', 'PHONE-001', 'PHONE-002', 'PHONE-004', 'ORG-001', 'ACC-001', 'ACC-002', 'VEH-001', 'VEH-002', 'LOC-001', 'LOC-003'],
  },
  {
    case_number: '102',
    title: 'Operation Black Ledger (CASE-102)',
    crime_category: 'Hawala Money Laundering',
    status: 'ACTIVE',
    jurisdiction: 'T. Nagar, Chennai, Tamil Nadu',
    incident_date: '2026-04-08',
    summary: 'Investigation into a sophisticated hawala money laundering network with links to CASE-101. Ravi Kumar\'s account (Account-204) was used as a layering vehicle. Funds moved through Account-204 → Account-319 → Account-457, with Suresh Babu as primary financier. Southern Hawala Exchange operated by Arun Selvam was the key node. PHONE-001 appears in CDR data for this case, linking Ravi Kumar directly.',
    accused: ['Arun Selvam', 'Suresh Babu', 'Meena Krishnan', 'Ravi Kumar'],
    entities: ['PERSON-001', 'PERSON-002', 'PERSON-003', 'PERSON-005', 'PHONE-001', 'PHONE-002', 'PHONE-003', 'PHONE-005', 'ORG-002', 'ACC-001', 'ACC-002', 'ACC-003', 'ACC-004', 'LOC-001', 'LOC-002'],
  },
  {
    case_number: '103',
    title: 'Operation Irongate (CASE-103)',
    crime_category: 'Arms Smuggling',
    status: 'UNDER_REVIEW',
    jurisdiction: 'Tuticorin Port & Madurai District, Tamil Nadu',
    incident_date: '2026-05-22',
    summary: 'Emerging case with confirmed links to CASE-101 network. Ravi Kumar\'s phone (PHONE-001) contacted Priya Ramesh (PHONE-006) 6 times in the 4 hours before the incident — a significant temporal proximity alert. Meena Krishnan coordinated logistics through Inland Cargo Services. Vehicle TN-38-AC-7721 (Vikram Nair) was detected at both Tuticorin Port and Madurai. Ravi Kumar confirmed as cross-case bridge through CDR and intelligence sources.',
    accused: ['Meena Krishnan', 'Priya Ramesh', 'Vikram Nair', 'Ravi Kumar'],
    entities: ['PERSON-001', 'PERSON-003', 'PERSON-004', 'PERSON-006', 'PERSON-008', 'PHONE-001', 'PHONE-003', 'PHONE-004', 'PHONE-006', 'ORG-003', 'ORG-004', 'ACC-003', 'ACC-005', 'VEH-002', 'VEH-003', 'LOC-003', 'LOC-004'],
  },
];

// ─── TIMELINE EVENTS ────────────────────────────────────────────────────────
export const TIMELINE_EVENTS = {
  '101': [
    { id: 'TL-101-1', date: '2026-03-10T09:30:00', title: 'Intelligence Alert Received', description: 'Narcotics Control Bureau receives tip-off about suspicious shipping containers from Chennai Port.', event_type: 'INTELLIGENCE', entity_ref: 'ORG-001', evidence_source: 'INT-CASE-101', confidence: 0.88 },
    { id: 'TL-101-2', date: '2026-03-12T11:15:00', title: 'CDR Surveillance Initiated', description: 'PHONE-001 (+91-9876543210) placed under CDR surveillance. First cross-communication with PHONE-002 detected.', event_type: 'CDR', entity_ref: 'PHONE-001', evidence_source: 'CDR-CASE-101', confidence: 0.95 },
    { id: 'TL-101-3', date: '2026-03-14T14:20:00', title: 'Suspicious Financial Transfer', description: '₹8,50,000 transferred from Account-204 (Ravi Kumar) to Account-319 (Arun Selvam).', event_type: 'FINANCIAL', entity_ref: 'ACC-001', evidence_source: 'FIN-CASE-101', confidence: 0.97 },
    { id: 'TL-101-4', date: '2026-03-15T08:45:00', title: 'Vehicle Detected at Port', description: 'Container truck TN-09-BX-4532 (Dinesh Rao) entered Chennai Port loading zone. Ravi Kumar present.', event_type: 'SURVEILLANCE', entity_ref: 'VEH-001', evidence_source: 'FIR-CASE-101', confidence: 0.92 },
    { id: 'TL-101-5', date: '2026-03-15T22:10:00', title: 'High-Frequency Call Burst', description: '38 calls between PHONE-001 and PHONE-002 in 6-hour window — coordinating the operation.', event_type: 'CDR', entity_ref: 'PHONE-001', evidence_source: 'CDR-CASE-101', confidence: 0.99 },
    { id: 'TL-101-6', date: '2026-03-16T02:30:00', title: 'Container Inspection Flagged', description: 'Customs inspection flags container for narcotics screening. Kavitha Murugan (Customs) on duty.', event_type: 'CASE', entity_ref: 'LOC-001', evidence_source: 'FIR-CASE-101', confidence: 0.94 },
    { id: 'TL-101-7', date: '2026-03-16T04:15:00', title: 'Seizure — 12kg Contraband', description: 'NCB seizes 12 kg of narcotics concealed in shipping container. Incident registered as CASE-101.', event_type: 'CASE', entity_ref: 'LOC-001', evidence_source: 'FIR-CASE-101', confidence: 1.0 },
    { id: 'TL-101-8', date: '2026-03-16T06:00:00', title: 'Ravi Kumar Identified', description: 'NLP extraction from FIR identifies Ravi Kumar as primary suspect. Linked to Chennai Coastal Exports.', event_type: 'NLP', entity_ref: 'PERSON-001', evidence_source: 'FIR-CASE-101', confidence: 0.97 },
    { id: 'TL-101-9', date: '2026-03-17T10:00:00', title: 'Graph Entity Resolution', description: 'AI system resolves "Ravi Kumar", "R. Kumar", "Ravi K." to PERSON-001. Cross-case link to CASE-102 detected.', event_type: 'AI', entity_ref: 'PERSON-001', evidence_source: 'AI-ANALYSIS', confidence: 0.96 },
    { id: 'TL-101-10', date: '2026-03-18T15:30:00', title: 'Cross-Case Pattern Detected', description: 'PHONE-001 also appears in CDR data from CASE-102. Escalated for cross-case analysis.', event_type: 'AI', entity_ref: 'PHONE-001', evidence_source: 'AI-ANALYSIS', confidence: 0.93 },
  ],
  '102': [
    { id: 'TL-102-1', date: '2026-04-01T09:00:00', title: 'Bank Suspicious Activity Report', description: 'HDFC Bank files SAR for unusual transactions through Account-319 (Arun Selvam).', event_type: 'FINANCIAL', entity_ref: 'ACC-002', evidence_source: 'FIN-CASE-102', confidence: 0.91 },
    { id: 'TL-102-2', date: '2026-04-02T11:30:00', title: 'Account-204 Flagged', description: 'Account-204 (Ravi Kumar, SBI) flagged for prior transfer to Account-319. Cross-case link to CASE-101 established.', event_type: 'FINANCIAL', entity_ref: 'ACC-001', evidence_source: 'FIN-CASE-102', confidence: 0.95 },
    { id: 'TL-102-3', date: '2026-04-03T14:00:00', title: 'PHONE-001 CDR Reappears', description: 'PHONE-001 (Ravi Kumar) appears in CDR records for CASE-102 — confirmed cross-case bridge entity.', event_type: 'CDR', entity_ref: 'PHONE-001', evidence_source: 'CDR-CASE-102', confidence: 0.96 },
    { id: 'TL-102-4', date: '2026-04-04T16:20:00', title: 'Multi-Hop Transfer Detected', description: 'Account-512 (Suresh Babu) → Account-319 → Account-457 layering scheme identified.', event_type: 'FINANCIAL', entity_ref: 'ACC-004', evidence_source: 'FIN-CASE-102', confidence: 0.93 },
    { id: 'TL-102-5', date: '2026-04-05T10:45:00', title: 'Southern Hawala Exchange Identified', description: 'Intelligence source identifies Southern Hawala Exchange as the primary laundering node.', event_type: 'INTELLIGENCE', entity_ref: 'ORG-002', evidence_source: 'INT-CASE-102', confidence: 0.92 },
    { id: 'TL-102-6', date: '2026-04-06T13:15:00', title: 'Suresh Babu Identified as Financier', description: 'Bank records and intelligence confirm Suresh Babu as primary source of illicit funds.', event_type: 'INTELLIGENCE', entity_ref: 'PERSON-005', evidence_source: 'INT-CASE-102', confidence: 0.89 },
    { id: 'TL-102-7', date: '2026-04-07T18:00:00', title: 'Meena Krishnan — Courier Link', description: 'Account-457 (Meena Krishnan) receives final layered transfer. CDR confirms coordination.', event_type: 'CDR', entity_ref: 'PERSON-003', evidence_source: 'CDR-CASE-102', confidence: 0.88 },
    { id: 'TL-102-8', date: '2026-04-08T09:30:00', title: 'Enforcement Action — Account Freeze', description: 'ED freezes Account-319 and Account-512 pending investigation. CASE-102 formally registered.', event_type: 'CASE', entity_ref: 'LOC-002', evidence_source: 'FIR-CASE-102', confidence: 1.0 },
    { id: 'TL-102-9', date: '2026-04-09T11:00:00', title: 'AI Lead Generated', description: 'AI system generates lead: Ravi Kumar connected to both CASE-101 and CASE-102 via shared accounts and CDR.', event_type: 'AI', entity_ref: 'PERSON-001', evidence_source: 'AI-ANALYSIS', confidence: 0.94 },
    { id: 'TL-102-10', date: '2026-04-10T14:00:00', title: 'Cross-Case Intelligence Report', description: 'Investigation unit receives cross-case intelligence linking CASE-101, CASE-102 networks. CASE-103 watch initiated.', event_type: 'INTELLIGENCE', entity_ref: 'PERSON-001', evidence_source: 'INT-CASE-102', confidence: 0.90 },
  ],
  '103': [
    { id: 'TL-103-1', date: '2026-05-15T10:00:00', title: 'Arms Cache Intelligence Report', description: 'State Intelligence receives report of arms cache near Madurai. Madurai Trading Syndicate named.', event_type: 'INTELLIGENCE', entity_ref: 'ORG-004', evidence_source: 'INT-CASE-103', confidence: 0.85 },
    { id: 'TL-103-2', date: '2026-05-17T14:30:00', title: 'Vehicle TN-38-AC-7721 Spotted', description: 'SUV (Vikram Nair) detected at Tuticorin Port loading area via CCTV. Same vehicle involved in CASE-101.', event_type: 'SURVEILLANCE', entity_ref: 'VEH-002', evidence_source: 'FIR-CASE-103', confidence: 0.90 },
    { id: 'TL-103-3', date: '2026-05-18T09:15:00', title: 'PHONE-001 Activity Spike', description: 'PHONE-001 (Ravi Kumar) shows unusual call activity. 6 calls to PHONE-006 (Priya Ramesh) in the morning.', event_type: 'CDR', entity_ref: 'PHONE-001', evidence_source: 'CDR-CASE-103', confidence: 0.94 },
    { id: 'TL-103-4', date: '2026-05-19T11:00:00', title: 'Meena Krishnan at Inland Cargo', description: 'Meena Krishnan observed at Inland Cargo Services depot. Intelligence flagged as suspicious.', event_type: 'INTELLIGENCE', entity_ref: 'PERSON-003', evidence_source: 'INT-CASE-103', confidence: 0.87 },
    { id: 'TL-103-5', date: '2026-05-20T16:45:00', title: 'Account-457 Transaction', description: 'Small transfer of ₹95,000 from Account-457 (Meena Krishnan) — potential operation payment.', event_type: 'FINANCIAL', entity_ref: 'ACC-003', evidence_source: 'FIN-CASE-103', confidence: 0.83 },
    { id: 'TL-103-6', date: '2026-05-21T20:00:00', title: 'Temporal Proximity Alert', description: 'AI detects 4-hour communication spike before expected incident window. PHONE-001 most active.', event_type: 'AI', entity_ref: 'PHONE-001', evidence_source: 'AI-ANALYSIS', confidence: 0.91 },
    { id: 'TL-103-7', date: '2026-05-22T02:15:00', title: 'Interception — Arms Seizure', description: 'Security forces intercept vehicle TN-58-KL-1190 (Priya Ramesh) near Madurai checkpoint. Arms seized.', event_type: 'CASE', entity_ref: 'VEH-003', evidence_source: 'FIR-CASE-103', confidence: 1.0 },
    { id: 'TL-103-8', date: '2026-05-22T03:30:00', title: 'CASE-103 Registered', description: 'FIR registered. Meena Krishnan and Priya Ramesh taken in for questioning. Ravi Kumar absconding.', event_type: 'CASE', entity_ref: 'LOC-004', evidence_source: 'FIR-CASE-103', confidence: 1.0 },
    { id: 'TL-103-9', date: '2026-05-23T09:00:00', title: 'Cross-Case Bridge Confirmed', description: 'Intelligence confirms Ravi Kumar as the central bridge across CASE-101, CASE-102 and CASE-103.', event_type: 'AI', entity_ref: 'PERSON-001', evidence_source: 'AI-ANALYSIS', confidence: 0.95 },
    { id: 'TL-103-10', date: '2026-05-24T11:00:00', title: 'Investigation Lead Escalated', description: 'Lead: "Ravi Kumar Cross-Case Nexus" approved by senior investigator. Lookout notice issued.', event_type: 'INTELLIGENCE', entity_ref: 'PERSON-001', evidence_source: 'INT-CASE-103', confidence: 0.97 },
  ],
};

// ─── SUSPICIOUS PATTERNS ────────────────────────────────────────────────────
export const SUSPICIOUS_PATTERNS = [
  {
    id: 'PAT-001',
    type: 'HIGH_CALL_FREQUENCY',
    title: 'High Call Frequency Before Incident',
    severity: 'HIGH',
    description: '38 calls detected between PHONE-001 (+91-9876543210) and PHONE-002 (+91-9123456780) within a 6-hour window immediately before the CASE-101 incident.',
    rule: 'Rule: ≥20 calls between same number pair within 6 hours before an incident',
    entities: ['PHONE-001', 'PHONE-002', 'PERSON-001', 'PERSON-002'],
    cases: ['CASE-101'],
    evidence: 'CDR-CASE-101: 38 call records, 2026-03-15 22:10 to 2026-03-16 04:15. Average call duration 3.2 minutes.',
    timestamp: '2026-03-16T04:15:00',
    confidence: 0.97,
    reason: 'Call pattern shows coordinated activity consistent with operational communication. Frequency, timing, and participants match prior trafficking network behavior.',
  },
  {
    id: 'PAT-002',
    type: 'SUSPICIOUS_TRANSFER',
    title: 'Suspicious Pre-Incident Financial Transfer',
    severity: 'CRITICAL',
    description: '₹8,50,000 transferred from Account-204 (Ravi Kumar, SBI) to Account-319 (Arun Selvam, HDFC) two days before the CASE-101 incident.',
    rule: 'Rule: Large transfer (>₹5L) between suspects within 72 hours of reported incident',
    entities: ['ACC-001', 'ACC-002', 'PERSON-001', 'PERSON-002'],
    cases: ['CASE-101', 'CASE-102'],
    evidence: 'FIN-CASE-101: NEFT transaction IMPS2026031412345, 2026-03-14 14:20. Amount: ₹8,50,000. Both accounts now flagged.',
    timestamp: '2026-03-14T14:20:00',
    confidence: 0.95,
    reason: 'Transfer amount, timing, and relationship between account holders are consistent with pre-operation payment. Account-319 subsequently forwarded funds to Account-457 (multi-hop).',
  },
  {
    id: 'PAT-003',
    type: 'CROSS_CASE_ENTITY',
    title: 'Cross-Case Entity: PHONE-001',
    severity: 'CRITICAL',
    description: 'PHONE-001 (+91-9876543210, Ravi Kumar) appears in CDR data for CASE-101, CASE-102 and CASE-103 — confirming it as a cross-case bridge entity.',
    rule: 'Rule: Same entity appearing in CDR/FIR records of 3+ separate cases',
    entities: ['PHONE-001', 'PERSON-001'],
    cases: ['CASE-101', 'CASE-102', 'CASE-103'],
    evidence: 'CDR-CASE-101 (38 calls), CDR-CASE-102 (14 calls), CDR-CASE-103 (6 calls to PHONE-006). All on same IMEI: 354875091234567.',
    timestamp: '2026-05-22T06:00:00',
    confidence: 0.99,
    reason: 'A single phone number appearing across 3 independent cases strongly indicates its user (Ravi Kumar) is a central coordinator of the criminal network.',
  },
  {
    id: 'PAT-004',
    type: 'MULTI_HOP_TRANSFER',
    title: 'Multi-Hop Financial Layering (3 Accounts)',
    severity: 'HIGH',
    description: 'Funds moved through Account-512 (Suresh Babu) → Account-319 (Arun Selvam) → Account-457 (Meena Krishnan) — a 3-hop layering scheme to obscure illegal funds.',
    rule: 'Rule: Sequential fund transfers through ≥3 accounts within 7-day window',
    entities: ['ACC-004', 'ACC-002', 'ACC-003', 'PERSON-005', 'PERSON-002', 'PERSON-003'],
    cases: ['CASE-102'],
    evidence: 'FIN-CASE-102: Transfer chain identified — ₹12,00,000 → ₹8,50,000 → ₹4,20,000 across 3 accounts. Layering reduces traceability.',
    timestamp: '2026-04-04T16:20:00',
    confidence: 0.93,
    reason: 'The sequential reduction in transfer amounts and rapid movement through multiple accounts is a classic hawala layering pattern used to obscure the origin and destination of funds.',
  },
  {
    id: 'PAT-005',
    type: 'TEMPORAL_PROXIMITY',
    title: 'Communication Spike Before CASE-103 Incident',
    severity: 'HIGH',
    description: 'PHONE-001 (Ravi Kumar) made 6 calls to PHONE-006 (Priya Ramesh) in the 4 hours before the CASE-103 arms seizure — a significant temporal proximity alert.',
    rule: 'Rule: ≥5 calls between key suspects within 4 hours before an incident',
    entities: ['PHONE-001', 'PHONE-006', 'PERSON-001', 'PERSON-006'],
    cases: ['CASE-103'],
    evidence: 'CDR-CASE-103: 6 calls from PHONE-001 to PHONE-006 on 2026-05-21 20:00 to 2026-05-22 00:00. Ravi Kumar was not present at scene but coordinated remotely.',
    timestamp: '2026-05-22T00:15:00',
    confidence: 0.91,
    reason: 'Ravi Kumar\'s calls to a CASE-103 suspect immediately before the incident — despite Ravi not being physically present — indicates he was coordinating the operation remotely.',
  },
  {
    id: 'PAT-006',
    type: 'REPEATED_COMMUNICATION',
    title: 'Repeated Communication Pattern Across 3 Cases',
    severity: 'MEDIUM',
    description: 'The number pair PHONE-001 ↔ PHONE-002 and PHONE-001 ↔ PHONE-003 appear in the call logs of multiple cases, indicating persistent network communication channels.',
    rule: 'Rule: Same number pair appearing in CDR data across ≥2 separate cases',
    entities: ['PHONE-001', 'PHONE-002', 'PHONE-003', 'PERSON-001', 'PERSON-002', 'PERSON-003'],
    cases: ['CASE-101', 'CASE-102', 'CASE-103'],
    evidence: 'PHONE-001 ↔ PHONE-002: CDR-CASE-101 (38 calls), CDR-CASE-102 (14 calls). PHONE-001 ↔ PHONE-003: CDR-CASE-102, CDR-CASE-103. Persistent communication channels maintained.',
    timestamp: '2026-05-23T09:00:00',
    confidence: 0.89,
    reason: 'Persistent communication between the same phone pairs across multiple separate incidents indicates an established and ongoing criminal network — not coincidental contact.',
  },
];

// ─── INVESTIGATION LEADS ────────────────────────────────────────────────────
export const INVESTIGATION_LEADS = [
  {
    id: 'LEAD-001',
    title: 'Ravi Kumar — Cross-Case Network Nexus',
    priority: 'CRITICAL',
    status: 'AI_SUGGESTED',
    entities: ['PERSON-001', 'PHONE-001', 'ACC-001'],
    cases: ['CASE-101', 'CASE-102', 'CASE-103'],
    reason: 'Ravi Kumar appears as the central bridge entity across all three active investigations. PHONE-001 is present in CDR records of all 3 cases. Account-204 links to pre-incident financial transfers in CASE-101 and CASE-102. Intelligence sources in CASE-103 confirm him as coordinator.',
    evidence: [
      'PHONE-001 (+91-9876543210) appears in CDR-CASE-101, CDR-CASE-102, CDR-CASE-103',
      'Account-204 linked to ₹8,50,000 pre-incident transfer (FIN-CASE-101)',
      'Named in FIR-CASE-101, FIR-CASE-102, INT-CASE-103',
      'Entity resolution: "Ravi Kumar", "R. Kumar", "Ravi K." → PERSON-001',
    ],
    confidence: 0.97,
    entity_a: 'Ravi Kumar (PERSON-001)',
    entity_b: 'CASE-101 / CASE-102 / CASE-103',
    match_type: 'Cross-Case Bridge Entity',
    lead_kind: 'INTELLIGENCE',
  },
  {
    id: 'LEAD-002',
    title: 'Account-204 to Account-319 — Suspicious Transfer',
    priority: 'HIGH',
    status: 'PENDING',
    entities: ['ACC-001', 'ACC-002', 'PERSON-001', 'PERSON-002'],
    cases: ['CASE-101', 'CASE-102'],
    reason: 'Pre-incident transfer of ₹8,50,000 from Ravi Kumar\'s Account-204 to Arun Selvam\'s Account-319. Timing (2 days before incident) and amount are consistent with operation funding.',
    evidence: [
      'FIN-CASE-101: NEFT ₹8,50,000 from Account-204 to Account-319 on 2026-03-14',
      'Account-319 subsequently transferred to Account-457 (layering)',
      'Both accounts owned by persons named in FIR-CASE-101',
    ],
    confidence: 0.93,
    entity_a: 'Account-204 (Ravi Kumar)',
    entity_b: 'Account-319 (Arun Selvam)',
    match_type: 'Suspicious Financial Transfer',
    lead_kind: 'FINANCIAL',
  },
  {
    id: 'LEAD-003',
    title: 'Southern Hawala Exchange — Multi-Case Financial Node',
    priority: 'HIGH',
    status: 'PENDING',
    entities: ['ORG-002', 'PERSON-002', 'PERSON-005', 'ACC-002', 'ACC-004'],
    cases: ['CASE-102'],
    reason: 'Southern Hawala Exchange (Arun Selvam) operated as the primary laundering node in CASE-102. Financed by Suresh Babu (Account-512). Multi-hop transfer scheme detected through 3 accounts.',
    evidence: [
      'INT-CASE-102: Intelligence source confirms Suresh Babu as financier',
      'FIN-CASE-102: ₹12L → ₹8.5L → ₹4.2L layering chain',
      'ORG-002 has no legitimate declared income to justify transactions',
    ],
    confidence: 0.89,
    entity_a: 'Southern Hawala Exchange (ORG-002)',
    entity_b: 'Suresh Babu (PERSON-005)',
    match_type: 'Hawala Network Entity',
    lead_kind: 'INTELLIGENCE',
  },
  {
    id: 'LEAD-004',
    title: 'Meena Krishnan — CASE-102/103 Bridge Courier',
    priority: 'MEDIUM',
    status: 'PENDING',
    entities: ['PERSON-003', 'PHONE-003', 'ACC-003'],
    cases: ['CASE-102', 'CASE-103'],
    reason: 'Meena Krishnan appears in both CASE-102 (financial transfer recipient) and CASE-103 (logistics coordinator). PHONE-003 communicates with PHONE-001 (Ravi Kumar) across both cases, confirming she is a secondary bridge entity.',
    evidence: [
      'FIN-CASE-102: Account-457 receives layered transfer',
      'CDR-CASE-103: PHONE-003 communicates with PHONE-001',
      'INT-CASE-103: Observed at Inland Cargo Services depot',
      'FIR-CASE-103: Named in arms smuggling complaint',
    ],
    confidence: 0.84,
    entity_a: 'Meena Krishnan (PERSON-003)',
    entity_b: 'CASE-102 / CASE-103',
    match_type: 'Cross-Case Bridge Entity',
    lead_kind: 'INTELLIGENCE',
  },
];

// ─── FIR TEXT FOR NLP DEMO ───────────────────────────────────────────────────
export const FIR_TEXT = `FIRST INFORMATION REPORT
Case Number: CASE-101
Police Station: Chennai Port Area, Tamil Nadu
Date: 16-03-2026

COMPLAINANT: Sub-Inspector, Narcotics Control Bureau, Chennai Unit

INCIDENT DETAILS:
On 16-03-2026, at approximately 02:30 hours, during a routine customs inspection at Chennai Port Area, officers detected contraband concealed in a shipping container registered to Chennai Coastal Exports Pvt. Ltd.

PRIMARY SUSPECT: Ravi Kumar, 38 years, residing at Chennai Port Area. Ravi Kumar is believed to be operating as a shipping agent and is the director of Chennai Coastal Exports Pvt. Ltd.

ASSOCIATES: Arun Selvam, 34 years, T. Nagar, Chennai. Vikram Nair, 42 years, Koyambedu, Chennai. Dinesh Rao, 45 years, Tuticorin Port Area.

VEHICLE INVOLVED: TN-09-BX-4532 (Container Truck), registered to Dinesh Rao. TN-38-AC-7721 (SUV), registered to Vikram Nair.

COMMUNICATION: Call Detail Records show extensive communication between +91-9876543210 (Ravi Kumar) and +91-9123456780 (Arun Selvam) prior to the incident. A total of 38 calls were recorded between 22:10 on 15-03-2026 and 04:15 on 16-03-2026.

FINANCIAL: Account-204 (State Bank of India) linked to Ravi Kumar shows a transfer of Rs. 8,50,000 to Account-319 (HDFC Bank) linked to Arun Selvam on 14-03-2026 at 14:20 hours, two days prior to the incident.

LOCATION: Chennai Port Area, Gate No. 7, Container Terminal, Tamil Nadu.

SEIZED MATERIAL: 12 kilograms of narcotic substance identified as heroin, concealed in false compartments within shipping container CNTR-7741-B.

NOTE: Intelligence report INT-CASE-101 dated 10-03-2026 had flagged Chennai Coastal Exports Pvt. Ltd. for suspicious shipping activities. Cross-case link established with previously registered Case CASE-102.

Registering Officer: Inspector K. Vijayalakshmi
Date: 16-03-2026`;

// ─── NLP ENTITY ANNOTATIONS ──────────────────────────────────────────────────
export const NLP_ENTITIES = [
  { text: 'Ravi Kumar', type: 'PERSON', confidence: 0.97, entity_ref: 'PERSON-001', source: 'FIR-CASE-101', start: 523, end: 533 },
  { text: 'Chennai Coastal Exports Pvt. Ltd', type: 'ORGANIZATION', confidence: 0.96, entity_ref: 'ORG-001', source: 'FIR-CASE-101', start: 581, end: 612 },
  { text: 'Arun Selvam', type: 'PERSON', confidence: 0.94, entity_ref: 'PERSON-002', source: 'FIR-CASE-101', start: 660, end: 670 },
  { text: 'Vikram Nair', type: 'PERSON', confidence: 0.92, entity_ref: 'PERSON-004', source: 'FIR-CASE-101', start: 694, end: 704 },
  { text: 'Dinesh Rao', type: 'PERSON', confidence: 0.90, entity_ref: 'PERSON-007', source: 'FIR-CASE-101', start: 718, end: 727 },
  { text: 'TN-09-BX-4532', type: 'VEHICLE', confidence: 0.99, entity_ref: 'VEH-001', source: 'FIR-CASE-101', start: 756, end: 769 },
  { text: 'TN-38-AC-7721', type: 'VEHICLE', confidence: 0.99, entity_ref: 'VEH-002', source: 'FIR-CASE-101', start: 810, end: 823 },
  { text: '+91-9876543210', type: 'PHONE', confidence: 0.99, entity_ref: 'PHONE-001', source: 'FIR-CASE-101', start: 878, end: 892 },
  { text: '+91-9123456780', type: 'PHONE', confidence: 0.99, entity_ref: 'PHONE-002', source: 'FIR-CASE-101', start: 904, end: 918 },
  { text: 'Account-204', type: 'FINANCIAL_ACCOUNT', confidence: 0.98, entity_ref: 'ACC-001', source: 'FIR-CASE-101', start: 1015, end: 1025 },
  { text: 'Account-319', type: 'FINANCIAL_ACCOUNT', confidence: 0.98, entity_ref: 'ACC-002', source: 'FIR-CASE-101', start: 1061, end: 1071 },
  { text: 'Chennai Port Area', type: 'LOCATION', confidence: 0.98, entity_ref: 'LOC-001', source: 'FIR-CASE-101', start: 1130, end: 1147 },
  { text: '16-03-2026', type: 'DATE', confidence: 0.99, entity_ref: null, source: 'FIR-CASE-101', start: 95, end: 105 },
  { text: 'CASE-101', type: 'CASE', confidence: 1.0, entity_ref: 'CASE-101', source: 'FIR-CASE-101', start: 30, end: 38 },
  { text: 'CASE-102', type: 'CASE', confidence: 0.99, entity_ref: 'CASE-102', source: 'FIR-CASE-101', start: 1290, end: 1298 },
];

// ─── ENTITY RESOLUTION EXAMPLES ──────────────────────────────────────────────
export const ENTITY_RESOLUTIONS = [
  {
    mentions: ['Ravi Kumar', 'R. Kumar', 'Ravi K.', 'Ravi'],
    resolved_id: 'PERSON-001',
    resolved_name: 'Ravi Kumar',
    type: 'PERSON',
    confidence: 0.97,
    method: 'NLP + Phonetic Similarity + Case Cross-Reference',
    status: 'HUMAN_VERIFIED',
  },
  {
    mentions: ['Arun Selvam', 'A. Selvam', 'Arun S.'],
    resolved_id: 'PERSON-002',
    resolved_name: 'Arun Selvam',
    type: 'PERSON',
    confidence: 0.94,
    method: 'NLP + Name Matching',
    status: 'AI_SUGGESTED',
  },
  {
    mentions: ['Chennai Coastal Exports', 'Chennai Coastal Exports Pvt. Ltd', 'CCE'],
    resolved_id: 'ORG-001',
    resolved_name: 'Chennai Coastal Exports Pvt. Ltd',
    type: 'ORGANIZATION',
    confidence: 0.96,
    method: 'NLP + MCA Registry Cross-Reference',
    status: 'HUMAN_VERIFIED',
  },
  {
    mentions: ['Account 204', 'Account-204', 'Acc. 204'],
    resolved_id: 'ACC-001',
    resolved_name: 'Account-204 (SBI)',
    type: 'FINANCIAL_ACCOUNT',
    confidence: 0.98,
    method: 'Structured Data Matching',
    status: 'HUMAN_VERIFIED',
  },
];

// ─── CDR DATA (summary) ───────────────────────────────────────────────────────
export const CDR_DATA = [
  { caller: 'PHONE-001', receiver: 'PHONE-002', calls: 38, duration_min: 122, date_range: '2026-03-15 22:10 – 2026-03-16 04:15', case_ref: 'CASE-101' },
  { caller: 'PHONE-001', receiver: 'PHONE-003', calls: 14, duration_min: 42, date_range: '2026-04-02 – 2026-04-07', case_ref: 'CASE-102' },
  { caller: 'PHONE-001', receiver: 'PHONE-004', calls: 9, duration_min: 28, date_range: '2026-03-14 – 2026-05-21', case_ref: 'CASE-101' },
  { caller: 'PHONE-001', receiver: 'PHONE-006', calls: 6, duration_min: 18, date_range: '2026-05-21 20:00 – 2026-05-22 00:00', case_ref: 'CASE-103' },
  { caller: 'PHONE-002', receiver: 'PHONE-005', calls: 11, duration_min: 35, date_range: '2026-04-01 – 2026-04-07', case_ref: 'CASE-102' },
  { caller: 'PHONE-003', receiver: 'PHONE-006', calls: 7, duration_min: 22, date_range: '2026-05-15 – 2026-05-21', case_ref: 'CASE-103' },
];

// ─── FINANCIAL TRANSACTIONS (summary) ────────────────────────────────────────
export const FINANCIAL_TRANSACTIONS = [
  { from: 'ACC-001', to: 'ACC-002', amount: 850000, date: '2026-03-14', type: 'NEFT', case_ref: 'CASE-101', ref: 'IMPS2026031412345' },
  { from: 'ACC-004', to: 'ACC-002', amount: 1200000, date: '2026-04-03', type: 'RTGS', case_ref: 'CASE-102', ref: 'RTGS2026040312345' },
  { from: 'ACC-002', to: 'ACC-003', amount: 420000, date: '2026-04-05', type: 'NEFT', case_ref: 'CASE-102', ref: 'NEFT2026040512345' },
  { from: 'ACC-003', to: 'ACC-005', amount: 95000, date: '2026-05-20', type: 'UPI', case_ref: 'CASE-103', ref: 'UPI2026052012345' },
];

// ─── COPILOT ANSWERS ─────────────────────────────────────────────────────────
export const COPILOT_QA = [
  {
    keywords: ['ravi kumar', 'case-103', 'case 103', 'connected', 'link'],
    answer: `Ravi Kumar (PERSON-001) is connected to CASE-103 through two confirmed pathways:

1. **Phone Connection**: PHONE-001 (+91-9876543210), registered to Ravi Kumar, made 6 calls to PHONE-006 (Priya Ramesh, CASE-103 primary accused) in the 4 hours before the CASE-103 arms seizure on 2026-05-21. This temporal proximity is flagged as a high-confidence suspicious pattern.

2. **Network Association**: Intelligence source INT-CASE-103 confirms that Ravi Kumar coordinated the operation remotely through Meena Krishnan (PERSON-003), who received layered funds from Account-457 linked to the CASE-102 hawala network that Ravi Kumar was part of.

**Connectivity Score: 0.91** — Ravi Kumar is considered the primary cross-case bridge entity for CASE-101, CASE-102, and CASE-103.`,
    entities: ['PERSON-001', 'PHONE-001', 'PHONE-006', 'PERSON-006'],
    cases: ['CASE-101', 'CASE-102', 'CASE-103'],
    confidence: '91%',
    sources: ['CDR-CASE-103', 'INT-CASE-103'],
  },
  {
    keywords: ['suspicious financial', 'financial activity', 'money', 'transfer', 'account'],
    answer: `Three suspicious financial patterns were detected in this investigation:

1. **Pre-Incident Transfer**: ₹8,50,000 from Account-204 (Ravi Kumar, SBI) to Account-319 (Arun Selvam, HDFC) on 2026-03-14, two days before CASE-101 incident. [CRITICAL]

2. **Multi-Hop Layering**: Account-512 (Suresh Babu, ₹12L) → Account-319 (Arun Selvam) → Account-457 (Meena Krishnan, ₹4.2L). Three-account hawala layering scheme identified in CASE-102. [HIGH]

3. **Operation Payment**: ₹95,000 from Account-457 (Meena Krishnan) on 2026-05-20, two days before CASE-103 incident. [MEDIUM]

Total suspicious funds: **₹21,45,000** across 3 cases.`,
    entities: ['ACC-001', 'ACC-002', 'ACC-003', 'ACC-004', 'PERSON-001', 'PERSON-002', 'PERSON-003', 'PERSON-005'],
    cases: ['CASE-101', 'CASE-102', 'CASE-103'],
    confidence: '94%',
    sources: ['FIN-CASE-101', 'FIN-CASE-102', 'FIN-CASE-103'],
  },
  {
    keywords: ['shared', 'entities', 'across cases', 'multiple cases', 'cross case', 'cross-case'],
    answer: `Three entities appear across multiple active cases:

1. **Ravi Kumar (PERSON-001)** — Appears in CASE-101, CASE-102, CASE-103
   - Named in FIR-CASE-101, FIR-CASE-102
   - PHONE-001 in CDR for all 3 cases
   - Account-204 linked in FIN-CASE-101 and FIN-CASE-102

2. **PHONE-001 (+91-9876543210)** — Appears in CASE-101, CASE-102, CASE-103
   - 38 calls in CASE-101, 14 calls in CASE-102, 6 calls in CASE-103
   - Registered to Ravi Kumar, IMEI: 354875091234567

3. **Meena Krishnan (PERSON-003)** — Appears in CASE-102, CASE-103
   - Receives layered funds in CASE-102
   - Logistics coordinator in CASE-103

These 3 entities form the backbone of the cross-case criminal network.`,
    entities: ['PERSON-001', 'PHONE-001', 'PERSON-003', 'ACC-001'],
    cases: ['CASE-101', 'CASE-102', 'CASE-103'],
    confidence: '97%',
    sources: ['CDR-CASE-101', 'CDR-CASE-102', 'CDR-CASE-103', 'FIN-CASE-101'],
  },
  {
    keywords: ['key entity', 'why', 'important', 'ravi', 'bridge', 'central'],
    answer: `Ravi Kumar (PERSON-001) is classified as a **Key Bridge Entity** for the following evidence-based reasons:

**Connectivity Score: 0.87** (highest in the investigation network)

Evidence:
- Appears in 3 active cases (CASE-101, CASE-102, CASE-103) — no other entity spans all three
- PHONE-001 is present in CDR records for ALL 3 cases
- Account-204 was used for pre-incident financial transfers in 2 cases
- Listed as Director of ORG-001 (front company) used in CASE-101 and CASE-102
- Intelligence sources in all 3 cases reference him as coordinator
- Entity resolution identified 4 name variations across FIR documents

**Network Position**: Ravi Kumar connects to 17 other entities through 12 direct relationships — more than any other entity in the investigation.`,
    entities: ['PERSON-001', 'PHONE-001', 'ACC-001', 'ORG-001'],
    cases: ['CASE-101', 'CASE-102', 'CASE-103'],
    confidence: '97%',
    sources: ['FIR-CASE-101', 'CDR-CASE-101', 'CDR-CASE-102', 'CDR-CASE-103', 'INT-CASE-103'],
  },
  {
    keywords: ['evidence', 'connects', 'two people', 'between', 'ravi', 'arun', 'meena'],
    answer: `**Ravi Kumar ↔ Arun Selvam** — Connected through 3 evidence types:

1. **CDR Evidence**: 38 calls between PHONE-001 (Ravi Kumar) and PHONE-002 (Arun Selvam) in 6 hours before CASE-101 [CDR-CASE-101]

2. **Financial Evidence**: ₹8,50,000 transferred from Account-204 (Ravi Kumar) to Account-319 (Arun Selvam) on 2026-03-14 [FIN-CASE-101]

3. **Organizational Evidence**: Both named as directors/operators of front companies with overlapping GST records and shipping manifests [FIR-CASE-101]

**Combined Relationship Confidence: 98%**

These two individuals are the primary suspects in CASE-101 and form the operational core of the Chennai coastal drug trafficking network.`,
    entities: ['PERSON-001', 'PERSON-002', 'PHONE-001', 'PHONE-002', 'ACC-001', 'ACC-002'],
    cases: ['CASE-101', 'CASE-102'],
    confidence: '98%',
    sources: ['CDR-CASE-101', 'FIN-CASE-101', 'FIR-CASE-101'],
  },
  {
    keywords: ['shortest', 'path', 'connection', 'organization', 'org-001', 'coastal', 'exports'],
    answer: `**Shortest Connection: Ravi Kumar → Chennai Coastal Exports Pvt. Ltd**

This is a direct 1-hop connection:

**Ravi Kumar (PERSON-001)**
↓ ASSOCIATED_WITH [Confidence: 94%]
**Chennai Coastal Exports Pvt. Ltd (ORG-001)**

Evidence: Ravi Kumar is listed as a Director of Chennai Coastal Exports Pvt. Ltd in MCA (Ministry of Corporate Affairs) filings. The organization was used as a front company to route drug shipments through Chennai Port Area. [Source: FIR-CASE-101, INT-CASE-101]

For longer paths through the network, the path Ravi Kumar → PHONE-001 → PHONE-002 → Arun Selvam → Southern Hawala Exchange spans 4 hops and crosses CASE-101 and CASE-102.`,
    entities: ['PERSON-001', 'ORG-001', 'PHONE-001', 'PERSON-002', 'ORG-002'],
    cases: ['CASE-101', 'CASE-102'],
    confidence: '94%',
    sources: ['FIR-CASE-101', 'INT-CASE-101'],
  },
];

// ─── KEY ENTITY ANALYTICS ─────────────────────────────────────────────────────
export const KEY_ENTITIES_ANALYTICS = [
  { entity_id: 'PERSON-001', name: 'Ravi Kumar', type: 'Person', cases: 3, connections: 17, cross_case_score: 0.97, evidence_count: 14, activity_score: 'HIGH' },
  { entity_id: 'PHONE-001', name: '+91-9876543210', type: 'Phone', cases: 3, connections: 8, cross_case_score: 0.95, evidence_count: 9, activity_score: 'HIGH' },
  { entity_id: 'PERSON-002', name: 'Arun Selvam', type: 'Person', cases: 2, connections: 11, cross_case_score: 0.82, evidence_count: 9, activity_score: 'HIGH' },
  { entity_id: 'ACC-001', name: 'Account-204', type: 'FinancialAccount', cases: 2, connections: 5, cross_case_score: 0.88, evidence_count: 6, activity_score: 'HIGH' },
  { entity_id: 'ORG-001', name: 'Chennai Coastal Exports', type: 'Organization', cases: 2, connections: 6, cross_case_score: 0.79, evidence_count: 5, activity_score: 'MEDIUM' },
  { entity_id: 'PERSON-003', name: 'Meena Krishnan', type: 'Person', cases: 2, connections: 7, cross_case_score: 0.74, evidence_count: 6, activity_score: 'MEDIUM' },
  { entity_id: 'ACC-002', name: 'Account-319', type: 'FinancialAccount', cases: 2, connections: 4, cross_case_score: 0.71, evidence_count: 5, activity_score: 'MEDIUM' },
  { entity_id: 'ORG-002', name: 'Southern Hawala Exchange', type: 'Organization', cases: 1, connections: 4, cross_case_score: 0.55, evidence_count: 4, activity_score: 'MEDIUM' },
];

// ─── PREDEFINED PATHS ─────────────────────────────────────────────────────────
export const PREDEFINED_PATHS = {
  'PERSON-001__ORG-001': {
    path: ['PERSON-001', 'ORG-001'],
    hops: [
      { from_id: 'PERSON-001', to_id: 'ORG-001', from_name: 'Ravi Kumar', to_name: 'Chennai Coastal Exports Pvt. Ltd', relationship: 'ASSOCIATED_WITH', evidence: 'MCA Director listing — FIR-CASE-101', case_ref: 'CASE-101', timestamp: '2026-03-16', confidence: 0.94 },
    ],
    explanation: 'Ravi Kumar is directly associated with Chennai Coastal Exports Pvt. Ltd as a Director — a single-hop connection confirmed by MCA records and FIR-CASE-101.',
  },
  'PERSON-001__ORG-002': {
    path: ['PERSON-001', 'PHONE-001', 'PHONE-002', 'PERSON-002', 'ORG-002'],
    hops: [
      { from_id: 'PERSON-001', to_id: 'PHONE-001', from_name: 'Ravi Kumar', to_name: '+91-9876543210', relationship: 'USES', evidence: 'CDR subscriber record — CDR-CASE-101', case_ref: 'CASE-101', timestamp: '2026-03-15', confidence: 0.99 },
      { from_id: 'PHONE-001', to_id: 'PHONE-002', from_name: '+91-9876543210', to_name: '+91-9123456780', relationship: 'COMMUNICATES_WITH', evidence: '38 calls in 6-hour window — CDR-CASE-101', case_ref: 'CASE-101', timestamp: '2026-03-15', confidence: 0.97 },
      { from_id: 'PHONE-002', to_id: 'PERSON-002', from_name: '+91-9123456780', to_name: 'Arun Selvam', relationship: 'USED_BY', evidence: 'Subscriber records — CDR-CASE-102', case_ref: 'CASE-102', timestamp: '2026-04-02', confidence: 0.96 },
      { from_id: 'PERSON-002', to_id: 'ORG-002', from_name: 'Arun Selvam', to_name: 'Southern Hawala Exchange', relationship: 'ASSOCIATED_WITH', evidence: 'Intelligence source confirms operator — INT-CASE-102', case_ref: 'CASE-102', timestamp: '2026-04-05', confidence: 0.96 },
    ],
    explanation: 'Ravi Kumar connects to Southern Hawala Exchange through a 4-hop network path: via his phone (PHONE-001) which communicated with Arun Selvam\'s phone (PHONE-002), and Arun Selvam is the confirmed operator of Southern Hawala Exchange. This path crosses CASE-101 and CASE-102.',
  },
  'PERSON-001__ACC-002': {
    path: ['PERSON-001', 'ACC-001', 'ACC-002'],
    hops: [
      { from_id: 'PERSON-001', to_id: 'ACC-001', from_name: 'Ravi Kumar', to_name: 'Account-204', relationship: 'OWNS', evidence: 'SBI KYC records — FIN-CASE-101', case_ref: 'CASE-101', timestamp: '2026-03-14', confidence: 0.97 },
      { from_id: 'ACC-001', to_id: 'ACC-002', from_name: 'Account-204', to_name: 'Account-319', relationship: 'TRANSFERRED_TO', evidence: '₹8,50,000 NEFT transfer — FIN-CASE-101', case_ref: 'CASE-101', timestamp: '2026-03-14', confidence: 0.95 },
    ],
    explanation: 'Ravi Kumar\'s Account-204 transferred ₹8,50,000 to Account-319 (Arun Selvam) two days before the CASE-101 incident. This 2-hop financial path confirms a direct financial relationship between the two primary suspects.',
  },
  'PERSON-001__PERSON-003': {
    path: ['PERSON-001', 'PHONE-001', 'PHONE-003', 'PERSON-003'],
    hops: [
      { from_id: 'PERSON-001', to_id: 'PHONE-001', from_name: 'Ravi Kumar', to_name: '+91-9876543210', relationship: 'USES', evidence: 'CDR subscriber record', case_ref: 'CASE-101', timestamp: '2026-03-15', confidence: 0.99 },
      { from_id: 'PHONE-001', to_id: 'PHONE-003', from_name: '+91-9876543210', to_name: '+91-9988776655', relationship: 'COMMUNICATES_WITH', evidence: '14 calls across CASE-102, CASE-103 — CDR-CASE-102', case_ref: 'CASE-102', timestamp: '2026-04-03', confidence: 0.91 },
      { from_id: 'PHONE-003', to_id: 'PERSON-003', from_name: '+91-9988776655', to_name: 'Meena Krishnan', relationship: 'USED_BY', evidence: 'Subscriber records — CDR-CASE-103', case_ref: 'CASE-103', timestamp: '2026-05-18', confidence: 0.93 },
    ],
    explanation: 'Ravi Kumar connects to Meena Krishnan through 3 hops via their phones. Ravi\'s PHONE-001 communicated with PHONE-003 (Meena Krishnan) across CASE-102 and CASE-103 — confirming Meena as a key contact in the extended criminal network.',
  },
};

// ─── ADMIN SYSTEM DATA ────────────────────────────────────────────────────────
export const ADMIN_DATA = {
  system_overview: {
    total_users: 18,
    active_investigations: 5,
    data_sources_ingested: 4,
    system_health: 'OPTIMAL (99.9% Uptime)',
    api_latency_ms: 14,
    active_sessions: 6,
    storage_used_mb: 4.8,
    storage_capacity_mb: 50.0,
    services: [
      { name: 'AI/NLP Named Entity Engine', status: 'ONLINE', latency: '42ms', version: 'v3.2.0' },
      { name: 'Forensic Knowledge Graph', status: 'ONLINE', latency: '18ms', version: 'Cytoscape-Core' },
      { name: 'Multi-Case Correlation Bus', status: 'ONLINE', latency: '24ms', version: 'v2.1' },
      { name: 'Red-String Path Computation', status: 'ONLINE', latency: '12ms', version: 'BFS-Dijkstra' },
      { name: 'Audit & Evidence Chain Ledger', status: 'SECURED', latency: '8ms', version: 'SHA256' },
    ]
  },
  users: [
    { id: 'USR-001', name: 'Insp. Rajesh Vardhan', email: 'investigator@police.gov.in', badge: 'DL-CB-9021', role: 'INVESTIGATOR', department: 'Narcotics & Special Cell, Chennai', status: 'ACTIVE', last_active: '2 mins ago', permissions: ['CASE_VIEW', 'GRAPH_EXPLORE', 'LEAD_VERIFY', 'COPILOT_QUERY'] },
    { id: 'USR-002', name: 'Dr. Priya Sankar', email: 'analyst@forensics.gov.in', badge: 'INT-908', role: 'ANALYST', department: 'Criminal Intelligence & Analytics Wing', status: 'ACTIVE', last_active: 'Just now', permissions: ['CROSS_CASE_ANALYTICS', 'COMMUNITY_DETECTION', 'CENTRALITY_RANK', 'EXPORT_REPORT'] },
    { id: 'USR-003', name: 'Superintendent K. Rao', email: 'admin@police.gov.in', badge: 'HQ-001', role: 'ADMIN', department: 'State Crime Records Bureau', status: 'ACTIVE', last_active: 'Active now', permissions: ['SYSTEM_CONTROL', 'USER_MGMT', 'RBAC_CONFIG', 'AUDIT_LOGS', 'SOURCE_INGEST'] },
    { id: 'USR-004', name: 'Officer Ananya Sen', email: 'ananya.sen@police.gov.in', badge: 'DL-NC-412', role: 'INVESTIGATOR', department: 'Cyber Forensics Unit', status: 'ACTIVE', last_active: '1 hour ago', permissions: ['CASE_VIEW', 'GRAPH_EXPLORE', 'LEAD_VERIFY'] },
    { id: 'USR-005', name: 'Sub-Insp. M. Balaji', email: 'm.balaji@police.gov.in', badge: 'TN-PT-118', role: 'VIEWER', department: 'Port Security Vigilance', status: 'DEACTIVATED', last_active: '3 days ago', permissions: ['CASE_VIEW_ONLY'] },
  ],
  access_control: [
    { role: 'INVESTIGATOR', description: 'Active case file handling, suspect network inspection, and lead verification sign-offs.', cases_access: 'Assigned Cases (101, 102, 103)', data_sources: 'FIRs, CDRs, Bank Transcripts', lead_signoff: true },
    { role: 'ANALYST', description: 'Cross-case intelligence synthesis, crime trends, community cluster detection, and report generation.', cases_access: 'All Jurisdictional Cases', data_sources: 'All Structured & Unstructured Feeds', lead_signoff: false },
    { role: 'ADMIN', description: 'Complete platform oversight, user role administration, security audit trails, and data pipeline management.', cases_access: 'Global Administrative Access', data_sources: 'System Pipeline Feeds', lead_signoff: true },
    { role: 'VIEWER', description: 'Read-only review of closed case dossiers and summary intelligence briefs.', cases_access: 'Public/Declassified Case Records', data_sources: 'Summary Briefs Only', lead_signoff: false },
  ],
  audit_logs: [
    { id: 'LOG-8841', timestamp: '19:24:10', user: 'Insp. Rajesh Vardhan (INVESTIGATOR)', action: 'LEAD_VERIFIED', detail: 'Verified Lead LEAD-001 (Ravi Kumar Cross-Case Nexus) as Human Verified', severity: 'NORMAL', ip: '10.14.82.19' },
    { id: 'LOG-8840', timestamp: '19:20:45', user: 'Insp. Rajesh Vardhan (INVESTIGATOR)', action: 'DATA_INGEST_RUN', detail: 'Triggered multi-source ingestion pipeline: 4 sources processed, 24 entities resolved', severity: 'INFO', ip: '10.14.82.19' },
    { id: 'LOG-8839', timestamp: '19:15:30', user: 'Dr. Priya Sankar (ANALYST)', action: 'REPORT_EXPORT', detail: 'Generated and downloaded intelligence summary report for CASE-101', severity: 'NORMAL', ip: '10.14.82.24' },
    { id: 'LOG-8838', timestamp: '18:58:12', user: 'Superintendent K. Rao (ADMIN)', action: 'ROLE_PERMISSION_CHECK', detail: 'Audit verify RBAC compliance on CDR datasets for 14 active officers', severity: 'INFO', ip: '10.14.80.01' },
    { id: 'LOG-8837', timestamp: '17:42:05', user: 'Sub-Insp. M. Balaji (VIEWER)', action: 'UNAUTHORIZED_ACCESS_BLOCKED', detail: 'Attempted write access to CASE-102 wire transfers (Access Denied by RBAC)', severity: 'WARNING', ip: '10.14.89.44' },
    { id: 'LOG-8836', timestamp: '16:30:19', user: 'Insp. Rajesh Vardhan (INVESTIGATOR)', action: 'AUTH_SUCCESS', detail: 'Officer logged into Investigator Workbench with token DL-CB-9021', severity: 'NORMAL', ip: '10.14.82.19' },
  ],
  data_sources: [
    { id: 'SRC-001', name: 'FIR Police Complaints Archive', type: 'Unstructured Text (.txt)', count: '1 Primary FIR (Case 101)', sync: 'SYNCHRONIZED', hash: 'e3b0c44298fc1c149afbf4c8996fb924', last_updated: '2026-03-16' },
    { id: 'SRC-002', name: 'Telecom CDR Call Detail Records', type: 'Tabular Log (.csv)', count: '142 Call Records', sync: 'SYNCHRONIZED', hash: '8f4c2b9a71d8e5e32c0f1a4e6b8c9d01', last_updated: '2026-03-16' },
    { id: 'SRC-003', name: 'Bank NEFT/RTGS Transaction Ledgers', type: 'Financial Ledger (.csv)', count: '28 Transactions', sync: 'SYNCHRONIZED', hash: '4b7a1c9e3f0d2b8a6e5c7a9f1b3d5e7a', last_updated: '2026-03-15' },
    { id: 'SRC-004', name: 'Field Surveillance & Informant Intel', type: 'Covert Brief (.json)', count: '4 Field Reports', sync: 'SYNCHRONIZED', hash: '9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d', last_updated: '2026-03-10' },
  ]
};

// ─── ANALYST INTELLIGENCE DATA ───────────────────────────────────────────────
export const ANALYST_DATA = {
  crime_trends: {
    monthly_incidents: [
      { month: 'Oct 2025', count: 18, narcotics: 6, hawala: 4, arms: 3, vehicle: 5 },
      { month: 'Nov 2025', count: 22, narcotics: 8, hawala: 5, arms: 4, vehicle: 5 },
      { month: 'Dec 2025', count: 27, narcotics: 11, hawala: 7, arms: 4, vehicle: 5 },
      { month: 'Jan 2026', count: 31, narcotics: 14, hawala: 8, arms: 5, vehicle: 4 },
      { month: 'Feb 2026', count: 38, narcotics: 17, hawala: 11, arms: 6, vehicle: 4 },
      { month: 'Mar 2026', count: 44, narcotics: 21, hawala: 13, arms: 6, vehicle: 4 },
    ],
    growth_patterns: [
      { category: 'Commercial Narcotics Smuggling', trend: '+34%', type: 'RISING', reason: 'Coordinated shipments via Chennai Coastal Exports container route' },
      { category: 'Cross-Border Hawala Transfers', trend: '+21%', type: 'RISING', reason: 'High velocity layering via Southern Hawala Exchange accounts' },
      { category: 'Unlicensed Firearms Distribution', trend: '+12%', type: 'RISING', reason: 'Secondary corridor between Tuticorin Port and Coimbatore' },
      { category: 'Local Extortion & Strong-Arming', trend: '-14%', type: 'DECLINING', reason: 'Syndicate shifted operations towards high-yield maritime contraband' },
    ],
    repeated_zones: [
      { location: 'Chennai Port Area, Gate 7', cases: 3, severity: 'CRITICAL', coordinates: [13.0827, 80.2707], alert: 'Primary maritime contraband entry point' },
      { location: 'Koyambedu Transport Terminal', cases: 2, severity: 'HIGH', coordinates: [13.0694, 80.1948], alert: 'Logistics consolidation & container truck exchange' },
      { location: 'T. Nagar Commercial Hub', cases: 2, severity: 'HIGH', coordinates: [13.0418, 80.2341], alert: 'Informal hawala cash drop and courier dispatch' },
      { location: 'Tuticorin Deepwater Port Area', cases: 2, severity: 'MEDIUM', coordinates: [8.7642, 78.1348], alert: 'Secondary maritime vessel drop zone' },
    ]
  },
  community_clusters: [
    {
      id: 'CLUSTER-A',
      name: 'Coastal Maritime Smuggling Wing',
      leader: 'Ravi Kumar (PERSON-001)',
      members_count: 8,
      members: ['Ravi Kumar', 'Dinesh Rao', 'TN-09-BX-4532', 'Chennai Coastal Exports', 'Chennai Port Gate 7'],
      cases: ['CASE-101', 'CASE-103'],
      modus_operandi: 'Conceals bulk narcotics inside legitimate commercial container shipments passing through port terminals.',
      color: '#D9AA3D',
      risk_level: 'CRITICAL'
    },
    {
      id: 'CLUSTER-B',
      name: 'Hawala Financial Laundering Cell',
      leader: 'Arun Selvam (PERSON-002)',
      members_count: 6,
      members: ['Arun Selvam', 'Suresh Babu', 'Southern Hawala Exchange', 'Account-204', 'Account-319', 'Account-512'],
      cases: ['CASE-101', 'CASE-102'],
      modus_operandi: 'Pre-funds operations via quick inter-bank transfers and distributes layered funds into Hawala cash pools.',
      color: '#4ADE80',
      risk_level: 'HIGH'
    },
    {
      id: 'CLUSTER-C',
      name: 'Inland Arms & Transit Logistics',
      leader: 'Meena Krishnan (PERSON-003)',
      members_count: 5,
      members: ['Meena Krishnan', 'Vikram Nair', 'Inland Cargo Services', 'TN-38-AC-7721', 'Coimbatore Depot'],
      cases: ['CASE-102', 'CASE-103'],
      modus_operandi: 'Transports illicit goods from coastal hubs into interior distribution networks using courier fleet.',
      color: '#818CF8',
      risk_level: 'HIGH'
    }
  ],
  bridge_entity_analysis: {
    entity_id: 'PERSON-001',
    name: 'Ravi Kumar',
    inter_cluster_centrality: 0.98,
    explanation: 'Ravi Kumar is the singular apex bridge entity linking Cluster A (Maritime Contraband), Cluster B (Hawala Financing), and Cluster C (Inland Distribution). Neutralizing this node fragments the syndicate into isolated cells.',
    shared_bridges: [
      { id: 'PHONE-001', name: '+91-9876543210', role: 'Telecom bridge between Cluster A and Cluster B' },
      { id: 'ACC-001', name: 'Account-204 (SBI)', role: 'Financial conduit linking Cluster A to Cluster B' },
    ]
  },
  link_predictions: [
    {
      entity_a: 'Suresh Babu (Financier)',
      entity_b: 'Ravi Kumar (Coordinator)',
      algorithm: 'Adamic-Adar / Resource Allocation',
      predicted_score: '88%',
      status: 'AI_SUGGESTED_POTENTIAL_LINK',
      rationale: 'Suresh Babu financed Southern Hawala Exchange, which immediately received pre-incident transfers from Ravi Kumar. High statistical likelihood of direct conspiratorial relationship.',
      suggested_action: 'Subpoena communication records between Suresh Babu and Ravi Kumar for Feb-Mar 2026.'
    },
    {
      entity_a: 'Dinesh Rao (Fleet Owner)',
      entity_b: 'Meena Krishnan (Logistics Courier)',
      algorithm: 'Jaccard Topology Similarity',
      predicted_score: '79%',
      status: 'AI_SUGGESTED_POTENTIAL_LINK',
      rationale: 'Both entities share 3 common logistics waypoints in CASE-103 and co-occurred at Inland Cargo Services depot.',
      suggested_action: 'Cross-reference GPS toll data between Dinesh Rao\'s truck and Meena Krishnan\'s vehicle.'
    },
    {
      entity_a: 'Account-204 (Ravi Kumar)',
      entity_b: 'Account-512 (Suresh Babu)',
      algorithm: 'Common Neighbors Multi-Hop',
      predicted_score: '82%',
      status: 'AI_SUGGESTED_POTENTIAL_LINK',
      rationale: 'Both accounts funneled transactions through Arun Selvam\'s intermediary Account-319 within a 4-day window.',
      suggested_action: 'Request bank KYC and IP audit logs for online banking sessions.'
    }
  ]
};

export default {
  PERSONS, PHONES, ORGANIZATIONS, ACCOUNTS, VEHICLES, LOCATIONS,
  RELATIONSHIPS, CASES, TIMELINE_EVENTS, SUSPICIOUS_PATTERNS,
  INVESTIGATION_LEADS, FIR_TEXT, NLP_ENTITIES, ENTITY_RESOLUTIONS,
  CDR_DATA, FINANCIAL_TRANSACTIONS, COPILOT_QA, KEY_ENTITIES_ANALYTICS,
  PREDEFINED_PATHS, ADMIN_DATA, ANALYST_DATA,
};
