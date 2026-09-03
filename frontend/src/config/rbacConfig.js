/**
 * CRIMENEXUS AI — Centralized Role-Based Access Control Configuration
 * Single source of truth for all navigation, permissions, and page routing.
 */
import {
  LayoutDashboard, FolderOpen, UploadCloud, Briefcase, Search, Share2,
  GitMerge, ShieldCheck, Bot, FileText, BarChart3, MapPin, Network,
  Users as UsersIcon, Sparkles, Database, Server, Settings, Activity,
  Shield, Layers, FileSpreadsheet, Cpu, Eye, TrendingUp, Target,
  Link2, Globe, Lock, AlertTriangle, CheckCircle2, Zap
} from 'lucide-react';

// ─── Role Identifiers ───────────────────────────────────────────────
export const ROLES = {
  INVESTIGATOR: 'investigator',
  ANALYST: 'analyst',
  ADMIN: 'admin',
};

// ─── Role Metadata ──────────────────────────────────────────────────
export const roleMetadata = {
  [ROLES.INVESTIGATOR]: {
    displayName: 'Senior Investigating Officer',
    shortName: 'Investigator',
    workstationTitle: 'CASE WORKSTATION',
    accentColor: 'red',
    landingPage: 'inv_overview',
  },
  [ROLES.ANALYST]: {
    displayName: 'Intelligence Analyst',
    shortName: 'Analyst',
    workstationTitle: 'INTELLIGENCE WORKSTATION',
    accentColor: 'crimson',
    landingPage: 'intel_overview',
  },
  [ROLES.ADMIN]: {
    displayName: 'Chief Administrator',
    shortName: 'Administrator',
    workstationTitle: 'SYSTEM CONTROL',
    accentColor: 'scarlet',
    landingPage: 'admin_overview',
  },
};

// ─── Navigation Configuration (role → sidebar sections) ─────────────
export const navigationConfig = {
  // ── INVESTIGATOR ──────────────────────────────────────────────────
  [ROLES.INVESTIGATOR]: [
    {
      title: 'INVESTIGATION',
      items: [
        { id: 'inv_overview', label: 'Investigation Overview', icon: LayoutDashboard },
        { id: 'cases', label: 'Cases', icon: FolderOpen, badge: 'ACTIVE' },
        { id: 'fir_upload', label: 'FIR / Document Upload', icon: UploadCloud },
        { id: 'workbench', label: 'Case Explorer', icon: Briefcase, badge: 'LIVE' },
      ],
    },
    {
      title: 'EVIDENCE & NETWORK',
      items: [
        { id: 'entity_search', label: 'Entity Search', icon: Search },
        { id: 'inv_network', label: 'Investigation Network', icon: Share2 },
        { id: 'cross_case', label: 'Cross-Case Connections', icon: GitMerge },
      ],
    },
    {
      title: 'VERIFICATION & AI',
      items: [
        { id: 'verification', label: 'Lead Verification', icon: ShieldCheck, badge: 'Review' },
        { id: 'copilot', label: 'AI Investigation Copilot', icon: Bot, badge: 'Smart' },
        { id: 'inv_reports', label: 'Reports', icon: FileText },
      ],
    },
  ],

  // ── ANALYST ───────────────────────────────────────────────────────
  [ROLES.ANALYST]: [
    {
      title: 'INTELLIGENCE CORE',
      items: [
        { id: 'intel_overview', label: 'Intelligence Overview', icon: LayoutDashboard },
        { id: 'graph', label: 'Knowledge Graph', icon: Share2, badge: 'Neo4j' },
        { id: 'analytics', label: 'Network Analysis', icon: BarChart3 },
        { id: 'entity_explorer', label: 'Entity Explorer', icon: Search },
      ],
    },
    {
      title: 'GRAPH ANALYTICS',
      items: [
        { id: 'centrality', label: 'Centrality Analysis', icon: Target },
        { id: 'community', label: 'Community Detection', icon: Network },
        { id: 'shortest_path', label: 'Shortest Path', icon: GitMerge },
        { id: 'link_prediction', label: 'Link Prediction', icon: Link2, badge: 'AI' },
      ],
    },
    {
      title: 'GEOSPATIAL & TRENDS',
      items: [
        { id: 'cross_intel', label: 'Cross-Case Intelligence', icon: Layers },
        { id: 'heatmap', label: 'Geospatial Heatmap', icon: MapPin },
        { id: 'crime_trends', label: 'Crime Trends', icon: TrendingUp },
      ],
    },
    {
      title: 'AI & REPORTS',
      items: [
        { id: 'ai_insights', label: 'AI Insights', icon: Sparkles },
        { id: 'intel_reports', label: 'Investigation Reports', icon: FileText },
      ],
    },
  ],

  // ── ADMIN ─────────────────────────────────────────────────────────
  [ROLES.ADMIN]: [
    {
      title: 'ADMINISTRATION',
      items: [
        { id: 'admin_overview', label: 'Admin Overview', icon: LayoutDashboard },
        { id: 'dataset_mgmt', label: 'Dataset Management', icon: Database },
        { id: 'ingestion', label: 'Data Ingestion', icon: UploadCloud },
        { id: 'data_validation', label: 'Data Validation', icon: CheckCircle2 },
      ],
    },
    {
      title: 'DATABASE',
      items: [
        { id: 'entity_resolution', label: 'Entity Resolution Queue', icon: GitMerge },
        { id: 'neo4j_db', label: 'Neo4j Database', icon: Share2, badge: 'Graph' },
        { id: 'system_health', label: 'System Health', icon: Activity },
      ],
    },
    {
      title: 'SECURITY & COMPLIANCE',
      items: [
        { id: 'users', label: 'User & Role Management', icon: UsersIcon },
        { id: 'security', label: 'Security & RBAC', icon: Lock },
        { id: 'audit', label: 'Audit Logs', icon: FileSpreadsheet, badge: 'SHA-256' },
        { id: 'data_quality', label: 'Data Quality', icon: AlertTriangle },
        { id: 'sys_config', label: 'System Configuration', icon: Settings },
      ],
    },
  ],
};

// ─── Permission Sets (derived from navigationConfig) ────────────────
export const rolePermissions = {};
Object.entries(navigationConfig).forEach(([role, sections]) => {
  rolePermissions[role] = new Set();
  sections.forEach((section) => {
    section.items.forEach((item) => {
      rolePermissions[role].add(item.id);
    });
  });
});

// ─── Helper Functions ───────────────────────────────────────────────
export function hasPermission(role, pageId) {
  const perms = rolePermissions[role];
  return perms ? perms.has(pageId) : false;
}

export function getLandingPage(role) {
  return roleMetadata[role]?.landingPage || 'inv_overview';
}

export function getNavigationForRole(role) {
  return navigationConfig[role] || [];
}

export function getRoleMetadata(role) {
  return roleMetadata[role] || roleMetadata[ROLES.INVESTIGATOR];
}
