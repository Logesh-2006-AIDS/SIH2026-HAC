/**
 * SIH 26189 — Canonical Investigation Dataset
 * Standardized across all 5 Cases (101 to 105), 50 Nodes, and 22 Relationships.
 */

// ─── CASES ───────────────────────────────────────────────────────────────────
export const CASES = [
  {
    case_number: '101',
    fir_number: 'FIR No. 101/2025',
    title: 'Armed Robbery & Extortion Syndicate (M/s Royal Jewellers)',
    crime_category: 'Extortion / Armed Robbery / MCOCA',
    jurisdiction: 'Crime Branch, North District, Delhi Police',
    incident_date: '2025-04-12T21:00:00Z',
    status: 'UNDER_INVESTIGATION',
    priority: 'HIGH',
    accused: ['Ravi Kumar (P001)', 'Vikram Singh (P002)', 'Meena Sharma (P003)', 'Manish Tiwari (P008)'],
    summary: 'Armed robbery extracting Rs. 15,00,000 cash; funds laundered via shell company Apex Global Logistics.',
    entities: ['P001', 'P002', 'P003', 'P008', 'O001', 'V001', 'L001', 'L002', 'L004', 'PH001', 'PH002', 'PH003', 'PH008', 'A001', 'A006'],
  },
  {
    case_number: '102',
    fir_number: 'FIR No. 102/2025',
    title: 'Cyber Phishing & Darknet Crypto Laundering Ring',
    crime_category: 'Cyber Fraud / PMLA 2002 / IT Act',
    jurisdiction: 'Cyber Crime Branch, Delhi Police',
    incident_date: '2025-05-28T15:00:00Z',
    status: 'UNDER_INVESTIGATION',
    priority: 'CRITICAL',
    accused: ['Vikram Singh (P002)', 'Aarav Mehta (P004)', 'Sanjay Gupta (P009)', 'Unknown Caller (P011)'],
    summary: 'Over 1,200 victims defrauded of Rs. 4.8 Crore; INR converted to 47,000 USDT via DarkNet Crypto Exchange.',
    entities: ['P002', 'P004', 'P009', 'P011', 'O002', 'V002', 'L003', 'PH002', 'PH004', 'PH009', 'PH011', 'A002', 'A003', 'A004'],
  },
  {
    case_number: '103',
    fir_number: 'FIR No. 103/2025',
    title: 'Illicit Firearms Smuggling (NH-58 Transit Interception)',
    crime_category: 'Arms Act 1959 / UAPA / Conspiracy',
    jurisdiction: 'Special Crime Branch, UP Police (Meerut)',
    incident_date: '2025-06-08T23:30:00Z',
    status: 'UNDER_INVESTIGATION',
    priority: 'CRITICAL',
    accused: ['Suresh Yadav (P005)', 'Manish Tiwari (P008)', 'Unknown Caller (P011)'],
    summary: 'Interception of 34 illegal firearms on NH-58; shared burner phone link with Case 102.',
    entities: ['P002', 'P005', 'P008', 'P011', 'O003', 'V003', 'L005', 'PH005', 'PH008', 'PH011', 'A005'],
  },
  {
    case_number: '104',
    fir_number: 'FIR No. 104/2025',
    title: 'Inter-State Luxury Vehicle Theft & Plate Cloning Syndicate',
    crime_category: 'Organized Auto Theft / Cheating',
    jurisdiction: 'Maharashtra Auto Crime Cell, Mumbai',
    incident_date: '2025-06-22T16:00:00Z',
    status: 'UNDER_INVESTIGATION',
    priority: 'MEDIUM',
    accused: ['Priya Nair (P006)', 'Rohit Patel (P010)'],
    summary: 'Luxury vehicle theft and chassis cloning operating through front entity Luxe Motor Exports Pvt Ltd.',
    entities: ['P006', 'P010', 'O004', 'V004', 'L006', 'PH006', 'PH010', 'A007', 'A008'],
  },
  {
    case_number: '105',
    fir_number: 'FIR No. 105/2025',
    title: 'Commercial Hawala Operations & Shell Company Layering',
    crime_category: 'PMLA 2002 / FEMA / Hawala',
    jurisdiction: 'Economic Offences Wing / Enforcement Directorate',
    incident_date: '2025-07-05T10:00:00Z',
    status: 'UNDER_INVESTIGATION',
    priority: 'CRITICAL',
    accused: ['Ravi Kumar (P001)', 'Deepak Srivastava (P007)', 'Aarav Mehta (P004)', 'Rohit Patel (P010)'],
    summary: 'Rs. 22 Crore processed across 417 transactions via Shroff Money Services and Apex Global Logistics.',
    entities: ['P001', 'P004', 'P007', 'P010', 'O001', 'O005', 'V005', 'L001', 'L004', 'PH001', 'PH007', 'A001', 'A009', 'A010', 'A011'],
  },
];

// ─── 50 CANONICAL NODES ───────────────────────────────────────────────────────
export const ALL_CANONICAL_NODES = [
  // 11 Persons
  { id: 'P001', name: 'Ravi Kumar', type: 'Person', role: 'Mastermind / Beneficial Owner', aliases: ['Ravan', 'R. Kumar', 'Ravi K.'], phone: '+91-98110-44501', address: 'C-14, Sector 7, Rohini, New Delhi', cases: ['101', '105'], confidence: 0.98 },
  { id: 'P002', name: 'Vikram Singh', type: 'Person', role: 'Network Coordinator & Bridge', aliases: ['Vicky', 'Vikram S.', 'V. Singh'], phone: '+91-98765-32100', address: 'Flat 3B, MG Road, Gurgaon, Haryana', cases: ['101', '102', '103'], confidence: 0.97 },
  { id: 'P003', name: 'Meena Sharma', type: 'Person', role: 'Insider & Reconnaissance', aliases: ['Meena S.', 'M. Sharma'], phone: '+91-70011-12345', address: '12, Karol Bagh, New Delhi', cases: ['101'], confidence: 0.92 },
  { id: 'P004', name: 'Aarav Mehta', type: 'Person', role: 'Crypto & DarkNet Handler', aliases: ['AJ Mehta', 'Aarav M.'], phone: '+91-99300-67890', address: 'B-202, Cyber City, Gurgaon', cases: ['102', '105'], confidence: 0.95 },
  { id: 'P005', name: 'Suresh Yadav', type: 'Person', role: 'Arms Procurement Lead', aliases: ['Surya', 'S. Yadav'], phone: '+91-98290-11223', address: 'Village Partapur, Meerut, UP', cases: ['103'], confidence: 0.91 },
  { id: 'P006', name: 'Priya Nair', type: 'Person', role: 'Auto Syndicate Head', aliases: ['P. Nair', 'Madam Priya'], phone: '+91-98200-44556', address: 'Sea Face Apartments, Worli, Mumbai', cases: ['104'], confidence: 0.93 },
  { id: 'P007', name: 'Deepak Srivastava', type: 'Person', role: 'Hawala Operator', aliases: ['Munim Ji', 'D. Srivastava'], phone: '+91-98100-77889', address: '45, Pahar Ganj, New Delhi', cases: ['105'], confidence: 0.96 },
  { id: 'P008', name: 'Manish Tiwari', type: 'Person', role: 'Logistics & Muscle', aliases: ['Pandit', 'M. Tiwari'], phone: '+91-98180-33445', address: 'Gali 4, Shakarpur, Delhi', cases: ['101', '103'], confidence: 0.89 },
  { id: 'P009', name: 'Sanjay Gupta', type: 'Person', role: 'Mule Account Coordinator', aliases: ['Sanju', 'S. Gupta'], phone: '+91-98710-55667', address: 'Sector 14, Noida, UP', cases: ['102'], confidence: 0.87 },
  { id: 'P010', name: 'Rohit Patel', type: 'Person', role: 'Chassis Cloner & Courier', aliases: ['R. Patel', 'Rohit P.'], phone: '+91-98210-99887', address: 'MIDC Area, Andheri East, Mumbai', cases: ['104', '105'], confidence: 0.90 },
  { id: 'P011', name: 'Unknown Caller (+91-98110-99999)', type: 'Person', role: 'Unregistered Burner Bridge', aliases: ['Ghost Caller'], phone: '+91-98110-99999', address: 'Untraced Tower Location, NH-58', cases: ['102', '103'], confidence: 0.94 },

  // 5 Organizations
  { id: 'O001', name: 'Apex Global Logistics Pvt Ltd', type: 'Organization', alias: 'Apex Logistics', address: 'Plot 44, Okhla Phase III, New Delhi', cases: ['101', '105'], confidence: 0.98 },
  { id: 'O002', name: 'DarkNet Crypto Exchange Service', type: 'Organization', alias: 'DarkEx', address: 'TOR Hidden Service / Dark Web', cases: ['102'], confidence: 0.95 },
  { id: 'O003', name: 'North Star Arms Traders', type: 'Organization', alias: 'NSAT', address: 'Meerut, UP (Mobile Base)', cases: ['103'], confidence: 0.91 },
  { id: 'O004', name: 'Luxe Motor Exports Pvt Ltd', type: 'Organization', alias: 'Luxe Motors', address: 'Andheri East, Mumbai', cases: ['104'], confidence: 0.92 },
  { id: 'O005', name: 'Shroff Money Services', type: 'Organization', alias: 'SMS Hawala', address: 'Pahar Ganj, New Delhi', cases: ['105'], confidence: 0.96 },

  // 6 Vehicles
  { id: 'V001', name: 'DL-01-AB-1234 (Toyota Fortuner)', type: 'Vehicle', reg_number: 'DL-01-AB-1234', color: 'White', cases: ['101'], confidence: 0.88 },
  { id: 'V002', name: 'DL-02-CD-5678 (Honda City)', type: 'Vehicle', reg_number: 'DL-02-CD-5678', color: 'Silver', cases: ['102'], confidence: 0.85 },
  { id: 'V003', name: 'UP-14-EF-9012 (Mahindra Scorpio)', type: 'Vehicle', reg_number: 'UP-14-EF-9012', color: 'Black', cases: ['103'], confidence: 0.90 },
  { id: 'V004', name: 'MH-01-GH-3456 (Mercedes E-Class)', type: 'Vehicle', reg_number: 'MH-01-GH-3456', color: 'Grey', cases: ['104'], confidence: 0.92 },
  { id: 'V005', name: 'DL-03-IJ-7890 (Hyundai Creta)', type: 'Vehicle', reg_number: 'DL-03-IJ-7890', color: 'White', cases: ['105'], confidence: 0.87 },
  { id: 'V006', name: 'HR-26-KL-2345 (Tata Harrier)', type: 'Vehicle', reg_number: 'HR-26-KL-2345', color: 'Blue', cases: ['101', '102'], confidence: 0.86 },

  // 6 Locations
  { id: 'L001', name: 'Rohini, New Delhi', type: 'Location', lat: 28.7159, lon: 77.1171, state: 'Delhi', cases: ['101', '105'], confidence: 1.0 },
  { id: 'L002', name: 'Karol Bagh, New Delhi', type: 'Location', lat: 28.6517, lon: 77.1906, state: 'Delhi', cases: ['101'], confidence: 1.0 },
  { id: 'L003', name: 'Cyber City, Gurgaon', type: 'Location', lat: 28.4952, lon: 77.0895, state: 'Haryana', cases: ['102'], confidence: 1.0 },
  { id: 'L004', name: 'Okhla Phase III, New Delhi', type: 'Location', lat: 28.5355, lon: 77.2732, state: 'Delhi', cases: ['101', '105'], confidence: 1.0 },
  { id: 'L005', name: 'Partapur, Meerut, UP', type: 'Location', lat: 28.9845, lon: 77.7064, state: 'Uttar Pradesh', cases: ['103'], confidence: 1.0 },
  { id: 'L006', name: 'Andheri East, Mumbai', type: 'Location', lat: 19.1136, lon: 72.8697, state: 'Maharashtra', cases: ['104'], confidence: 1.0 },

  // 11 Phone Numbers
  { id: 'PH001', name: '+91-98110-44501', number: '+91-98110-44501', type: 'Phone', cases: ['101', '105'], confidence: 0.98 },
  { id: 'PH002', name: '+91-98765-32100', number: '+91-98765-32100', type: 'Phone', cases: ['101', '102', '103'], confidence: 0.97 },
  { id: 'PH003', name: '+91-70011-12345', number: '+91-70011-12345', type: 'Phone', cases: ['101'], confidence: 0.92 },
  { id: 'PH004', name: '+91-99300-67890', number: '+91-99300-67890', type: 'Phone', cases: ['102', '105'], confidence: 0.95 },
  { id: 'PH005', name: '+91-98290-11223', number: '+91-98290-11223', type: 'Phone', cases: ['103'], confidence: 0.91 },
  { id: 'PH006', name: '+91-98200-44556', number: '+91-98200-44556', type: 'Phone', cases: ['104'], confidence: 0.93 },
  { id: 'PH007', name: '+91-98100-77889', number: '+91-98100-77889', type: 'Phone', cases: ['105'], confidence: 0.96 },
  { id: 'PH008', name: '+91-98180-33445', number: '+91-98180-33445', type: 'Phone', cases: ['101', '103'], confidence: 0.89 },
  { id: 'PH009', name: '+91-98710-55667', number: '+91-98710-55667', type: 'Phone', cases: ['102'], confidence: 0.87 },
  { id: 'PH010', name: '+91-98210-99887', number: '+91-98210-99887', type: 'Phone', cases: ['104', '105'], confidence: 0.90 },
  { id: 'PH011', name: '+91-98110-99999', number: '+91-98110-99999', type: 'Phone', cases: ['102', '103'], confidence: 0.94 },

  // 11 Financial Accounts
  { id: 'A001', name: 'ICICI A/C 998877665544', account_number: '998877665544', bank: 'ICICI Bank', type: 'FinancialAccount', cases: ['101', '105'], confidence: 0.98 },
  { id: 'A002', name: 'HDFC A/C 112233445566', account_number: '112233445566', bank: 'HDFC Bank', type: 'FinancialAccount', cases: ['102'], confidence: 0.95 },
  { id: 'A003', name: 'ICICI A/C 112233445566778', account_number: '112233445566778', bank: 'ICICI Bank', type: 'FinancialAccount', cases: ['102', '105'], confidence: 0.97 },
  { id: 'A004', name: 'USDT Wallet 0x71C...3aB9', account_number: '0x71C...3aB9', bank: 'Tether DarkNet', type: 'FinancialAccount', cases: ['102'], confidence: 0.93 },
  { id: 'A005', name: 'SBI A/C 445566778899', account_number: '445566778899', bank: 'State Bank of India', type: 'FinancialAccount', cases: ['103'], confidence: 0.90 },
  { id: 'A006', name: 'Axis A/C 556677889900', account_number: '556677889900', bank: 'Axis Bank', type: 'FinancialAccount', cases: ['101'], confidence: 0.94 },
  { id: 'A007', name: 'Kotak A/C 667788990011', account_number: '667788990011', bank: 'Kotak Mahindra', type: 'FinancialAccount', cases: ['104'], confidence: 0.91 },
  { id: 'A008', name: 'Canara A/C 778899001122', account_number: '778899001122', bank: 'Canara Bank', type: 'FinancialAccount', cases: ['104'], confidence: 0.89 },
  { id: 'A009', name: 'Punjab National A/C 889900112233', account_number: '889900112233', bank: 'PNB', type: 'FinancialAccount', cases: ['105'], confidence: 0.92 },
  { id: 'A010', name: 'Bank of Baroda A/C 990011223344', account_number: '990011223344', bank: 'BOB', type: 'FinancialAccount', cases: ['105'], confidence: 0.90 },
  { id: 'A011', name: 'Hawala Ledger SMS-778', account_number: 'SMS-778', bank: 'Shroff Hawala Ledger', type: 'FinancialAccount', cases: ['105'], confidence: 0.96 },
];

// ─── 22 CANONICAL RELATIONSHIPS ───────────────────────────────────────────────
export const ALL_CANONICAL_EDGES = [
  { id: 'REL-001', source: 'P001', target: 'P002', type: 'ASSOCIATED_WITH', source_case: '101', confidence: 0.97, evidence: 'FIR 101/2025 records Vikram Singh operating as ground coordinator under Ravi Kumar.' },
  { id: 'REL-002', source: 'P001', target: 'P003', type: 'ASSOCIATED_WITH', source_case: '101', confidence: 0.92, evidence: 'Meena Sharma provided insider store layout to Ravi Kumar.' },
  { id: 'REL-003', source: 'P001', target: 'P008', type: 'ASSOCIATED_WITH', source_case: '101', confidence: 0.88, evidence: 'Manish Tiwari provided getaway transport for Ravi Kumar.' },
  { id: 'REL-004', source: 'P002', target: 'P004', type: 'COMMUNICATED_WITH', source_case: '102', confidence: 0.95, evidence: '18 encrypted calls between Vikram Singh and Aarav Mehta coordinating phishing inflows.' },
  { id: 'REL-005', source: 'P002', target: 'P009', type: 'ASSOCIATED_WITH', source_case: '102', confidence: 0.85, evidence: 'Sanjay Gupta provided mule bank accounts to Vikram Singh.' },
  { id: 'REL-006', source: 'P011', target: 'P002', type: 'COMMUNICATED_WITH', source_case: '102', confidence: 0.93, evidence: 'Burner phone +91-98110-99999 made 14 incoming calls to Vikram Singh during phishing wave.' },
  { id: 'REL-007', source: 'P011', target: 'P005', type: 'COMMUNICATED_WITH', source_case: '103', confidence: 0.91, evidence: 'Same burner phone +91-98110-99999 contacted arms procurement lead Suresh Yadav.' },
  { id: 'REL-008', source: 'P005', target: 'P008', type: 'ASSOCIATED_WITH', source_case: '103', confidence: 0.87, evidence: 'Manish Tiwari handled road transit on NH-58 for Suresh Yadav arms shipment.' },
  { id: 'REL-009', source: 'P006', target: 'P010', type: 'ASSOCIATED_WITH', source_case: '104', confidence: 0.90, evidence: 'Rohit Patel managed chassis stamping and delivery for Priya Nair auto syndicate.' },
  { id: 'REL-010', source: 'P001', target: 'P007', type: 'FINANCIAL_TRANSFER_TO', source_case: '105', confidence: 0.96, evidence: 'Extortion funds transferred via cash courier to Deepak Srivastava hawala hub.' },
  { id: 'REL-011', source: 'P004', target: 'P007', type: 'FINANCIAL_TRANSFER_TO', source_case: '105', confidence: 0.94, evidence: 'Crypto liquidation proceeds transferred to Shroff Hawala for cash pay-outs.' },
  { id: 'REL-012', source: 'P010', target: 'P007', type: 'FINANCIAL_TRANSFER_TO', source_case: '105', confidence: 0.89, evidence: 'Proceeds from cloned luxury cars deposited into Shroff Hawala book.' },
  { id: 'REL-013', source: 'P001', target: 'O001', type: 'OPERATES', source_case: '105', confidence: 0.98, evidence: 'Corporate filings establish Ravi Kumar as 100% beneficial owner of Apex Global Logistics.' },
  { id: 'REL-014', source: 'P004', target: 'O002', type: 'ASSOCIATED_WITH', source_case: '102', confidence: 0.88, evidence: 'Aarav Mehta manages master admin wallet on DarkNet Crypto Exchange.' },
  { id: 'REL-015', source: 'P005', target: 'O003', type: 'ASSOCIATED_WITH', source_case: '103', confidence: 0.90, evidence: 'Suresh Yadav operates North Star Arms Traders illicit network.' },
  { id: 'REL-016', source: 'P006', target: 'O004', type: 'OPERATES', source_case: '104', confidence: 0.92, evidence: 'Priya Nair is director of Luxe Motor Exports Pvt Ltd front entity.' },
  { id: 'REL-017', source: 'P007', target: 'O005', type: 'OPERATES', source_case: '105', confidence: 0.95, evidence: 'Deepak Srivastava operates Shroff Money Services unregistered hawala.' },
  { id: 'REL-018', source: 'O001', target: 'L004', type: 'LOCATED_AT', source_case: '101', confidence: 1.0, evidence: 'Apex Global Logistics physical warehouse at Okhla Phase III, New Delhi.' },
  { id: 'REL-019', source: 'P001', target: 'V001', type: 'OWNS', source_case: '101', confidence: 0.85, evidence: 'Vehicle DL-01-AB-1234 registered to Ravi Kumar.' },
  { id: 'REL-020', source: 'P002', target: 'V001', type: 'USES', source_case: '101', confidence: 0.80, evidence: 'Vikram Singh witnessed driving DL-01-AB-1234 during Case 101 getaway.' },
  { id: 'REL-021', source: 'P001', target: 'L001', type: 'LOCATED_AT', source_case: '101', confidence: 1.0, evidence: 'Residential address at Sector 7, Rohini, New Delhi.' },
  { id: 'REL-022', source: 'P004', target: 'L003', type: 'LOCATED_AT', source_case: '102', confidence: 1.0, evidence: 'Operating office at Cyber City, Gurgaon.' },
];

export const PERSONS = ALL_CANONICAL_NODES.filter(n => n.type === 'Person');
export const PHONES = ALL_CANONICAL_NODES.filter(n => n.type === 'Phone');
export const ORGANIZATIONS = ALL_CANONICAL_NODES.filter(n => n.type === 'Organization');
export const ACCOUNTS = ALL_CANONICAL_NODES.filter(n => n.type === 'FinancialAccount');
export const VEHICLES = ALL_CANONICAL_NODES.filter(n => n.type === 'Vehicle');
export const LOCATIONS = ALL_CANONICAL_NODES.filter(n => n.type === 'Location');
export const RELATIONSHIPS = ALL_CANONICAL_EDGES;
