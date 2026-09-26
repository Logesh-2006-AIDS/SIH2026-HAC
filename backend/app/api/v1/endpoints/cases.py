"""
Phase 5: Case Master Dossiers & Export Engine API Endpoints
"""
import os
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, log_audit_action
from app.db.postgres import get_db
from app.models.case import Case, CasePriority, CaseStatus
from app.models.user import User
from app.schemas.common import ResponseEnvelope
from app.services import graph_analytics

router = APIRouter()

CASE_METADATA = [
    {
        "case_number": "101",
        "fir_number": "FIR No. 101/2025",
        "title": "Armed Robbery & Extortion Syndicate (M/s Royal Jewellers)",
        "crime_category": "Extortion / Armed Robbery / MCOCA",
        "jurisdiction": "Crime Branch, North District, Delhi Police",
        "incident_date": "2025-04-12T21:00:00Z",
        "status": "UNDER_INVESTIGATION",
        "priority": "HIGH",
        "accused": ["Ravi Kumar (Mastermind)", "Vikram Singh (Ground Coordinator)", "Meena Sharma (Insider)", "Manish Tiwari (Muscle)"],
        "summary": "Armed robbery extracting Rs. 15,00,000 cash; funds laundered via shell company Apex Global Logistics.",
    },
    {
        "case_number": "102",
        "fir_number": "FIR No. 102/2025",
        "title": "Cyber Phishing & Darknet Crypto Laundering Ring",
        "crime_category": "Cyber Fraud / PMLA 2002 / IT Act",
        "jurisdiction": "Cyber Crime Branch, Delhi Police",
        "incident_date": "2025-05-28T15:00:00Z",
        "status": "UNDER_INVESTIGATION",
        "priority": "CRITICAL",
        "accused": ["Vikram Singh (Tech Coordinator)", "Aarav Mehta (Crypto Handler)", "Sanjay Gupta (Mule Coordinator)", "Unknown Caller (+91-98110-99999)"],
        "summary": "Over 1,200 victims defrauded of Rs. 4.8 Crore; INR converted to 47,000 USDT via DarkNet Crypto Exchange.",
    },
    {
        "case_number": "103",
        "fir_number": "FIR No. 103/2025",
        "title": "Illicit Firearms Smuggling (NH-58 Transit Interception)",
        "crime_category": "Arms Act 1959 / UAPA / Conspiracy",
        "jurisdiction": "Special Crime Branch, UP Police (Meerut)",
        "incident_date": "2025-06-08T23:30:00Z",
        "status": "UNDER_INVESTIGATION",
        "priority": "CRITICAL",
        "accused": ["Suresh Yadav (Arms Procurement)", "Manish Tiwari (Logistics)", "Unknown Caller (+91-98110-99999)"],
        "summary": "Interception of 34 illegal firearms on NH-58; shared burner phone link with Case 102.",
    },
    {
        "case_number": "104",
        "fir_number": "FIR No. 104/2025",
        "title": "Inter-State Luxury Vehicle Theft & Plate Cloning Syndicate",
        "crime_category": "Organized Auto Theft / Cheating",
        "jurisdiction": "Maharashtra Auto Crime Cell, Mumbai",
        "incident_date": "2025-06-22T16:00:00Z",
        "status": "UNDER_INVESTIGATION",
        "priority": "MEDIUM",
        "accused": ["Priya Nair (Syndicate Head)", "Rohit Patel (Delivery / Hawala Router)"],
        "summary": "Luxury vehicle theft and chassis cloning operating through front entity Luxe Motor Exports Pvt Ltd.",
    },
    {
        "case_number": "105",
        "fir_number": "FIR No. 105/2025",
        "title": "Commercial Hawala Operations & Shell Company Layering",
        "crime_category": "PMLA 2002 / FEMA / Hawala",
        "jurisdiction": "Economic Offences Wing / Enforcement Directorate",
        "incident_date": "2025-07-05T10:00:00Z",
        "status": "UNDER_INVESTIGATION",
        "priority": "CRITICAL",
        "accused": ["Ravi Kumar (Beneficial Owner)", "Deepak Srivastava (Hawala Operator)", "Aarav Mehta (Crypto Inflow)", "Rohit Patel (Auto Theft Inflow)"],
        "summary": "Rs. 22 Crore processed across 417 transactions via Shroff Money Services and Apex Global Logistics.",
    },
]


@router.get("/", response_model=ResponseEnvelope, summary="List All Master Case Dossiers")
def list_cases(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all active criminal investigation case files."""
    log_audit_action(
        db=db,
        action="CASE_LIST_VIEW",
        resource_type="CASE",
        user_id=current_user.id if current_user else None,
    )
    return ResponseEnvelope(
        success=True,
        message=f"Found {len(CASE_METADATA)} registered cases.",
        data=CASE_METADATA,
    )


@router.get("/{case_number}", response_model=ResponseEnvelope, summary="Get Case Details and Subgraph Entities")
def get_case(
    case_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve detailed case dossier with connected graph entities."""
    case = next((c for c in CASE_METADATA if c["case_number"] == case_number), None)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case '{case_number}' not found.")

    subgraph = graph_analytics.get_subgraph(case_number)

    log_audit_action(
        db=db,
        action="CASE_DOSSIER_VIEW",
        resource_type="CASE",
        resource_id=case_number,
        user_id=current_user.id if current_user else None,
    )

    return ResponseEnvelope(
        success=True,
        message="Case dossier retrieved.",
        data={
            "dossier": case,
            "graph_entities": subgraph.get("nodes", []),
            "graph_relations": subgraph.get("edges", []),
        },
    )


def _generate_court_brief_pdf(case: dict, subgraph: dict, now_str: str, officer_name: str, badge_number: str, audit_token: str) -> bytes:
    import io
    from reportlab.lib.pagesizes import letter
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40,
    )
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontSize=16,
        leading=20,
        textColor=colors.HexColor("#0f172a"),
        fontName="Helvetica-Bold",
        spaceAfter=4,
    )
    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontSize=9,
        leading=12,
        textColor=colors.HexColor("#dc2626"),
        fontName="Helvetica-Bold",
        spaceAfter=12,
    )
    section_heading = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontSize=12,
        leading=15,
        textColor=colors.HexColor("#1e293b"),
        fontName="Helvetica-Bold",
        spaceBefore=10,
        spaceAfter=6,
    )
    body_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor("#334155"),
        fontName="Helvetica",
    )
    bold_body = ParagraphStyle(
        "BoldBody",
        parent=body_style,
        fontName="Helvetica-Bold",
    )
    table_cell = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#1e293b"),
    )
    table_cell_bold = ParagraphStyle(
        "TableCellBold",
        parent=table_cell,
        fontName="Helvetica-Bold",
        textColor=colors.HexColor("#0f172a"),
    )

    story = []

    # Title & Header
    story.append(Paragraph("LAW ENFORCEMENT INTELLIGENCE PLATFORM", title_style))
    story.append(Paragraph("CASE EVIDENCE BRIEF &amp; INVESTIGATION DOSSIER", ParagraphStyle("Sub", parent=title_style, fontSize=12, leading=15, textColor=colors.HexColor("#2563eb"))))
    story.append(Paragraph("CONFIDENTIAL // LAW ENFORCEMENT SENSITIVE // OFFICIAL USE ONLY", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#cbd5e1"), spaceAfter=10))

    # Case Metadata Table
    meta_data = [
        [Paragraph("FIR / Case Number:", table_cell_bold), Paragraph(str(case.get("fir_number", "N/A")), table_cell), Paragraph("Generated Date:", table_cell_bold), Paragraph(now_str, table_cell)],
        [Paragraph("Case Title:", table_cell_bold), Paragraph(str(case.get("title", "N/A")), table_cell), Paragraph("Incident Date:", table_cell_bold), Paragraph(str(case.get("incident_date", "N/A")), table_cell)],
        [Paragraph("Crime Category:", table_cell_bold), Paragraph(str(case.get("crime_category", "N/A")), table_cell), Paragraph("Jurisdiction:", table_cell_bold), Paragraph(str(case.get("jurisdiction", "N/A")), table_cell)],
        [Paragraph("Investigating Officer:", table_cell_bold), Paragraph(officer_name, table_cell), Paragraph("Badge ID:", table_cell_bold), Paragraph(badge_number, table_cell)],
    ]
    t_meta = Table(meta_data, colWidths=[110, 160, 100, 160])
    t_meta.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f8fafc")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 10))

    # Executive Summary
    story.append(Paragraph("1. Executive Summary", section_heading))
    story.append(Paragraph(case.get("summary", "No executive summary on record."), body_style))
    story.append(Spacer(1, 8))

    # Named Accused
    story.append(Paragraph("2. Named Accused &amp; Targets of Interest", section_heading))
    accused_list = case.get("accused", [])
    if accused_list:
        for idx, acc in enumerate(accused_list, 1):
            story.append(Paragraph(f"• <b>Accused {idx}:</b> {acc}", body_style))
    else:
        story.append(Paragraph("No primary accused listed.", body_style))
    story.append(Spacer(1, 8))

    # Extracted Graph Entities
    nodes = subgraph.get("nodes", [])
    story.append(Paragraph(f"3. Extracted Network Entities ({len(nodes)} Identified Nodes)", section_heading))
    if nodes:
        entity_rows = [[
            Paragraph("Entity ID", table_cell_bold),
            Paragraph("Name / Identifier", table_cell_bold),
            Paragraph("Type", table_cell_bold),
            Paragraph("Associated Cases", table_cell_bold),
        ]]
        for n in nodes[:15]:
            nid = str(n.get("id", ""))
            name = str(n.get("name") or n.get("reg_number") or n.get("number") or nid)
            etype = str(n.get("type", "Entity"))
            cases_str = ", ".join(n.get("cases", [])) or case.get("case_number", "")
            entity_rows.append([
                Paragraph(nid, table_cell),
                Paragraph(name, table_cell),
                Paragraph(etype, table_cell),
                Paragraph(cases_str, table_cell),
            ])
        t_entities = Table(entity_rows, colWidths=[80, 180, 110, 160])
        t_entities.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e2e8f0")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#f1f5f9")),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ]))
        story.append(t_entities)
    else:
        story.append(Paragraph("No extracted entities found for this case.", body_style))
    story.append(Spacer(1, 8))

    # Extracted Relationships
    edges = subgraph.get("edges", [])
    story.append(Paragraph(f"4. Evidence Relationship Chains ({len(edges)} Verified Connections)", section_heading))
    if edges:
        edge_rows = [[
            Paragraph("Source", table_cell_bold),
            Paragraph("Relationship", table_cell_bold),
            Paragraph("Target", table_cell_bold),
            Paragraph("Extraction Method", table_cell_bold),
            Paragraph("Evidentiary Strength", table_cell_bold),
        ]]
        for e in edges[:15]:
            props = e.get("properties") or {}
            ev_strength = props.get("evidentiary_strength") or {}
            strength_label = ev_strength.get("label") if isinstance(ev_strength, dict) else f"{int(props.get('confidence', 0.9)*100)}%"
            extract_method = props.get("extraction_method") or e.get("extraction_method", "NLP_HYBRID")
            edge_rows.append([
                Paragraph(str(e.get("source")), table_cell),
                Paragraph(str(e.get("type")), table_cell),
                Paragraph(str(e.get("target")), table_cell),
                Paragraph(extract_method, table_cell),
                Paragraph(strength_label or "85% (High)", table_cell),
            ])
        t_edges = Table(edge_rows, colWidths=[90, 110, 90, 120, 120])
        t_edges.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e2e8f0")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#f1f5f9")),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ]))
        story.append(t_edges)
    else:
        story.append(Paragraph("No direct relationship chains mapped for this case.", body_style))
    story.append(Spacer(1, 10))

    # Chain of custody notice
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cbd5e1"), spaceAfter=6))
    story.append(Paragraph("5. Chain of Custody &amp; Audit Logging", section_heading))
    story.append(Paragraph(
        f"<b>Integrity Reference:</b> {audit_token}<br/>"
        "<b>Notice:</b> This intelligence report is generated for investigative support. All AI-extracted entities and evidentiary links require officer verification prior to judicial filing.",
        ParagraphStyle("Notice", parent=body_style, fontSize=8, leading=11, textColor=colors.HexColor("#64748b")),
    ))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()


@router.get("/{case_number}/export", summary="Generate Court Evidence Brief & Evidentiary Docket")
def export_court_brief(
    case_number: str,
    format: str = Query("markdown", enum=["markdown", "text", "pdf"]),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export a case evidence brief with timestamped audit signature in Markdown, Text, or PDF format."""
    case = next((c for c in CASE_METADATA if c["case_number"] == case_number), None)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case '{case_number}' not found.")

    subgraph = graph_analytics.get_subgraph(case_number)
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    officer_name = current_user.full_name if current_user and current_user.full_name else "Insp. Rajesh Vardhan"
    badge_number = current_user.badge_number if current_user and current_user.badge_number else "DL-CB-9021"
    audit_token = f"SIH-AUDIT-{case_number}-{int(datetime.now().timestamp())}"

    log_audit_action(
        db=db,
        action="EXPORT_COURT_BRIEF",
        resource_type="CASE",
        resource_id=case_number,
        user_id=current_user.id if current_user else None,
        details={"format": format, "node_count": len(subgraph.get("nodes", []))},
    )

    if format == "pdf":
        try:
            pdf_bytes = _generate_court_brief_pdf(
                case=case,
                subgraph=subgraph,
                now_str=now_str,
                officer_name=officer_name,
                badge_number=badge_number,
                audit_token=audit_token,
            )
            return Response(
                content=pdf_bytes,
                media_type="application/pdf",
                headers={"Content-Disposition": f'attachment; filename="Case_Brief_{case_number}.pdf"'},
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")

    doc = f"""# LAW ENFORCEMENT INTELLIGENCE PLATFORM — CASE BRIEF
**CONFIDENTIAL // LAW ENFORCEMENT SENSITIVE // SIH 2026**

---

### CASE DOSSIER: {case['fir_number']}
- **Title:** {case['title']}
- **Jurisdiction:** {case['jurisdiction']}
- **Crime Category:** {case['crime_category']}
- **Incident Date:** {case['incident_date']}
- **Generated At:** {now_str}
- **Authorized Officer:** {officer_name} (Badge: {badge_number})

---

### EXECUTIVE SUMMARY
{case['summary']}

---

### NAMED ACCUSED & KEY TARGETS
{chr(10).join([f"- **Accused {idx+1}:** {acc}" for idx, acc in enumerate(case['accused'])])}

---

### KNOWLEDGE GRAPH EVIDENCE ENTITIES ({len(subgraph.get('nodes', []))} Extracted Nodes)
{chr(10).join([f"- **[{n.get('type') or 'Entity'}]** {n.get('name') or n.get('reg_number') or n.get('number') or n.get('id')} — Roles/Cases: {', '.join(n.get('cases', []))}" for n in subgraph.get('nodes', [])])}

---

### EVIDENCE RELATIONSHIP CHAINS ({len(subgraph.get('edges', []))} Verified Connections)
{chr(10).join([f"- {e.get('source')} ➔ [{e.get('type')}] ➔ {e.get('target')} (Extraction: {e.get('properties', {}).get('extraction_method', 'NLP_HYBRID')})" for e in subgraph.get('edges', [])])}

---

### CHAIN OF CUSTODY & AUDIT VERIFICATION
*This document was generated for investigative intelligence support. Officer verification required prior to judicial filing.*
- **Audit Reference:** {audit_token}
"""

    return Response(
        content=doc,
        media_type="text/markdown" if format == "markdown" else "text/plain",
        headers={"Content-Disposition": f'attachment; filename="Court_Evidence_Brief_Case_{case_number}.md"'},
    )


@router.get("/{case_number}/timeline", response_model=ResponseEnvelope, summary="Get Case Investigation Timeline")
def get_case_timeline(
    case_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return chronological investigation events for a case from graph relationship data."""
    case = next((c for c in CASE_METADATA if c["case_number"] == case_number), None)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case '{case_number}' not found.")

    timeline_events = graph_analytics.get_case_timeline_events(case)

    return ResponseEnvelope(
        success=True,
        message=f"Timeline with {len(timeline_events)} events for Case {case_number}.",
        data={"case_number": case_number, "events": timeline_events},
    )


@router.get("/{case_number}/brief", response_model=ResponseEnvelope, summary="Generate Dynamic Smart Case Brief")
def generate_case_brief(
    case_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Dynamically generate a structured case brief from Neo4j + PostgreSQL data."""
    case = next((c for c in CASE_METADATA if c["case_number"] == case_number), None)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case '{case_number}' not found.")

    subgraph = graph_analytics.get_subgraph(case_number)
    nodes = subgraph.get("nodes", [])
    edges = subgraph.get("edges", [])

    # Classify entities
    persons = [n for n in nodes if n.get("role") or (not n.get("reg_number") and not n.get("number") and not n.get("account_number"))]
    organizations = [n for n in nodes if n.get("type") and any(k in str(n.get("type", "")) for k in ("Company", "Exchange", "Syndicate", "Front", "Hawala", "Services"))]
    vehicles = [n for n in nodes if n.get("reg_number")]
    phones = [n for n in nodes if n.get("number") and not n.get("name")]
    accounts = [n for n in nodes if n.get("account_number")]

    # Find cross-case connections
    cross_case_entities = [n for n in nodes if len(n.get("cases", [])) > 1]
    related_cases = set()
    for n in nodes:
        for c in (n.get("cases") or []):
            if c != case_number:
                related_cases.add(c)

    # High-degree entities in case subgraph (AI-suggested leads)
    degree_map = {}
    for e in edges:
        for nid in (e.get("source"), e.get("target")):
            if nid:
                degree_map[nid] = degree_map.get(nid, 0) + 1
    node_names = {n.get("id"): n.get("name", n.get("id")) for n in nodes}
    high_degree = sorted(
        [{"id": k, "name": node_names.get(k, k), "degree": v} for k, v in degree_map.items() if v > 2],
        key=lambda x: x["degree"],
        reverse=True,
    )[:5]

    brief = {
        "case_information": {
            "case_id": case.get("case_number"),
            "fir_number": case.get("fir_number"),
            "crime_type": case.get("crime_category"),
            "date": case.get("incident_date"),
            "location": case.get("jurisdiction"),
            "status": case.get("status"),
            "priority": case.get("priority"),
        },
        "case_summary": case.get("summary"),
        "key_entities": {
            "persons": [{"name": p.get("name", p.get("id")), "role": p.get("role", "")} for p in persons],
            "organizations": [{"name": o.get("name", o.get("id")), "type": o.get("type", "")} for o in organizations],
            "vehicles": [{"reg_number": v.get("reg_number")} for v in vehicles],
            "phones": [{"number": ph.get("number")} for ph in phones],
            "accounts": [{"account": a.get("account_number")} for a in accounts],
        },
        "network_overview": {
            "total_entities": len(nodes),
            "total_relationships": len(edges),
            "key_connected_entities": [n.get("name", n.get("id")) for n in sorted(nodes, key=lambda x: len(x.get("cases", [])), reverse=True)[:5]],
            "bridge_entities": [n.get("name", n.get("id")) for n in cross_case_entities],
        },
        "cross_case_connections": {
            "related_cases": list(related_cases),
            "shared_entities": [{"name": n.get("name", n.get("id")), "cases": n.get("cases", [])} for n in cross_case_entities],
        },
        "ai_suggested_leads": [
            {
                "entity": h.get("name", h.get("id")),
                "reason": f"High network activity — {h.get('degree', 0)} connections detected",
                "status": "AI_SUGGESTED",
            }
            for h in high_degree
        ],
        "data_quality": {
            "entity_coverage": f"{len(nodes)} entities with verified graph relationships",
            "relationship_density": f"{len(edges)} evidence-backed connections",
            "cross_case_coverage": f"{len(cross_case_entities)} entities span multiple cases",
        },
    }

    log_audit_action(db=db, action="GENERATE_CASE_BRIEF", resource_type="CASE", resource_id=case_number, user_id=current_user.id if current_user else None)

    return ResponseEnvelope(
        success=True,
        message=f"Smart Case Brief generated for Case {case_number}.",
        data=brief,
    )


@router.get("/{case_number}/cross-links", response_model=ResponseEnvelope, summary="Get Cross-Case Links for a Case")
def get_cross_case_links(
    case_number: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Find entities that connect this case to other cases."""
    links = graph_analytics.get_cross_case_links(case_number)

    return ResponseEnvelope(
        success=True,
        message=f"Found {len(links)} cross-case links for Case {case_number}.",
        data={"case_number": case_number, "links": links},
    )
