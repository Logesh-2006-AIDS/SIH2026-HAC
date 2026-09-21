/* eslint-disable @typescript-eslint/no-explicit-any */
// Auto-generated complete mock store from live backend responses
export const MOCK_STORE: Record<string, any> = {
  "/api/v1/health": {
    "status": "UP",
    "version": "2.1.0",
    "uptime_seconds": 86400,
    "services": {
      "api": {
        "status": "UP",
        "details": "FastAPI Gateway v2.1 (Online)"
      },
      "postgresql": {
        "status": "UP",
        "details": "Evidence DB (Connected)"
      },
      "memgraph": {
        "status": "UP",
        "details": "Criminal Knowledge Graph (Connected)"
      },
      "nlp_pipeline": {
        "status": "UP",
        "details": "spaCy Legal NER (Ready)"
      },
      "data_mode": {
        "status": "UP",
        "details": "DEMO / OPERATIONAL"
      }
    }
  },
  "/api/v1/analyst/overview": {
    "memgraph_live": false,
    "data_mode": "FALLBACK",
    "label": "DEMO / FALLBACK DATA",
    "summary": {
      "total_cases": 5,
      "active_crime_zones": 4,
      "increasing_zones": 1,
      "decreasing_zones": 2,
      "repeated_crime_zones": 2,
      "cross_case_connections": 19,
      "important_network_entities": 11
    },
    "crime_trend_snapshot": [
      {
        "crime_type": "Extortion",
        "total": 1,
        "previous": 0,
        "current": 1,
        "change_pct": null,
        "direction": "increasing",
        "monthly": [
          {
            "month": "2025-04",
            "count": 1
          }
        ]
      },
      {
        "crime_type": "Cyber Fraud",
        "total": 1,
        "previous": 0,
        "current": 1,
        "change_pct": null,
        "direction": "increasing",
        "monthly": [
          {
            "month": "2025-05",
            "count": 1
          }
        ]
      },
      {
        "crime_type": "Arms Act 1959",
        "total": 1,
        "previous": 0,
        "current": 1,
        "change_pct": null,
        "direction": "increasing",
        "monthly": [
          {
            "month": "2025-06",
            "count": 1
          }
        ]
      },
      {
        "crime_type": "Organized Auto Theft",
        "total": 1,
        "previous": 0,
        "current": 1,
        "change_pct": null,
        "direction": "increasing",
        "monthly": [
          {
            "month": "2025-06",
            "count": 1
          }
        ]
      },
      {
        "crime_type": "PMLA 2002",
        "total": 1,
        "previous": 0,
        "current": 1,
        "change_pct": null,
        "direction": "increasing",
        "monthly": [
          {
            "month": "2025-07",
            "count": 1
          }
        ]
      }
    ],
    "geographic_intelligence": [
      {
        "name": "Delhi",
        "cases": 3,
        "trend": "decreasing",
        "band": "VERY_HIGH"
      },
      {
        "name": "Mumbai",
        "cases": 2,
        "trend": "stable",
        "band": "HIGH"
      },
      {
        "name": "Meerut",
        "cases": 1,
        "trend": "increasing",
        "band": "MEDIUM"
      },
      {
        "name": "Kolkata",
        "cases": 1,
        "trend": "decreasing",
        "band": "MEDIUM"
      }
    ],
    "key_patterns": [
      {
        "pattern_id": "PAT-LOC-delhi",
        "type": "Repeated Location",
        "title": "Repeated activity in Delhi",
        "what": "3 cases linked to Delhi",
        "where": "Delhi",
        "when": "2025-04 \u2192 2025-05 \u2192 2025-07",
        "case_count": 3,
        "cases": [
          "101",
          "102",
          "105"
        ],
        "entities": [],
        "trend": "decreasing",
        "why": "Multiple cases map to the same geographic region/location nodes in the dataset.",
        "evidence": [
          "Location registry",
          "FIR jurisdiction / incident locations"
        ],
        "confidence": 0.85,
        "confidence_reason": "Based on count of linked cases at this location (not a model score)."
      },
      {
        "pattern_id": "PAT-LOC-mumbai",
        "type": "Repeated Location",
        "title": "Repeated activity in Mumbai",
        "what": "2 cases linked to Mumbai",
        "where": "Mumbai",
        "when": "2025-05 \u2192 2025-06",
        "case_count": 2,
        "cases": [
          "102",
          "104"
        ],
        "entities": [],
        "trend": "stable",
        "why": "Multiple cases map to the same geographic region/location nodes in the dataset.",
        "evidence": [
          "Location registry",
          "FIR jurisdiction / incident locations"
        ],
        "confidence": 0.75,
        "confidence_reason": "Based on count of linked cases at this location (not a model score)."
      },
      {
        "pattern_id": "PAT-TREND-Extortion",
        "type": "Crime Trend",
        "title": "Extortion is increasing",
        "what": "Extortion: 0 \u2192 1 cases across comparison periods",
        "where": "Filtered geography",
        "when": "Period split of filtered incident dates",
        "case_count": 1,
        "cases": [],
        "entities": [],
        "trend": "increasing",
        "why": "Period comparison change_pct=None",
        "evidence": [
          "Case incident_date",
          "crime_category"
        ],
        "confidence": 0.5,
        "confidence_reason": "Derived from period case counts only."
      },
      {
        "pattern_id": "PAT-TREND-Cyber_Fraud",
        "type": "Crime Trend",
        "title": "Cyber Fraud is increasing",
        "what": "Cyber Fraud: 0 \u2192 1 cases across comparison periods",
        "where": "Filtered geography",
        "when": "Period split of filtered incident dates",
        "case_count": 1,
        "cases": [],
        "entities": [],
        "trend": "increasing",
        "why": "Period comparison change_pct=None",
        "evidence": [
          "Case incident_date",
          "crime_category"
        ],
        "confidence": 0.5,
        "confidence_reason": "Derived from period case counts only."
      },
      {
        "pattern_id": "PAT-TREND-Arms_Act_195",
        "type": "Crime Trend",
        "title": "Arms Act 1959 is increasing",
        "what": "Arms Act 1959: 0 \u2192 1 cases across comparison periods",
        "where": "Filtered geography",
        "when": "Period split of filtered incident dates",
        "case_count": 1,
        "cases": [],
        "entities": [],
        "trend": "increasing",
        "why": "Period comparison change_pct=None",
        "evidence": [
          "Case incident_date",
          "crime_category"
        ],
        "confidence": 0.5,
        "confidence_reason": "Derived from period case counts only."
      }
    ],
    "cross_case_signals": [
      {
        "cluster_id": "Person-P002",
        "shared_entity": {
          "id": "P002",
          "name": "Vikram Singh",
          "type": "Person"
        },
        "related_cases": [
          "101",
          "102",
          "103"
        ],
        "connection_strength": "HIGH",
        "evidence": "FIR / entity registry",
        "shared": {
          "people": [
            {
              "id": "P002",
              "name": "Vikram Singh"
            },
            {
              "id": "P008",
              "name": "Manish Tiwari"
            },
            {
              "id": "P011",
              "name": "Unknown (Burner)"
            }
          ],
          "phones": [
            {
              "id": "+91-98765-32100",
              "name": "+91-98765-32100"
            },
            {
              "id": "+91-87654-32100",
              "name": "+91-87654-32100"
            },
            {
              "id": "+91-98110-99999",
              "name": "+91-98110-99999"
            },
            {
              "id": "+91-98765-32101",
              "name": "+91-98765-32101"
            }
          ],
          "vehicles": [
            {
              "id": "V005",
              "name": "DL-05-XY-7890"
            }
          ],
          "organizations": [],
          "locations": []
        }
      },
      {
        "cluster_id": "Phone-+91-98765-32100",
        "shared_entity": {
          "id": "+91-98765-32100",
          "name": "+91-98765-32100",
          "type": "Phone"
        },
        "related_cases": [
          "101",
          "102",
          "103"
        ],
        "connection_strength": "HIGH",
        "evidence": "CDR / phone registry",
        "shared": {
          "people": [
            {
              "id": "P002",
              "name": "Vikram Singh"
            },
            {
              "id": "P008",
              "name": "Manish Tiwari"
            },
            {
              "id": "P011",
              "name": "Unknown (Burner)"
            }
          ],
          "phones": [
            {
              "id": "+91-98765-32100",
              "name": "+91-98765-32100"
            },
            {
              "id": "+91-87654-32100",
              "name": "+91-87654-32100"
            },
            {
              "id": "+91-98110-99999",
              "name": "+91-98110-99999"
            },
            {
              "id": "+91-98765-32101",
              "name": "+91-98765-32101"
            }
          ],
          "vehicles": [
            {
              "id": "V005",
              "name": "DL-05-XY-7890"
            }
          ],
          "organizations": [],
          "locations": []
        }
      },
      {
        "cluster_id": "Phone-+91-98765-32101",
        "shared_entity": {
          "id": "+91-98765-32101",
          "name": "+91-98765-32101",
          "type": "Phone"
        },
        "related_cases": [
          "101",
          "102",
          "103"
        ],
        "connection_strength": "HIGH",
        "evidence": "CDR / phone registry",
        "shared": {
          "people": [
            {
              "id": "P002",
              "name": "Vikram Singh"
            },
            {
              "id": "P008",
              "name": "Manish Tiwari"
            },
            {
              "id": "P011",
              "name": "Unknown (Burner)"
            }
          ],
          "phones": [
            {
              "id": "+91-98765-32100",
              "name": "+91-98765-32100"
            },
            {
              "id": "+91-87654-32100",
              "name": "+91-87654-32100"
            },
            {
              "id": "+91-98110-99999",
              "name": "+91-98110-99999"
            },
            {
              "id": "+91-98765-32101",
              "name": "+91-98765-32101"
            }
          ],
          "vehicles": [
            {
              "id": "V005",
              "name": "DL-05-XY-7890"
            }
          ],
          "organizations": [],
          "locations": []
        }
      },
      {
        "cluster_id": "Person-P001",
        "shared_entity": {
          "id": "P001",
          "name": "Ravi Kumar",
          "type": "Person"
        },
        "related_cases": [
          "101",
          "105"
        ],
        "connection_strength": "MEDIUM",
        "evidence": "FIR / entity registry",
        "shared": {
          "people": [
            {
              "id": "P001",
              "name": "Ravi Kumar"
            }
          ],
          "phones": [
            {
              "id": "+91-98110-44501",
              "name": "+91-98110-44501"
            },
            {
              "id": "+91-98110-44502",
              "name": "+91-98110-44502"
            }
          ],
          "vehicles": [],
          "organizations": [
            {
              "id": "O001",
              "name": "Apex Global Logistics Pvt Ltd"
            }
          ],
          "locations": [
            {
              "id": "L002",
              "name": "Karol Bagh, New Delhi"
            },
            {
              "id": "L004",
              "name": "Okhla Industrial Area, Delhi"
            }
          ]
        }
      }
    ],
    "period": {
      "previous": "2025-04-12 \u2192 2025-05-28",
      "current": "2025-06-08 \u2192 2025-07-05",
      "previous_case_count": 2,
      "current_case_count": 3
    },
    "filters": {
      "crime_type": "All",
      "start": null,
      "end": null,
      "geography": "All",
      "status": "All",
      "geography_level": "city"
    },
    "crime_types": [
      "Arms Act 1959",
      "Cyber Fraud",
      "Extortion",
      "Organized Auto Theft",
      "PMLA 2002"
    ],
    "geographies": [
      "Delhi",
      "Maharashtra",
      "Uttar Pradesh",
      "West Bengal"
    ]
  },
  "/api/v1/analyst/heatmap": {
    "memgraph_live": false,
    "data_mode": "FALLBACK",
    "label": "DEMO / FALLBACK DATA",
    "mode": "density",
    "mode_meta": {
      "title": "Crime Density",
      "legend": [
        "LOW",
        "MEDIUM",
        "HIGH",
        "VERY_HIGH"
      ],
      "explanation": "Intensity = region case count / max region case count in the filtered set."
    },
    "filters": {
      "crime_type": "All",
      "start": null,
      "end": null,
      "geography": "All",
      "status": "All",
      "geography_level": "city"
    },
    "period": {
      "previous": "2025-04-12 \u2192 2025-05-28",
      "current": "2025-06-08 \u2192 2025-07-05",
      "previous_case_count": 2,
      "current_case_count": 3
    },
    "totals": {
      "regions": 4,
      "visible_regions": 4,
      "cases": 5,
      "max_density": 3,
      "recorded_coordinate_points": 8
    },
    "spatial_precision": {
      "primary_mode": "point_heatmap",
      "recorded_coordinate_points": 8,
      "unlocated_cases": 0,
      "description": "Point heatmap uses only latitude/longitude recorded on source location entities. Region density aggregates state labels from case and location data."
    },
    "regions": [
      {
        "id": "delhi",
        "name": "Delhi",
        "state": "Delhi",
        "city": "Delhi",
        "lat": 28.7041,
        "lon": 77.1025,
        "case_count": 3,
        "cases": [
          "101",
          "102",
          "105"
        ],
        "prev_count": 2,
        "curr_count": 1,
        "change_pct": -50.0,
        "trend": "decreasing",
        "density": {
          "intensity": 1.0,
          "band": "VERY_HIGH",
          "label": "Very High"
        },
        "repeated": true,
        "months_covered": [
          "2025-04",
          "2025-05",
          "2025-07"
        ],
        "sub_locations": [
          {
            "id": "L001",
            "name": "Rohini, New Delhi",
            "case_count": 1,
            "cases": [
              "101"
            ]
          },
          {
            "id": "L002",
            "name": "Karol Bagh, New Delhi",
            "case_count": 2,
            "cases": [
              "101",
              "105"
            ]
          },
          {
            "id": "L004",
            "name": "Okhla Industrial Area, Delhi",
            "case_count": 2,
            "cases": [
              "101",
              "105"
            ]
          },
          {
            "id": "L007",
            "name": "Pahar Ganj, New Delhi",
            "case_count": 1,
            "cases": [
              "105"
            ]
          }
        ],
        "visible": true,
        "display_value": 3,
        "display_band": "VERY_HIGH"
      },
      {
        "id": "mumbai",
        "name": "Mumbai",
        "state": "Maharashtra",
        "city": "Mumbai",
        "lat": 19.0596,
        "lon": 72.8295,
        "case_count": 2,
        "cases": [
          "102",
          "104"
        ],
        "prev_count": 1,
        "curr_count": 1,
        "change_pct": 0.0,
        "trend": "stable",
        "density": {
          "intensity": 0.667,
          "band": "HIGH",
          "label": "High"
        },
        "repeated": true,
        "months_covered": [
          "2025-05",
          "2025-06"
        ],
        "sub_locations": [
          {
            "id": "L003",
            "name": "Bandra West, Mumbai",
            "case_count": 1,
            "cases": [
              "102"
            ]
          },
          {
            "id": "L006",
            "name": "Andheri East, Mumbai",
            "case_count": 1,
            "cases": [
              "104"
            ]
          }
        ],
        "visible": true,
        "display_value": 2,
        "display_band": "HIGH"
      },
      {
        "id": "meerut",
        "name": "Meerut",
        "state": "Uttar Pradesh",
        "city": "Meerut",
        "lat": 28.9845,
        "lon": 77.7064,
        "case_count": 1,
        "cases": [
          "103"
        ],
        "prev_count": 0,
        "curr_count": 1,
        "change_pct": null,
        "trend": "increasing",
        "density": {
          "intensity": 0.333,
          "band": "MEDIUM",
          "label": "Medium"
        },
        "repeated": false,
        "months_covered": [
          "2025-06"
        ],
        "sub_locations": [
          {
            "id": "L005",
            "name": "Meerut, Uttar Pradesh",
            "case_count": 1,
            "cases": [
              "103"
            ]
          }
        ],
        "visible": true,
        "display_value": 1,
        "display_band": "MEDIUM"
      },
      {
        "id": "kolkata",
        "name": "Kolkata",
        "state": "West Bengal",
        "city": "Kolkata",
        "lat": 22.5726,
        "lon": 88.3639,
        "case_count": 1,
        "cases": [
          "102"
        ],
        "prev_count": 1,
        "curr_count": 0,
        "change_pct": -100.0,
        "trend": "decreasing",
        "density": {
          "intensity": 0.333,
          "band": "MEDIUM",
          "label": "Medium"
        },
        "repeated": false,
        "months_covered": [
          "2025-05"
        ],
        "sub_locations": [
          {
            "id": "L008",
            "name": "Salt Lake City, Kolkata",
            "case_count": 1,
            "cases": [
              "102"
            ]
          }
        ],
        "visible": true,
        "display_value": 1,
        "display_band": "MEDIUM"
      }
    ],
    "points": [
      {
        "id": "L001",
        "name": "Rohini, New Delhi",
        "state": "Delhi",
        "city": "Delhi",
        "lat": 28.7041,
        "lon": 77.1025,
        "case_count": 1,
        "cases": [
          {
            "case_number": "101",
            "title": "Armed Robbery & Extortion Syndicate (M/s Royal Jewellers)",
            "crime_category": "Extortion / Armed Robbery / MCOCA",
            "incident_date": "2025-04-12T21:00:00Z",
            "status": "UNDER_INVESTIGATION"
          }
        ]
      },
      {
        "id": "L002",
        "name": "Karol Bagh, New Delhi",
        "state": "Delhi",
        "city": "Delhi",
        "lat": 28.6511,
        "lon": 77.1907,
        "case_count": 2,
        "cases": [
          {
            "case_number": "101",
            "title": "Armed Robbery & Extortion Syndicate (M/s Royal Jewellers)",
            "crime_category": "Extortion / Armed Robbery / MCOCA",
            "incident_date": "2025-04-12T21:00:00Z",
            "status": "UNDER_INVESTIGATION"
          },
          {
            "case_number": "105",
            "title": "Commercial Hawala Operations & Shell Company Layering",
            "crime_category": "PMLA 2002 / FEMA / Hawala",
            "incident_date": "2025-07-05T10:00:00Z",
            "status": "UNDER_INVESTIGATION"
          }
        ]
      },
      {
        "id": "L003",
        "name": "Bandra West, Mumbai",
        "state": "Maharashtra",
        "city": "Mumbai",
        "lat": 19.0596,
        "lon": 72.8295,
        "case_count": 1,
        "cases": [
          {
            "case_number": "102",
            "title": "Cyber Phishing & Darknet Crypto Laundering Ring",
            "crime_category": "Cyber Fraud / PMLA 2002 / IT Act",
            "incident_date": "2025-05-28T15:00:00Z",
            "status": "UNDER_INVESTIGATION"
          }
        ]
      },
      {
        "id": "L004",
        "name": "Okhla Industrial Area, Delhi",
        "state": "Delhi",
        "city": "Delhi",
        "lat": 28.5355,
        "lon": 77.271,
        "case_count": 2,
        "cases": [
          {
            "case_number": "101",
            "title": "Armed Robbery & Extortion Syndicate (M/s Royal Jewellers)",
            "crime_category": "Extortion / Armed Robbery / MCOCA",
            "incident_date": "2025-04-12T21:00:00Z",
            "status": "UNDER_INVESTIGATION"
          },
          {
            "case_number": "105",
            "title": "Commercial Hawala Operations & Shell Company Layering",
            "crime_category": "PMLA 2002 / FEMA / Hawala",
            "incident_date": "2025-07-05T10:00:00Z",
            "status": "UNDER_INVESTIGATION"
          }
        ]
      },
      {
        "id": "L005",
        "name": "Meerut, Uttar Pradesh",
        "state": "Uttar Pradesh",
        "city": "Meerut",
        "lat": 28.9845,
        "lon": 77.7064,
        "case_count": 1,
        "cases": [
          {
            "case_number": "103",
            "title": "Illicit Firearms Smuggling (NH-58 Transit Interception)",
            "crime_category": "Arms Act 1959 / UAPA / Conspiracy",
            "incident_date": "2025-06-08T23:30:00Z",
            "status": "UNDER_INVESTIGATION"
          }
        ]
      },
      {
        "id": "L006",
        "name": "Andheri East, Mumbai",
        "state": "Maharashtra",
        "city": "Mumbai",
        "lat": 19.1136,
        "lon": 72.8697,
        "case_count": 1,
        "cases": [
          {
            "case_number": "104",
            "title": "Inter-State Luxury Vehicle Theft & Plate Cloning Syndicate",
            "crime_category": "Organized Auto Theft / Cheating",
            "incident_date": "2025-06-22T16:00:00Z",
            "status": "UNDER_INVESTIGATION"
          }
        ]
      },
      {
        "id": "L007",
        "name": "Pahar Ganj, New Delhi",
        "state": "Delhi",
        "city": "Delhi",
        "lat": 28.6432,
        "lon": 77.212,
        "case_count": 1,
        "cases": [
          {
            "case_number": "105",
            "title": "Commercial Hawala Operations & Shell Company Layering",
            "crime_category": "PMLA 2002 / FEMA / Hawala",
            "incident_date": "2025-07-05T10:00:00Z",
            "status": "UNDER_INVESTIGATION"
          }
        ]
      },
      {
        "id": "L008",
        "name": "Salt Lake City, Kolkata",
        "state": "West Bengal",
        "city": "Kolkata",
        "lat": 22.5726,
        "lon": 88.3639,
        "case_count": 1,
        "cases": [
          {
            "case_number": "102",
            "title": "Cyber Phishing & Darknet Crypto Laundering Ring",
            "crime_category": "Cyber Fraud / PMLA 2002 / IT Act",
            "incident_date": "2025-05-28T15:00:00Z",
            "status": "UNDER_INVESTIGATION"
          }
        ]
      }
    ],
    "crime_types": [
      "Arms Act 1959",
      "Cyber Fraud",
      "Extortion",
      "Organized Auto Theft",
      "PMLA 2002"
    ],
    "geographies": [
      "Delhi",
      "Maharashtra",
      "Uttar Pradesh",
      "West Bengal"
    ]
  },
  "/api/v1/admin/overview": {
    "data_mode": "DEMO DATA",
    "metrics": {
      "users": 12,
      "cases": 5,
      "entities": 51,
      "relationships": 31
    },
    "jobs": {
      "pending": 0,
      "failed": 0
    },
    "graph": {
      "status": "UP",
      "node_count": 51,
      "relationship_count": 31,
      "data_mode": "DEMO / ACTIVE",
      "last_successful_query": "Just now",
      "last_synchronization": "2026-09-20 14:00:00 IST",
      "import_status": "COMPLETED"
    },
    "nlp": {
      "documents_processed": 14,
      "entities_extracted": 142,
      "relationships_extracted": 68,
      "pending_documents": 0,
      "failed_documents": 0,
      "average_entity_confidence": "94.2%"
    }
  },
  "/api/v1/admin/users": {
    "items": [
      {
        "id": 1,
        "full_name": "Insp. Rajesh Vardhan",
        "email": "investigator@police.gov.in",
        "badge_number": "DL-CB-9021",
        "role": "INVESTIGATOR",
        "is_active": true,
        "last_activity": "2026-09-20T14:30:00Z",
        "department": "Special Crime Branch"
      },
      {
        "id": 2,
        "full_name": "Dr. Priya Sankar",
        "email": "analyst@police.gov.in",
        "badge_number": "INT-908",
        "role": "ANALYST",
        "is_active": true,
        "last_activity": "2026-09-20T13:45:00Z",
        "department": "Intelligence & Analytics"
      },
      {
        "id": 3,
        "full_name": "Superintendent K. Rao",
        "email": "admin@police.gov.in",
        "badge_number": "HQ-001",
        "role": "ADMIN",
        "is_active": true,
        "last_activity": "2026-09-20T11:20:00Z",
        "department": "Headquarters"
      },
      {
        "id": 4,
        "full_name": "Sub-Insp. Amit Patel",
        "email": "amit.patel@police.gov.in",
        "badge_number": "MH-CR-4412",
        "role": "INVESTIGATOR",
        "is_active": true,
        "last_activity": "2026-09-19T18:00:00Z",
        "department": "Cyber Narcotics Unit"
      }
    ]
  },
  "/api/v1/admin/imports": {
    "items": [
      {
        "id": 1,
        "filename": "FIR_101_Arms_Smuggling.pdf",
        "source_type": "FIR_REPORT",
        "status": "COMPLETED",
        "rows_processed": 42,
        "ingested_at": "2026-09-20T09:15:00Z",
        "error": null,
        "reprocess_supported": true
      },
      {
        "id": 2,
        "filename": "CDR_98765_Delhi_Network.csv",
        "source_type": "CDR_IMPORT",
        "status": "COMPLETED",
        "rows_processed": 128,
        "ingested_at": "2026-09-20T10:00:00Z",
        "error": null,
        "reprocess_supported": true
      },
      {
        "id": 3,
        "filename": "Hawala_Transactions_2025.json",
        "source_type": "FINANCIAL_FEED",
        "status": "COMPLETED",
        "rows_processed": 87,
        "ingested_at": "2026-09-19T16:20:00Z",
        "error": null,
        "reprocess_supported": true
      }
    ]
  },
  "/api/v1/admin/audit": {
    "items": [
      {
        "id": 1,
        "timestamp": "2026-09-20T14:02:00Z",
        "user": "investigator@police.gov.in",
        "action": "STATION_LOGIN",
        "resource": "/dashboard",
        "status": "RECORDED",
        "ip_address": "10.0.4.18"
      },
      {
        "id": 2,
        "timestamp": "2026-09-20T13:45:00Z",
        "user": "analyst@police.gov.in",
        "action": "EXPORT_INTEL_REPORT",
        "resource": "/analyst/trends",
        "status": "RECORDED",
        "ip_address": "10.0.4.22"
      },
      {
        "id": 3,
        "timestamp": "2026-09-20T12:10:00Z",
        "user": "admin@police.gov.in",
        "action": "ACCESS_LEVEL_SYNC",
        "resource": "role:INVESTIGATOR",
        "status": "COMPLETED",
        "ip_address": "10.0.1.1"
      }
    ]
  },
  "/api/v1/admin/roles": {
    "roles": [
      {
        "role": "INVESTIGATOR",
        "permissions": [
          "View Case Dossiers",
          "Pinboard & Evidence Linking",
          "Run Red-String Path Finding",
          "Inspect Suspect Details",
          "Submit Investigation Reports"
        ]
      },
      {
        "role": "ANALYST",
        "permissions": [
          "Access Cross-Case Intelligence",
          "Generate Crime Heatmaps & Density",
          "Graph Centrality & Community Detection",
          "Synthesize Leads for Field Officers"
        ]
      },
      {
        "role": "ADMIN",
        "permissions": [
          "User & Credential Management",
          "Pipeline & Database Sync Oversight",
          "Audit Logging & Evidence Chain Verification",
          "System Integrity Controls"
        ]
      }
    ]
  },
  "/api/v1/analyst/trends": {
    "memgraph_live": false,
    "data_mode": "FALLBACK",
    "label": "DEMO / FALLBACK DATA",
    "series": [
      {
        "month": "2025-04",
        "count": 1
      },
      {
        "month": "2025-05",
        "count": 1
      },
      {
        "month": "2025-06",
        "count": 2
      },
      {
        "month": "2025-07",
        "count": 1
      }
    ],
    "by_type": [
      {
        "crime_type": "Extortion",
        "total": 1,
        "previous": 0,
        "current": 1,
        "change_pct": null,
        "direction": "increasing",
        "monthly": [
          {
            "month": "2025-04",
            "count": 1
          }
        ]
      },
      {
        "crime_type": "Cyber Fraud",
        "total": 1,
        "previous": 0,
        "current": 1,
        "change_pct": null,
        "direction": "increasing",
        "monthly": [
          {
            "month": "2025-05",
            "count": 1
          }
        ]
      },
      {
        "crime_type": "Arms Act 1959",
        "total": 1,
        "previous": 0,
        "current": 1,
        "change_pct": null,
        "direction": "increasing",
        "monthly": [
          {
            "month": "2025-06",
            "count": 1
          }
        ]
      },
      {
        "crime_type": "Organized Auto Theft",
        "total": 1,
        "previous": 0,
        "current": 1,
        "change_pct": null,
        "direction": "increasing",
        "monthly": [
          {
            "month": "2025-06",
            "count": 1
          }
        ]
      },
      {
        "crime_type": "PMLA 2002",
        "total": 1,
        "previous": 0,
        "current": 1,
        "change_pct": null,
        "direction": "increasing",
        "monthly": [
          {
            "month": "2025-07",
            "count": 1
          }
        ]
      }
    ],
    "selected_type": null,
    "top_regions": [
      {
        "name": "Delhi",
        "cases": 3,
        "trend": "decreasing"
      },
      {
        "name": "Mumbai",
        "cases": 2,
        "trend": "stable"
      },
      {
        "name": "Meerut",
        "cases": 1,
        "trend": "increasing"
      },
      {
        "name": "Kolkata",
        "cases": 1,
        "trend": "decreasing"
      }
    ],
    "increasing": [
      {
        "crime_type": "Extortion",
        "total": 1,
        "previous": 0,
        "current": 1,
        "change_pct": null,
        "direction": "increasing",
        "monthly": [
          {
            "month": "2025-04",
            "count": 1
          }
        ]
      },
      {
        "crime_type": "Cyber Fraud",
        "total": 1,
        "previous": 0,
        "current": 1,
        "change_pct": null,
        "direction": "increasing",
        "monthly": [
          {
            "month": "2025-05",
            "count": 1
          }
        ]
      },
      {
        "crime_type": "Arms Act 1959",
        "total": 1,
        "previous": 0,
        "current": 1,
        "change_pct": null,
        "direction": "increasing",
        "monthly": [
          {
            "month": "2025-06",
            "count": 1
          }
        ]
      },
      {
        "crime_type": "Organized Auto Theft",
        "total": 1,
        "previous": 0,
        "current": 1,
        "change_pct": null,
        "direction": "increasing",
        "monthly": [
          {
            "month": "2025-06",
            "count": 1
          }
        ]
      },
      {
        "crime_type": "PMLA 2002",
        "total": 1,
        "previous": 0,
        "current": 1,
        "change_pct": null,
        "direction": "increasing",
        "monthly": [
          {
            "month": "2025-07",
            "count": 1
          }
        ]
      }
    ],
    "decreasing": [],
    "stable": []
  },
  "/api/v1/analyst/cross-case": {
    "memgraph_live": false,
    "data_mode": "FALLBACK",
    "label": "DEMO / FALLBACK DATA",
    "total_links": 19,
    "clusters": [
      {
        "cluster_id": "Person-P002",
        "shared_entity": {
          "id": "P002",
          "name": "Vikram Singh",
          "type": "Person"
        },
        "related_cases": [
          "101",
          "102",
          "103"
        ],
        "connection_strength": "HIGH",
        "evidence": "FIR / entity registry",
        "shared": {
          "people": [
            {
              "id": "P002",
              "name": "Vikram Singh"
            },
            {
              "id": "P008",
              "name": "Manish Tiwari"
            },
            {
              "id": "P011",
              "name": "Unknown (Burner)"
            }
          ],
          "phones": [
            {
              "id": "+91-98765-32100",
              "name": "+91-98765-32100"
            },
            {
              "id": "+91-87654-32100",
              "name": "+91-87654-32100"
            },
            {
              "id": "+91-98110-99999",
              "name": "+91-98110-99999"
            },
            {
              "id": "+91-98765-32101",
              "name": "+91-98765-32101"
            }
          ],
          "vehicles": [
            {
              "id": "V005",
              "name": "DL-05-XY-7890"
            }
          ],
          "organizations": [],
          "locations": []
        }
      },
      {
        "cluster_id": "Phone-+91-98765-32100",
        "shared_entity": {
          "id": "+91-98765-32100",
          "name": "+91-98765-32100",
          "type": "Phone"
        },
        "related_cases": [
          "101",
          "102",
          "103"
        ],
        "connection_strength": "HIGH",
        "evidence": "CDR / phone registry",
        "shared": {
          "people": [
            {
              "id": "P002",
              "name": "Vikram Singh"
            },
            {
              "id": "P008",
              "name": "Manish Tiwari"
            },
            {
              "id": "P011",
              "name": "Unknown (Burner)"
            }
          ],
          "phones": [
            {
              "id": "+91-98765-32100",
              "name": "+91-98765-32100"
            },
            {
              "id": "+91-87654-32100",
              "name": "+91-87654-32100"
            },
            {
              "id": "+91-98110-99999",
              "name": "+91-98110-99999"
            },
            {
              "id": "+91-98765-32101",
              "name": "+91-98765-32101"
            }
          ],
          "vehicles": [
            {
              "id": "V005",
              "name": "DL-05-XY-7890"
            }
          ],
          "organizations": [],
          "locations": []
        }
      },
      {
        "cluster_id": "Phone-+91-98765-32101",
        "shared_entity": {
          "id": "+91-98765-32101",
          "name": "+91-98765-32101",
          "type": "Phone"
        },
        "related_cases": [
          "101",
          "102",
          "103"
        ],
        "connection_strength": "HIGH",
        "evidence": "CDR / phone registry",
        "shared": {
          "people": [
            {
              "id": "P002",
              "name": "Vikram Singh"
            },
            {
              "id": "P008",
              "name": "Manish Tiwari"
            },
            {
              "id": "P011",
              "name": "Unknown (Burner)"
            }
          ],
          "phones": [
            {
              "id": "+91-98765-32100",
              "name": "+91-98765-32100"
            },
            {
              "id": "+91-87654-32100",
              "name": "+91-87654-32100"
            },
            {
              "id": "+91-98110-99999",
              "name": "+91-98110-99999"
            },
            {
              "id": "+91-98765-32101",
              "name": "+91-98765-32101"
            }
          ],
          "vehicles": [
            {
              "id": "V005",
              "name": "DL-05-XY-7890"
            }
          ],
          "organizations": [],
          "locations": []
        }
      },
      {
        "cluster_id": "Person-P001",
        "shared_entity": {
          "id": "P001",
          "name": "Ravi Kumar",
          "type": "Person"
        },
        "related_cases": [
          "101",
          "105"
        ],
        "connection_strength": "MEDIUM",
        "evidence": "FIR / entity registry",
        "shared": {
          "people": [
            {
              "id": "P001",
              "name": "Ravi Kumar"
            }
          ],
          "phones": [
            {
              "id": "+91-98110-44501",
              "name": "+91-98110-44501"
            },
            {
              "id": "+91-98110-44502",
              "name": "+91-98110-44502"
            }
          ],
          "vehicles": [],
          "organizations": [
            {
              "id": "O001",
              "name": "Apex Global Logistics Pvt Ltd"
            }
          ],
          "locations": [
            {
              "id": "L002",
              "name": "Karol Bagh, New Delhi"
            },
            {
              "id": "L004",
              "name": "Okhla Industrial Area, Delhi"
            }
          ]
        }
      },
      {
        "cluster_id": "Person-P004",
        "shared_entity": {
          "id": "P004",
          "name": "Aarav Mehta",
          "type": "Person"
        },
        "related_cases": [
          "102",
          "105"
        ],
        "connection_strength": "MEDIUM",
        "evidence": "FIR / entity registry",
        "shared": {
          "people": [
            {
              "id": "P004",
              "name": "Aarav Mehta"
            }
          ],
          "phones": [
            {
              "id": "+91-99300-67890",
              "name": "+91-99300-67890"
            },
            {
              "id": "+91-99300-67891",
              "name": "+91-99300-67891"
            }
          ],
          "vehicles": [],
          "organizations": [],
          "locations": []
        }
      },
      {
        "cluster_id": "Person-P008",
        "shared_entity": {
          "id": "P008",
          "name": "Manish Tiwari",
          "type": "Person"
        },
        "related_cases": [
          "101",
          "103"
        ],
        "connection_strength": "MEDIUM",
        "evidence": "FIR / entity registry",
        "shared": {
          "people": [
            {
              "id": "P002",
              "name": "Vikram Singh"
            },
            {
              "id": "P008",
              "name": "Manish Tiwari"
            }
          ],
          "phones": [
            {
              "id": "+91-98765-32100",
              "name": "+91-98765-32100"
            },
            {
              "id": "+91-87654-32100",
              "name": "+91-87654-32100"
            },
            {
              "id": "+91-98765-32101",
              "name": "+91-98765-32101"
            }
          ],
          "vehicles": [
            {
              "id": "V005",
              "name": "DL-05-XY-7890"
            }
          ],
          "organizations": [],
          "locations": []
        }
      },
      {
        "cluster_id": "Person-P010",
        "shared_entity": {
          "id": "P010",
          "name": "Rohit Patel",
          "type": "Person"
        },
        "related_cases": [
          "104",
          "105"
        ],
        "connection_strength": "MEDIUM",
        "evidence": "FIR / entity registry",
        "shared": {
          "people": [
            {
              "id": "P010",
              "name": "Rohit Patel"
            }
          ],
          "phones": [
            {
              "id": "+91-96000-12345",
              "name": "+91-96000-12345"
            }
          ],
          "vehicles": [],
          "organizations": [],
          "locations": []
        }
      },
      {
        "cluster_id": "Person-P011",
        "shared_entity": {
          "id": "P011",
          "name": "Unknown (Burner)",
          "type": "Person"
        },
        "related_cases": [
          "102",
          "103"
        ],
        "connection_strength": "MEDIUM",
        "evidence": "FIR / entity registry",
        "shared": {
          "people": [
            {
              "id": "P002",
              "name": "Vikram Singh"
            },
            {
              "id": "P011",
              "name": "Unknown (Burner)"
            }
          ],
          "phones": [
            {
              "id": "+91-98765-32100",
              "name": "+91-98765-32100"
            },
            {
              "id": "+91-98110-99999",
              "name": "+91-98110-99999"
            },
            {
              "id": "+91-98765-32101",
              "name": "+91-98765-32101"
            }
          ],
          "vehicles": [],
          "organizations": [],
          "locations": []
        }
      },
      {
        "cluster_id": "Organization-O001",
        "shared_entity": {
          "id": "O001",
          "name": "Apex Global Logistics Pvt Ltd",
          "type": "Organization"
        },
        "related_cases": [
          "101",
          "105"
        ],
        "connection_strength": "MEDIUM",
        "evidence": "Company / shell registry",
        "shared": {
          "people": [
            {
              "id": "P001",
              "name": "Ravi Kumar"
            }
          ],
          "phones": [
            {
              "id": "+91-98110-44501",
              "name": "+91-98110-44501"
            },
            {
              "id": "+91-98110-44502",
              "name": "+91-98110-44502"
            }
          ],
          "vehicles": [],
          "organizations": [
            {
              "id": "O001",
              "name": "Apex Global Logistics Pvt Ltd"
            }
          ],
          "locations": [
            {
              "id": "L002",
              "name": "Karol Bagh, New Delhi"
            },
            {
              "id": "L004",
              "name": "Okhla Industrial Area, Delhi"
            }
          ]
        }
      },
      {
        "cluster_id": "Vehicle-V005",
        "shared_entity": {
          "id": "V005",
          "name": "DL-05-XY-7890",
          "type": "Vehicle"
        },
        "related_cases": [
          "101",
          "103"
        ],
        "connection_strength": "MEDIUM",
        "evidence": "Vehicle registry",
        "shared": {
          "people": [
            {
              "id": "P002",
              "name": "Vikram Singh"
            },
            {
              "id": "P008",
              "name": "Manish Tiwari"
            }
          ],
          "phones": [
            {
              "id": "+91-98765-32100",
              "name": "+91-98765-32100"
            },
            {
              "id": "+91-87654-32100",
              "name": "+91-87654-32100"
            },
            {
              "id": "+91-98765-32101",
              "name": "+91-98765-32101"
            }
          ],
          "vehicles": [
            {
              "id": "V005",
              "name": "DL-05-XY-7890"
            }
          ],
          "organizations": [],
          "locations": []
        }
      },
      {
        "cluster_id": "Location-L002",
        "shared_entity": {
          "id": "L002",
          "name": "Karol Bagh, New Delhi",
          "type": "Location"
        },
        "related_cases": [
          "101",
          "105"
        ],
        "connection_strength": "MEDIUM",
        "evidence": "Incident location",
        "shared": {
          "people": [
            {
              "id": "P001",
              "name": "Ravi Kumar"
            }
          ],
          "phones": [
            {
              "id": "+91-98110-44501",
              "name": "+91-98110-44501"
            },
            {
              "id": "+91-98110-44502",
              "name": "+91-98110-44502"
            }
          ],
          "vehicles": [],
          "organizations": [
            {
              "id": "O001",
              "name": "Apex Global Logistics Pvt Ltd"
            }
          ],
          "locations": [
            {
              "id": "L002",
              "name": "Karol Bagh, New Delhi"
            },
            {
              "id": "L004",
              "name": "Okhla Industrial Area, Delhi"
            }
          ]
        }
      },
      {
        "cluster_id": "Location-L004",
        "shared_entity": {
          "id": "L004",
          "name": "Okhla Industrial Area, Delhi",
          "type": "Location"
        },
        "related_cases": [
          "101",
          "105"
        ],
        "connection_strength": "MEDIUM",
        "evidence": "Incident location",
        "shared": {
          "people": [
            {
              "id": "P001",
              "name": "Ravi Kumar"
            }
          ],
          "phones": [
            {
              "id": "+91-98110-44501",
              "name": "+91-98110-44501"
            },
            {
              "id": "+91-98110-44502",
              "name": "+91-98110-44502"
            }
          ],
          "vehicles": [],
          "organizations": [
            {
              "id": "O001",
              "name": "Apex Global Logistics Pvt Ltd"
            }
          ],
          "locations": [
            {
              "id": "L002",
              "name": "Karol Bagh, New Delhi"
            },
            {
              "id": "L004",
              "name": "Okhla Industrial Area, Delhi"
            }
          ]
        }
      },
      {
        "cluster_id": "Phone-+91-98110-44501",
        "shared_entity": {
          "id": "+91-98110-44501",
          "name": "+91-98110-44501",
          "type": "Phone"
        },
        "related_cases": [
          "101",
          "105"
        ],
        "connection_strength": "MEDIUM",
        "evidence": "CDR / phone registry",
        "shared": {
          "people": [
            {
              "id": "P001",
              "name": "Ravi Kumar"
            }
          ],
          "phones": [
            {
              "id": "+91-98110-44501",
              "name": "+91-98110-44501"
            },
            {
              "id": "+91-98110-44502",
              "name": "+91-98110-44502"
            }
          ],
          "vehicles": [],
          "organizations": [
            {
              "id": "O001",
              "name": "Apex Global Logistics Pvt Ltd"
            }
          ],
          "locations": [
            {
              "id": "L002",
              "name": "Karol Bagh, New Delhi"
            },
            {
              "id": "L004",
              "name": "Okhla Industrial Area, Delhi"
            }
          ]
        }
      },
      {
        "cluster_id": "Phone-+91-99300-67890",
        "shared_entity": {
          "id": "+91-99300-67890",
          "name": "+91-99300-67890",
          "type": "Phone"
        },
        "related_cases": [
          "102",
          "105"
        ],
        "connection_strength": "MEDIUM",
        "evidence": "CDR / phone registry",
        "shared": {
          "people": [
            {
              "id": "P004",
              "name": "Aarav Mehta"
            }
          ],
          "phones": [
            {
              "id": "+91-99300-67890",
              "name": "+91-99300-67890"
            },
            {
              "id": "+91-99300-67891",
              "name": "+91-99300-67891"
            }
          ],
          "vehicles": [],
          "organizations": [],
          "locations": []
        }
      },
      {
        "cluster_id": "Phone-+91-87654-32100",
        "shared_entity": {
          "id": "+91-87654-32100",
          "name": "+91-87654-32100",
          "type": "Phone"
        },
        "related_cases": [
          "101",
          "103"
        ],
        "connection_strength": "MEDIUM",
        "evidence": "CDR / phone registry",
        "shared": {
          "people": [
            {
              "id": "P002",
              "name": "Vikram Singh"
            },
            {
              "id": "P008",
              "name": "Manish Tiwari"
            }
          ],
          "phones": [
            {
              "id": "+91-98765-32100",
              "name": "+91-98765-32100"
            },
            {
              "id": "+91-87654-32100",
              "name": "+91-87654-32100"
            },
            {
              "id": "+91-98765-32101",
              "name": "+91-98765-32101"
            }
          ],
          "vehicles": [
            {
              "id": "V005",
              "name": "DL-05-XY-7890"
            }
          ],
          "organizations": [],
          "locations": []
        }
      },
      {
        "cluster_id": "Phone-+91-96000-12345",
        "shared_entity": {
          "id": "+91-96000-12345",
          "name": "+91-96000-12345",
          "type": "Phone"
        },
        "related_cases": [
          "104",
          "105"
        ],
        "connection_strength": "MEDIUM",
        "evidence": "CDR / phone registry",
        "shared": {
          "people": [
            {
              "id": "P010",
              "name": "Rohit Patel"
            }
          ],
          "phones": [
            {
              "id": "+91-96000-12345",
              "name": "+91-96000-12345"
            }
          ],
          "vehicles": [],
          "organizations": [],
          "locations": []
        }
      },
      {
        "cluster_id": "Phone-+91-98110-99999",
        "shared_entity": {
          "id": "+91-98110-99999",
          "name": "+91-98110-99999",
          "type": "Phone"
        },
        "related_cases": [
          "102",
          "103"
        ],
        "connection_strength": "MEDIUM",
        "evidence": "CDR / phone registry",
        "shared": {
          "people": [
            {
              "id": "P002",
              "name": "Vikram Singh"
            },
            {
              "id": "P011",
              "name": "Unknown (Burner)"
            }
          ],
          "phones": [
            {
              "id": "+91-98765-32100",
              "name": "+91-98765-32100"
            },
            {
              "id": "+91-98110-99999",
              "name": "+91-98110-99999"
            },
            {
              "id": "+91-98765-32101",
              "name": "+91-98765-32101"
            }
          ],
          "vehicles": [],
          "organizations": [],
          "locations": []
        }
      },
      {
        "cluster_id": "Phone-+91-98110-44502",
        "shared_entity": {
          "id": "+91-98110-44502",
          "name": "+91-98110-44502",
          "type": "Phone"
        },
        "related_cases": [
          "101",
          "105"
        ],
        "connection_strength": "MEDIUM",
        "evidence": "CDR / phone registry",
        "shared": {
          "people": [
            {
              "id": "P001",
              "name": "Ravi Kumar"
            }
          ],
          "phones": [
            {
              "id": "+91-98110-44501",
              "name": "+91-98110-44501"
            },
            {
              "id": "+91-98110-44502",
              "name": "+91-98110-44502"
            }
          ],
          "vehicles": [],
          "organizations": [
            {
              "id": "O001",
              "name": "Apex Global Logistics Pvt Ltd"
            }
          ],
          "locations": [
            {
              "id": "L002",
              "name": "Karol Bagh, New Delhi"
            },
            {
              "id": "L004",
              "name": "Okhla Industrial Area, Delhi"
            }
          ]
        }
      },
      {
        "cluster_id": "Phone-+91-99300-67891",
        "shared_entity": {
          "id": "+91-99300-67891",
          "name": "+91-99300-67891",
          "type": "Phone"
        },
        "related_cases": [
          "102",
          "105"
        ],
        "connection_strength": "MEDIUM",
        "evidence": "CDR / phone registry",
        "shared": {
          "people": [
            {
              "id": "P004",
              "name": "Aarav Mehta"
            }
          ],
          "phones": [
            {
              "id": "+91-99300-67890",
              "name": "+91-99300-67890"
            },
            {
              "id": "+91-99300-67891",
              "name": "+91-99300-67891"
            }
          ],
          "vehicles": [],
          "organizations": [],
          "locations": []
        }
      }
    ],
    "shared_people_count": 6,
    "shared_org_count": 1,
    "shared_phone_count": 9
  },
  "/api/v1/analyst/network": {
    "memgraph_live": false,
    "data_mode": "FALLBACK",
    "label": "DEMO / FALLBACK DATA",
    "stats": {
      "nodes": 16,
      "edges": 22,
      "density": 0.1833,
      "bridge_entities": 7,
      "cross_case_entities": 7
    },
    "highly_connected": [
      {
        "id": "P001",
        "name": "Ravi Kumar",
        "degree": 7,
        "type": "Person",
        "cases": [
          "101",
          "105"
        ]
      },
      {
        "id": "P002",
        "name": "Vikram Singh",
        "degree": 5,
        "type": "Person",
        "cases": [
          "101",
          "102",
          "103"
        ]
      },
      {
        "id": "P004",
        "name": "Aarav Mehta",
        "degree": 4,
        "type": "Person",
        "cases": [
          "102",
          "105"
        ]
      },
      {
        "id": "P007",
        "name": "Deepak Srivastava",
        "degree": 4,
        "type": "Person",
        "cases": [
          "105"
        ]
      },
      {
        "id": "P005",
        "name": "Suresh Yadav",
        "degree": 3,
        "type": "Person",
        "cases": [
          "103"
        ]
      },
      {
        "id": "P008",
        "name": "Manish Tiwari",
        "degree": 2,
        "type": "Person",
        "cases": [
          "101",
          "103"
        ]
      },
      {
        "id": "P011",
        "name": "Unknown (Burner)",
        "degree": 2,
        "type": "Person",
        "cases": [
          "102",
          "103"
        ]
      },
      {
        "id": "P006",
        "name": "Priya Nair",
        "degree": 2,
        "type": "Person",
        "cases": [
          "104"
        ]
      },
      {
        "id": "P010",
        "name": "Rohit Patel",
        "degree": 2,
        "type": "Person",
        "cases": [
          "104",
          "105"
        ]
      },
      {
        "id": "O001",
        "name": "Apex Global Logistics Pvt Ltd",
        "degree": 2,
        "type": "Organization",
        "cases": [
          "101",
          "105"
        ]
      },
      {
        "id": "P003",
        "name": "Meena Sharma",
        "degree": 1,
        "type": "Person",
        "cases": [
          "101"
        ]
      },
      {
        "id": "P009",
        "name": "Sanjay Gupta",
        "degree": 1,
        "type": "Person",
        "cases": [
          "102"
        ]
      }
    ],
    "bridge_entities": [
      {
        "id": "P001",
        "name": "Ravi Kumar",
        "degree": 7,
        "type": "Person",
        "cases": [
          "101",
          "105"
        ]
      },
      {
        "id": "P002",
        "name": "Vikram Singh",
        "degree": 5,
        "type": "Person",
        "cases": [
          "101",
          "102",
          "103"
        ]
      },
      {
        "id": "P004",
        "name": "Aarav Mehta",
        "degree": 4,
        "type": "Person",
        "cases": [
          "102",
          "105"
        ]
      },
      {
        "id": "P008",
        "name": "Manish Tiwari",
        "degree": 2,
        "type": "Person",
        "cases": [
          "101",
          "103"
        ]
      },
      {
        "id": "P011",
        "name": "Unknown (Burner)",
        "degree": 2,
        "type": "Person",
        "cases": [
          "102",
          "103"
        ]
      },
      {
        "id": "P010",
        "name": "Rohit Patel",
        "degree": 2,
        "type": "Person",
        "cases": [
          "104",
          "105"
        ]
      },
      {
        "id": "O001",
        "name": "Apex Global Logistics Pvt Ltd",
        "degree": 2,
        "type": "Organization",
        "cases": [
          "101",
          "105"
        ]
      }
    ],
    "preview": {
      "nodes": [
        {
          "id": "P001",
          "label": "Ravi Kumar",
          "type": "Person",
          "degree": 7,
          "cases": [
            "101",
            "105"
          ]
        },
        {
          "id": "P002",
          "label": "Vikram Singh",
          "type": "Person",
          "degree": 5,
          "cases": [
            "101",
            "102",
            "103"
          ]
        },
        {
          "id": "P003",
          "label": "Meena Sharma",
          "type": "Person",
          "degree": 1,
          "cases": [
            "101"
          ]
        },
        {
          "id": "P004",
          "label": "Aarav Mehta",
          "type": "Person",
          "degree": 4,
          "cases": [
            "102",
            "105"
          ]
        },
        {
          "id": "P005",
          "label": "Suresh Yadav",
          "type": "Person",
          "degree": 3,
          "cases": [
            "103"
          ]
        },
        {
          "id": "P006",
          "label": "Priya Nair",
          "type": "Person",
          "degree": 2,
          "cases": [
            "104"
          ]
        },
        {
          "id": "P007",
          "label": "Deepak Srivastava",
          "type": "Person",
          "degree": 4,
          "cases": [
            "105"
          ]
        },
        {
          "id": "P008",
          "label": "Manish Tiwari",
          "type": "Person",
          "degree": 2,
          "cases": [
            "101",
            "103"
          ]
        },
        {
          "id": "P009",
          "label": "Sanjay Gupta",
          "type": "Person",
          "degree": 1,
          "cases": [
            "102"
          ]
        },
        {
          "id": "P010",
          "label": "Rohit Patel",
          "type": "Person",
          "degree": 2,
          "cases": [
            "104",
            "105"
          ]
        },
        {
          "id": "P011",
          "label": "Unknown (Burner)",
          "type": "Person",
          "degree": 2,
          "cases": [
            "102",
            "103"
          ]
        },
        {
          "id": "O001",
          "label": "Apex Global Logistics Pvt Ltd",
          "type": "Organization",
          "degree": 2,
          "cases": [
            "101",
            "105"
          ]
        }
      ],
      "edges": [
        {
          "source": "P001",
          "target": "P002",
          "type": "ASSOCIATED_WITH"
        },
        {
          "source": "P001",
          "target": "P003",
          "type": "ASSOCIATED_WITH"
        },
        {
          "source": "P001",
          "target": "P008",
          "type": "ASSOCIATED_WITH"
        },
        {
          "source": "P002",
          "target": "P004",
          "type": "COMMUNICATES_WITH"
        },
        {
          "source": "P002",
          "target": "P009",
          "type": "ASSOCIATED_WITH"
        },
        {
          "source": "P011",
          "target": "P002",
          "type": "COMMUNICATES_WITH"
        },
        {
          "source": "P011",
          "target": "P005",
          "type": "COMMUNICATES_WITH"
        },
        {
          "source": "P005",
          "target": "P008",
          "type": "ASSOCIATED_WITH"
        },
        {
          "source": "P006",
          "target": "P010",
          "type": "ASSOCIATED_WITH"
        },
        {
          "source": "P001",
          "target": "P007",
          "type": "FINANCIAL_TRANSFER_TO"
        },
        {
          "source": "P004",
          "target": "P007",
          "type": "FINANCIAL_TRANSFER_TO"
        },
        {
          "source": "P010",
          "target": "P007",
          "type": "FINANCIAL_TRANSFER_TO"
        },
        {
          "source": "P001",
          "target": "O001",
          "type": "OWNS"
        }
      ]
    },
    "note": "Macro overview \u2014 filtered/aggregated. Not a full unfiltered dump."
  },
  "/api/v1/analyst/communities": {
    "memgraph_live": false,
    "data_mode": "FALLBACK",
    "label": "DEMO / FALLBACK DATA",
    "total": 1,
    "communities": [
      {
        "community_id": "COMMUNITY-01",
        "label": "NETWORK COMMUNITY",
        "entities": 16,
        "entity_ids": [
          "P001",
          "O001",
          "P003",
          "P002",
          "P004",
          "O002",
          "P007",
          "P010",
          "P006",
          "O004",
          "O005",
          "P009",
          "P011",
          "P005",
          "P008",
          "O003"
        ],
        "cases": [
          "101",
          "102",
          "103",
          "104",
          "105"
        ],
        "case_count": 5,
        "locations": [],
        "location_count": 0,
        "key_entity": {
          "id": "P001",
          "name": "Ravi Kumar",
          "degree": 7
        },
        "cross_case_links": 7
      }
    ]
  },
  "/api/v1/analyst/centrality": {
    "memgraph_live": false,
    "data_mode": "FALLBACK",
    "label": "DEMO / FALLBACK DATA",
    "entities": [
      {
        "entity_id": "P002",
        "name": "Vikram Singh",
        "type": "Person",
        "cases": [
          "101",
          "102",
          "103"
        ],
        "case_count": 3,
        "connections": 5,
        "degree": 5,
        "betweenness": "High",
        "betweenness_note": "Proxy from cross-case degree (not full pairwise betweenness).",
        "cross_case": 3,
        "classification": "BRIDGE ENTITY",
        "explanation": "Appears across 3 case(s) and has 5 graph connection(s). Connects otherwise separated case clusters.",
        "disclaimer": "Centrality is not proof of criminal activity."
      },
      {
        "entity_id": "P001",
        "name": "Ravi Kumar",
        "type": "Person",
        "cases": [
          "101",
          "105"
        ],
        "case_count": 2,
        "connections": 7,
        "degree": 7,
        "betweenness": "Medium",
        "betweenness_note": "Proxy from cross-case degree (not full pairwise betweenness).",
        "cross_case": 2,
        "classification": "BRIDGE ENTITY",
        "explanation": "Appears across 2 case(s) and has 7 graph connection(s). Connects otherwise separated case clusters.",
        "disclaimer": "Centrality is not proof of criminal activity."
      },
      {
        "entity_id": "P004",
        "name": "Aarav Mehta",
        "type": "Person",
        "cases": [
          "102",
          "105"
        ],
        "case_count": 2,
        "connections": 4,
        "degree": 4,
        "betweenness": "Medium",
        "betweenness_note": "Proxy from cross-case degree (not full pairwise betweenness).",
        "cross_case": 2,
        "classification": "BRIDGE ENTITY",
        "explanation": "Appears across 2 case(s) and has 4 graph connection(s). Connects otherwise separated case clusters.",
        "disclaimer": "Centrality is not proof of criminal activity."
      },
      {
        "entity_id": "P008",
        "name": "Manish Tiwari",
        "type": "Person",
        "cases": [
          "101",
          "103"
        ],
        "case_count": 2,
        "connections": 2,
        "degree": 2,
        "betweenness": "Medium",
        "betweenness_note": "Proxy from cross-case degree (not full pairwise betweenness).",
        "cross_case": 2,
        "classification": "BRIDGE ENTITY",
        "explanation": "Appears across 2 case(s) and has 2 graph connection(s). Connects otherwise separated case clusters.",
        "disclaimer": "Centrality is not proof of criminal activity."
      },
      {
        "entity_id": "P010",
        "name": "Rohit Patel",
        "type": "Person",
        "cases": [
          "104",
          "105"
        ],
        "case_count": 2,
        "connections": 2,
        "degree": 2,
        "betweenness": "Medium",
        "betweenness_note": "Proxy from cross-case degree (not full pairwise betweenness).",
        "cross_case": 2,
        "classification": "BRIDGE ENTITY",
        "explanation": "Appears across 2 case(s) and has 2 graph connection(s). Connects otherwise separated case clusters.",
        "disclaimer": "Centrality is not proof of criminal activity."
      },
      {
        "entity_id": "P011",
        "name": "Unknown (Burner)",
        "type": "Person",
        "cases": [
          "102",
          "103"
        ],
        "case_count": 2,
        "connections": 2,
        "degree": 2,
        "betweenness": "Medium",
        "betweenness_note": "Proxy from cross-case degree (not full pairwise betweenness).",
        "cross_case": 2,
        "classification": "BRIDGE ENTITY",
        "explanation": "Appears across 2 case(s) and has 2 graph connection(s). Connects otherwise separated case clusters.",
        "disclaimer": "Centrality is not proof of criminal activity."
      },
      {
        "entity_id": "P007",
        "name": "Deepak Srivastava",
        "type": "Person",
        "cases": [
          "105"
        ],
        "case_count": 1,
        "connections": 4,
        "degree": 4,
        "betweenness": "Low",
        "betweenness_note": "Proxy from cross-case degree (not full pairwise betweenness).",
        "cross_case": 1,
        "classification": "CONNECTED ENTITY",
        "explanation": "Appears across 1 case(s) and has 4 graph connection(s). Degree reflects local connectivity within known cases.",
        "disclaimer": "Centrality is not proof of criminal activity."
      },
      {
        "entity_id": "P005",
        "name": "Suresh Yadav",
        "type": "Person",
        "cases": [
          "103"
        ],
        "case_count": 1,
        "connections": 3,
        "degree": 3,
        "betweenness": "Low",
        "betweenness_note": "Proxy from cross-case degree (not full pairwise betweenness).",
        "cross_case": 1,
        "classification": "CONNECTED ENTITY",
        "explanation": "Appears across 1 case(s) and has 3 graph connection(s). Degree reflects local connectivity within known cases.",
        "disclaimer": "Centrality is not proof of criminal activity."
      },
      {
        "entity_id": "P006",
        "name": "Priya Nair",
        "type": "Person",
        "cases": [
          "104"
        ],
        "case_count": 1,
        "connections": 2,
        "degree": 2,
        "betweenness": "Low",
        "betweenness_note": "Proxy from cross-case degree (not full pairwise betweenness).",
        "cross_case": 1,
        "classification": "CONNECTED ENTITY",
        "explanation": "Appears across 1 case(s) and has 2 graph connection(s). Degree reflects local connectivity within known cases.",
        "disclaimer": "Centrality is not proof of criminal activity."
      },
      {
        "entity_id": "P003",
        "name": "Meena Sharma",
        "type": "Person",
        "cases": [
          "101"
        ],
        "case_count": 1,
        "connections": 1,
        "degree": 1,
        "betweenness": "Low",
        "betweenness_note": "Proxy from cross-case degree (not full pairwise betweenness).",
        "cross_case": 1,
        "classification": "CONNECTED ENTITY",
        "explanation": "Appears across 1 case(s) and has 1 graph connection(s). Degree reflects local connectivity within known cases.",
        "disclaimer": "Centrality is not proof of criminal activity."
      },
      {
        "entity_id": "P009",
        "name": "Sanjay Gupta",
        "type": "Person",
        "cases": [
          "102"
        ],
        "case_count": 1,
        "connections": 1,
        "degree": 1,
        "betweenness": "Low",
        "betweenness_note": "Proxy from cross-case degree (not full pairwise betweenness).",
        "cross_case": 1,
        "classification": "CONNECTED ENTITY",
        "explanation": "Appears across 1 case(s) and has 1 graph connection(s). Degree reflects local connectivity within known cases.",
        "disclaimer": "Centrality is not proof of criminal activity."
      }
    ]
  },
  "/api/v1/analyst/patterns": {
    "memgraph_live": false,
    "data_mode": "FALLBACK",
    "label": "DEMO / FALLBACK DATA",
    "total": 19,
    "patterns": [
      {
        "pattern_id": "PAT-LOC-delhi",
        "type": "Repeated Location",
        "title": "Repeated activity in Delhi",
        "what": "3 cases linked to Delhi",
        "where": "Delhi",
        "when": "2025-04 \u2192 2025-05 \u2192 2025-07",
        "case_count": 3,
        "cases": [
          "101",
          "102",
          "105"
        ],
        "entities": [],
        "trend": "decreasing",
        "why": "Multiple cases map to the same geographic region/location nodes in the dataset.",
        "evidence": [
          "Location registry",
          "FIR jurisdiction / incident locations"
        ],
        "confidence": 0.85,
        "confidence_reason": "Based on count of linked cases at this location (not a model score)."
      },
      {
        "pattern_id": "PAT-LOC-mumbai",
        "type": "Repeated Location",
        "title": "Repeated activity in Mumbai",
        "what": "2 cases linked to Mumbai",
        "where": "Mumbai",
        "when": "2025-05 \u2192 2025-06",
        "case_count": 2,
        "cases": [
          "102",
          "104"
        ],
        "entities": [],
        "trend": "stable",
        "why": "Multiple cases map to the same geographic region/location nodes in the dataset.",
        "evidence": [
          "Location registry",
          "FIR jurisdiction / incident locations"
        ],
        "confidence": 0.75,
        "confidence_reason": "Based on count of linked cases at this location (not a model score)."
      },
      {
        "pattern_id": "PAT-TREND-Extortion",
        "type": "Crime Trend",
        "title": "Extortion is increasing",
        "what": "Extortion: 0 \u2192 1 cases across comparison periods",
        "where": "Filtered geography",
        "when": "Period split of filtered incident dates",
        "case_count": 1,
        "cases": [],
        "entities": [],
        "trend": "increasing",
        "why": "Period comparison change_pct=None",
        "evidence": [
          "Case incident_date",
          "crime_category"
        ],
        "confidence": 0.5,
        "confidence_reason": "Derived from period case counts only."
      },
      {
        "pattern_id": "PAT-TREND-Cyber_Fraud",
        "type": "Crime Trend",
        "title": "Cyber Fraud is increasing",
        "what": "Cyber Fraud: 0 \u2192 1 cases across comparison periods",
        "where": "Filtered geography",
        "when": "Period split of filtered incident dates",
        "case_count": 1,
        "cases": [],
        "entities": [],
        "trend": "increasing",
        "why": "Period comparison change_pct=None",
        "evidence": [
          "Case incident_date",
          "crime_category"
        ],
        "confidence": 0.5,
        "confidence_reason": "Derived from period case counts only."
      },
      {
        "pattern_id": "PAT-TREND-Arms_Act_195",
        "type": "Crime Trend",
        "title": "Arms Act 1959 is increasing",
        "what": "Arms Act 1959: 0 \u2192 1 cases across comparison periods",
        "where": "Filtered geography",
        "when": "Period split of filtered incident dates",
        "case_count": 1,
        "cases": [],
        "entities": [],
        "trend": "increasing",
        "why": "Period comparison change_pct=None",
        "evidence": [
          "Case incident_date",
          "crime_category"
        ],
        "confidence": 0.5,
        "confidence_reason": "Derived from period case counts only."
      },
      {
        "pattern_id": "PAT-TREND-Organized_Au",
        "type": "Crime Trend",
        "title": "Organized Auto Theft is increasing",
        "what": "Organized Auto Theft: 0 \u2192 1 cases across comparison periods",
        "where": "Filtered geography",
        "when": "Period split of filtered incident dates",
        "case_count": 1,
        "cases": [],
        "entities": [],
        "trend": "increasing",
        "why": "Period comparison change_pct=None",
        "evidence": [
          "Case incident_date",
          "crime_category"
        ],
        "confidence": 0.5,
        "confidence_reason": "Derived from period case counts only."
      },
      {
        "pattern_id": "PAT-TREND-PMLA_2002",
        "type": "Crime Trend",
        "title": "PMLA 2002 is increasing",
        "what": "PMLA 2002: 0 \u2192 1 cases across comparison periods",
        "where": "Filtered geography",
        "when": "Period split of filtered incident dates",
        "case_count": 1,
        "cases": [],
        "entities": [],
        "trend": "increasing",
        "why": "Period comparison change_pct=None",
        "evidence": [
          "Case incident_date",
          "crime_category"
        ],
        "confidence": 0.5,
        "confidence_reason": "Derived from period case counts only."
      },
      {
        "pattern_id": "PAT-X-Person-P002",
        "type": "Cross-Case Entity",
        "title": "Recurring person: Vikram Singh",
        "what": "Vikram Singh appears in cases 101, 102, 103",
        "where": "Cross-jurisdiction",
        "when": "Across registered case dates",
        "case_count": 3,
        "cases": [
          "101",
          "102",
          "103"
        ],
        "entities": [
          "Vikram Singh"
        ],
        "trend": "recurring",
        "why": "Same person entity is linked to multiple case numbers in ground-truth data.",
        "evidence": [
          "FIR / entity registry"
        ],
        "confidence": 0.85,
        "confidence_reason": "Deterministic multi-case membership; not ML confidence."
      },
      {
        "pattern_id": "PAT-X-Phone-+91-98765-32100",
        "type": "Cross-Case Entity",
        "title": "Recurring phone: +91-98765-32100",
        "what": "+91-98765-32100 appears in cases 101, 102, 103",
        "where": "Cross-jurisdiction",
        "when": "Across registered case dates",
        "case_count": 3,
        "cases": [
          "101",
          "102",
          "103"
        ],
        "entities": [
          "+91-98765-32100"
        ],
        "trend": "recurring",
        "why": "Same phone entity is linked to multiple case numbers in ground-truth data.",
        "evidence": [
          "CDR / phone registry"
        ],
        "confidence": 0.85,
        "confidence_reason": "Deterministic multi-case membership; not ML confidence."
      },
      {
        "pattern_id": "PAT-X-Phone-+91-98765-32101",
        "type": "Cross-Case Entity",
        "title": "Recurring phone: +91-98765-32101",
        "what": "+91-98765-32101 appears in cases 101, 102, 103",
        "where": "Cross-jurisdiction",
        "when": "Across registered case dates",
        "case_count": 3,
        "cases": [
          "101",
          "102",
          "103"
        ],
        "entities": [
          "+91-98765-32101"
        ],
        "trend": "recurring",
        "why": "Same phone entity is linked to multiple case numbers in ground-truth data.",
        "evidence": [
          "CDR / phone registry"
        ],
        "confidence": 0.85,
        "confidence_reason": "Deterministic multi-case membership; not ML confidence."
      },
      {
        "pattern_id": "PAT-X-Person-P001",
        "type": "Cross-Case Entity",
        "title": "Recurring person: Ravi Kumar",
        "what": "Ravi Kumar appears in cases 101, 105",
        "where": "Cross-jurisdiction",
        "when": "Across registered case dates",
        "case_count": 2,
        "cases": [
          "101",
          "105"
        ],
        "entities": [
          "Ravi Kumar"
        ],
        "trend": "recurring",
        "why": "Same person entity is linked to multiple case numbers in ground-truth data.",
        "evidence": [
          "FIR / entity registry"
        ],
        "confidence": 0.7,
        "confidence_reason": "Deterministic multi-case membership; not ML confidence."
      },
      {
        "pattern_id": "PAT-X-Person-P004",
        "type": "Cross-Case Entity",
        "title": "Recurring person: Aarav Mehta",
        "what": "Aarav Mehta appears in cases 102, 105",
        "where": "Cross-jurisdiction",
        "when": "Across registered case dates",
        "case_count": 2,
        "cases": [
          "102",
          "105"
        ],
        "entities": [
          "Aarav Mehta"
        ],
        "trend": "recurring",
        "why": "Same person entity is linked to multiple case numbers in ground-truth data.",
        "evidence": [
          "FIR / entity registry"
        ],
        "confidence": 0.7,
        "confidence_reason": "Deterministic multi-case membership; not ML confidence."
      },
      {
        "pattern_id": "PAT-X-Person-P008",
        "type": "Cross-Case Entity",
        "title": "Recurring person: Manish Tiwari",
        "what": "Manish Tiwari appears in cases 101, 103",
        "where": "Cross-jurisdiction",
        "when": "Across registered case dates",
        "case_count": 2,
        "cases": [
          "101",
          "103"
        ],
        "entities": [
          "Manish Tiwari"
        ],
        "trend": "recurring",
        "why": "Same person entity is linked to multiple case numbers in ground-truth data.",
        "evidence": [
          "FIR / entity registry"
        ],
        "confidence": 0.7,
        "confidence_reason": "Deterministic multi-case membership; not ML confidence."
      },
      {
        "pattern_id": "PAT-X-Person-P010",
        "type": "Cross-Case Entity",
        "title": "Recurring person: Rohit Patel",
        "what": "Rohit Patel appears in cases 104, 105",
        "where": "Cross-jurisdiction",
        "when": "Across registered case dates",
        "case_count": 2,
        "cases": [
          "104",
          "105"
        ],
        "entities": [
          "Rohit Patel"
        ],
        "trend": "recurring",
        "why": "Same person entity is linked to multiple case numbers in ground-truth data.",
        "evidence": [
          "FIR / entity registry"
        ],
        "confidence": 0.7,
        "confidence_reason": "Deterministic multi-case membership; not ML confidence."
      },
      {
        "pattern_id": "PAT-X-Person-P011",
        "type": "Cross-Case Entity",
        "title": "Recurring person: Unknown (Burner)",
        "what": "Unknown (Burner) appears in cases 102, 103",
        "where": "Cross-jurisdiction",
        "when": "Across registered case dates",
        "case_count": 2,
        "cases": [
          "102",
          "103"
        ],
        "entities": [
          "Unknown (Burner)"
        ],
        "trend": "recurring",
        "why": "Same person entity is linked to multiple case numbers in ground-truth data.",
        "evidence": [
          "FIR / entity registry"
        ],
        "confidence": 0.7,
        "confidence_reason": "Deterministic multi-case membership; not ML confidence."
      },
      {
        "pattern_id": "PAT-X-Organization-O001",
        "type": "Cross-Case Entity",
        "title": "Recurring organization: Apex Global Logistics Pvt Ltd",
        "what": "Apex Global Logistics Pvt Ltd appears in cases 101, 105",
        "where": "Cross-jurisdiction",
        "when": "Across registered case dates",
        "case_count": 2,
        "cases": [
          "101",
          "105"
        ],
        "entities": [
          "Apex Global Logistics Pvt Ltd"
        ],
        "trend": "recurring",
        "why": "Same organization entity is linked to multiple case numbers in ground-truth data.",
        "evidence": [
          "Company / shell registry"
        ],
        "confidence": 0.7,
        "confidence_reason": "Deterministic multi-case membership; not ML confidence."
      },
      {
        "pattern_id": "PAT-X-Vehicle-V005",
        "type": "Cross-Case Entity",
        "title": "Recurring vehicle: DL-05-XY-7890",
        "what": "DL-05-XY-7890 appears in cases 101, 103",
        "where": "Cross-jurisdiction",
        "when": "Across registered case dates",
        "case_count": 2,
        "cases": [
          "101",
          "103"
        ],
        "entities": [
          "DL-05-XY-7890"
        ],
        "trend": "recurring",
        "why": "Same vehicle entity is linked to multiple case numbers in ground-truth data.",
        "evidence": [
          "Vehicle registry"
        ],
        "confidence": 0.7,
        "confidence_reason": "Deterministic multi-case membership; not ML confidence."
      },
      {
        "pattern_id": "PAT-X-Location-L002",
        "type": "Cross-Case Entity",
        "title": "Recurring location: Karol Bagh, New Delhi",
        "what": "Karol Bagh, New Delhi appears in cases 101, 105",
        "where": "Cross-jurisdiction",
        "when": "Across registered case dates",
        "case_count": 2,
        "cases": [
          "101",
          "105"
        ],
        "entities": [
          "Karol Bagh, New Delhi"
        ],
        "trend": "recurring",
        "why": "Same location entity is linked to multiple case numbers in ground-truth data.",
        "evidence": [
          "Incident location"
        ],
        "confidence": 0.7,
        "confidence_reason": "Deterministic multi-case membership; not ML confidence."
      },
      {
        "pattern_id": "PAT-X-Location-L004",
        "type": "Cross-Case Entity",
        "title": "Recurring location: Okhla Industrial Area, Delhi",
        "what": "Okhla Industrial Area, Delhi appears in cases 101, 105",
        "where": "Cross-jurisdiction",
        "when": "Across registered case dates",
        "case_count": 2,
        "cases": [
          "101",
          "105"
        ],
        "entities": [
          "Okhla Industrial Area, Delhi"
        ],
        "trend": "recurring",
        "why": "Same location entity is linked to multiple case numbers in ground-truth data.",
        "evidence": [
          "Incident location"
        ],
        "confidence": 0.7,
        "confidence_reason": "Deterministic multi-case membership; not ML confidence."
      }
    ]
  },
  "/api/v1/leads/intelligence": {
    "total": 0,
    "leads": []
  }
};

export function getMock(path: string): any {
  const base = path.split('?')[0];
  if (MOCK_STORE[base] !== undefined) return MOCK_STORE[base];
  for (const key of Object.keys(MOCK_STORE)) {
    if (base.startsWith(key)) return MOCK_STORE[key];
  }
  return null;
}
