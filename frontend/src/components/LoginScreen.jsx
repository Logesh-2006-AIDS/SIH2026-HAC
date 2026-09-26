import React, { useState, useEffect } from 'react';
import { 
  Shield, BadgeCheck, Lock, ArrowRight, Eye, EyeOff, Sparkles, 
  Network, Database, FileText, Search, Activity, GitBranch, Crosshair, Map,
  ChevronDown, Server, BrainCircuit, Users, Cpu, FileWarning, Layers, CheckCircle,
  Pin, FolderOpen, Bot, BarChart3
} from 'lucide-react';

const ROLES = [
  { id: 'investigator', label: 'Investigator', role: 'INVESTIGATOR' },
  { id: 'analyst',      label: 'Analyst',      role: 'ANALYST'       },
  { id: 'admin',        label: 'Station Admin',role: 'ADMIN'         },
];

const DEMO_USERS = {
  investigator: {
    id: 1,
    email: 'investigator@police.gov.in',
    password: 'investigator123',
    role: 'INVESTIGATOR',
    name: 'Insp. Rajesh Vardhan',
    full_name: 'Insp. Rajesh Vardhan',
    badge_number: 'DL-CB-9021',
    department: 'Narcotics & Special Cell, Chennai Unit',
  },
  analyst: {
    id: 2,
    email: 'analyst@police.gov.in',
    password: 'analyst123',
    role: 'ANALYST',
    name: 'Dr. Priya Sankar',
    full_name: 'Dr. Priya Sankar',
    badge_number: 'INT-908',
    department: 'Criminal Intelligence & Analytics Wing',
  },
  admin: {
    id: 3,
    email: 'admin@police.gov.in',
    password: 'admin123',
    role: 'ADMIN',
    name: 'Supt. K. Rao',
    full_name: 'Supt. K. Rao',
    badge_number: 'HQ-001',
    department: 'State Crime Records Bureau',
  },
};

export default function LoginScreen({ onAuthenticated }) {
  const [activeRole, setActiveRole] = useState('investigator');
  const [username, setUsername] = useState('investigator@police.gov.in');
  const [password, setPassword] = useState('investigator123');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const completeLogin = async (userProfile, roleId) => {
    let token = 'demo-token';
    try {
      const params = new URLSearchParams();
      params.append('username', userProfile.email || username);
      params.append('password', userProfile.password || password || 'investigator123');
      const authRes = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
      if (authRes.ok) {
        const json = await authRes.json();
        if (json?.data?.access_token) {
          token = json.data.access_token;
        }
      }
    } catch {
      // Keep demo-token fallback
    }

    localStorage.setItem('sih_token', token);
    localStorage.setItem('sih_user', JSON.stringify(userProfile));

    const dest = roleId === 'admin' || userProfile.role === 'ADMIN'
      ? '/admin'
      : roleId === 'analyst' || userProfile.role === 'ANALYST'
        ? '/analyst'
        : '/dashboard';

    window.history.pushState({}, '', dest);
    if (onAuthenticated) {
      onAuthenticated(userProfile);
    }
  };

  const quickLogin = (roleId) => {
    const u = DEMO_USERS[roleId];
    if (!u) return;
    setUsername(u.email);
    setPassword(u.password);
    setActiveRole(roleId);
    completeLogin(u, roleId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const match = Object.values(DEMO_USERS).find(
      (u) =>
        (u.email.toLowerCase() === username.trim().toLowerCase() ||
         u.badge_number.toLowerCase() === username.trim().toLowerCase()) &&
        u.password === password
    );

    if (!match) {
      const lower = username.toLowerCase();
      let fallbackKey = 'investigator';
      if (lower.includes('admin')) fallbackKey = 'admin';
      else if (lower.includes('analyst')) fallbackKey = 'analyst';

      if (password === 'demo' || password === 'password' || password.endsWith('123')) {
        const fallbackUser = DEMO_USERS[fallbackKey];
        completeLogin(fallbackUser, fallbackKey);
        setLoading(false);
        return;
      }

      setError('Incorrect badge / email or password. Demo passwords: investigator123 / analyst123 / admin123');
      setLoading(false);
      return;
    }

    const roleKey = match.role.toLowerCase();
    completeLogin(match, roleKey);
    setLoading(false);
  };

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <main className="relative min-h-screen w-full text-[#f1ebdd] font-sans overflow-x-hidden selection:bg-[#d9aa3d]/30">
      
      {/* Full-screen Fixed Background Video */}
      <div className="fixed inset-0 z-[-1]">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover"
          src="/landing page.mp4"
        ></video>
        {/* Subtle Overlay to ensure readability while keeping the video bright */}
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(217,170,61,0.1)_0%,rgba(5,7,6,0.4)_100%)]"></div>
      </div>
      {/* 1. TOP NAVBAR */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#050706]/90 backdrop-blur-md border-b border-[#d9aa3d]/10 py-3 shadow-lg' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d9aa3d] to-[#8a6515] text-[#101311] font-bold shadow-[0_0_15px_rgba(217,170,61,0.3)]">
              <Shield size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-[#f1ebdd] leading-tight">RiskLink</h1>
              <p className="text-[10px] text-[#d9aa3d] font-medium tracking-widest uppercase">AI Criminal Network Analysis</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#8a948c]">
            <button onClick={() => scrollTo('about')} className="hover:text-[#d9aa3d] transition-colors">About</button>
            <button onClick={() => scrollTo('workflow')} className="hover:text-[#d9aa3d] transition-colors">How It Works</button>
            <button onClick={() => scrollTo('intelligence')} className="hover:text-[#d9aa3d] transition-colors">Intelligence</button>
            <button onClick={() => scrollTo('access')} className="hover:text-[#d9aa3d] transition-colors">Access</button>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 border-r border-white/10 pr-4">
              <button onClick={() => quickLogin('investigator')} className="text-[10px] uppercase font-bold text-[#8a948c] hover:text-[#d9aa3d] px-2 py-1 border border-transparent hover:border-[#d9aa3d]/30 rounded transition-all">Investigator</button>
              <button onClick={() => quickLogin('analyst')} className="text-[10px] uppercase font-bold text-[#8a948c] hover:text-[#d9aa3d] px-2 py-1 border border-transparent hover:border-[#d9aa3d]/30 rounded transition-all">Analyst</button>
              <button onClick={() => quickLogin('admin')} className="text-[10px] uppercase font-bold text-[#8a948c] hover:text-[#d62828] px-2 py-1 border border-transparent hover:border-[#d62828]/30 rounded transition-all">Admin</button>
            </div>
            <button onClick={() => scrollTo('access')} className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#d9aa3d] to-[#b48825] px-4 py-2 text-xs font-bold text-[#050706] transition hover:brightness-110 cursor-pointer shadow-[0_0_15px_rgba(217,170,61,0.2)]">
              Enter Workbench <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative min-h-[100vh] flex flex-col items-center justify-center pt-24 px-4 overflow-hidden border-b border-white/10">

        <div className="relative z-10 max-w-4xl mx-auto text-center mt-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#d9aa3d]/30 bg-[#d9aa3d]/10 text-[#d9aa3d] text-[10px] font-bold tracking-widest uppercase mb-8 shadow-[0_0_15px_rgba(217,170,61,0.15)]">
            <Sparkles size={12} /> Next-Generation Intelligence
          </div>
          
          <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            Detect. <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d9aa3d] to-[#8a6515]">Connect.</span> Investigate.
          </h2>
          
          <p className="text-lg md:text-xl text-[#8a948c] mb-8 max-w-2xl mx-auto leading-relaxed font-light">
            AI-powered criminal network analysis for uncovering suspicious patterns, connected entities, and complex investigations.
          </p>
          
          <p className="text-sm text-white/50 mb-10 max-w-xl mx-auto">
            RiskLink transforms fragmented case data, FIRs, CDRs, transactions, and entity relationships into connected forensic intelligence.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => scrollTo('about')} className="w-full sm:w-auto px-8 py-3 rounded-lg border border-white/10 hover:border-[#d9aa3d]/50 bg-white/5 hover:bg-white/10 transition text-sm font-bold tracking-wide">
              Explore RiskLink
            </button>
            <button onClick={() => scrollTo('access')} className="w-full sm:w-auto px-8 py-3 rounded-lg bg-gradient-to-r from-[#d9aa3d] to-[#997328] hover:to-[#b48825] text-[#050706] transition shadow-[0_0_20px_rgba(217,170,61,0.2)] text-sm font-bold tracking-wide flex items-center justify-center gap-2">
              Enter Workbench <ArrowRight size={16} />
            </button>
          </div>
        </div>
        
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-50">
          <ChevronDown size={24} className="text-[#d9aa3d]" />
        </div>
      </section>

      {/* 3. ABOUT RISKLINK */}
      <section id="about" className="py-24 px-6 relative border-b border-white/10 bg-transparent">
        <div className="max-w-6xl mx-auto text-center">
          <h3 className="text-sm font-bold tracking-widest text-[#d9aa3d] uppercase mb-4">What is RiskLink?</h3>
          <p className="text-2xl md:text-3xl font-medium text-white/90 max-w-3xl mx-auto leading-relaxed mb-16">
            RiskLink is an AI-powered criminal network analysis platform that helps investigators transform fragmented case data into connected intelligence.
          </p>
          
          <div className="flex flex-wrap justify-center items-center gap-2 md:gap-4 text-xs md:text-sm font-bold text-[#8a948c]">
            <div className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-xl border border-white/5 min-w-[120px]">
              <FileText className="text-white/60" size={24} />
              <span>Case Data</span>
            </div>
            <ArrowRight className="text-[#d9aa3d]/50 hidden md:block" size={20} />
            <div className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-xl border border-white/5 min-w-[120px]">
              <Cpu className="text-white/60" size={24} />
              <span>Entity Extraction</span>
            </div>
            <ArrowRight className="text-[#d9aa3d]/50 hidden md:block" size={20} />
            <div className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-xl border border-[#d9aa3d]/20 bg-[#d9aa3d]/5 min-w-[120px]">
              <Network className="text-[#d9aa3d]" size={24} />
              <span className="text-[#d9aa3d]">Network Construction</span>
            </div>
            <ArrowRight className="text-[#d9aa3d]/50 hidden md:block" size={20} />
            <div className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-xl border border-[#d62828]/20 bg-[#d62828]/5 min-w-[120px]">
              <Crosshair className="text-[#d62828]" size={24} />
              <span className="text-[#d62828]">Pattern Detection</span>
            </div>
            <ArrowRight className="text-[#d9aa3d]/50 hidden md:block" size={20} />
            <div className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-xl border border-white/5 min-w-[120px]">
              <Shield className="text-white/60" size={24} />
              <span>Investigation</span>
            </div>
            <ArrowRight className="text-[#d9aa3d]/50 hidden md:block" size={20} />
            <div className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-xl border border-white/5 min-w-[120px]">
              <Sparkles className="text-white/60" size={24} />
              <span>Intelligence</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW RISKLINK WORKS */}
      <section id="workflow" className="py-24 px-6 relative border-b border-white/10 bg-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-sm font-bold tracking-widest text-[#d9aa3d] uppercase mb-4">The Process</h3>
            <h2 className="text-3xl md:text-4xl font-bold">How RiskLink Works</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { num: '01', title: 'Data Ingestion', desc: 'FIRs, CDRs and case files are uploaded securely.', icon: Database },
              { num: '02', title: 'NLP & Extraction', desc: 'Important people, accounts, locations and relationships are extracted.', icon: BrainCircuit },
              { num: '03', title: 'Knowledge Graph', desc: 'Entities become connected nodes and relationships become edges.', icon: Network },
              { num: '04', title: 'Pattern Detection', desc: 'Loops, burst activity, and suspicious relationships are identified.', icon: Activity, color: '#d62828' },
              { num: '05', title: 'Investigation', desc: 'Investigators explore cases, timelines, and network relationships.', icon: Search },
              { num: '06', title: 'AI Copilot', desc: 'Ask natural-language questions about the current case.', icon: Bot },
              { num: '07', title: 'Evidence & Reports', desc: 'Evidence and investigation findings are organized for court.', icon: FileText },
            ].map((step, i) => (
              <div key={i} className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-[#d9aa3d]/40 transition-all hover:-translate-y-1 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition text-white">
                  <step.icon size={100} />
                </div>
                <div className="text-[10px] font-bold text-white/40 mb-4">{step.num}</div>
                <step.icon size={24} color={step.color || '#d9aa3d'} className="mb-4" />
                <h4 className="font-bold text-lg mb-2">{step.title}</h4>
                <p className="text-sm text-[#8a948c] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. NETWORK INTELLIGENCE SECTION */}
      <section id="intelligence" className="py-24 px-6 relative border-b border-white/10 bg-transparent overflow-hidden">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_70%_50%,rgba(217,170,61,0.08)_0%,transparent_50%)]"></div>
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10">
          <div className="flex-1">
            <h3 className="text-sm font-bold tracking-widest text-[#d9aa3d] uppercase mb-4">Interactive Graph</h3>
            <h2 className="text-3xl md:text-5xl font-bold mb-6">See the Network Behind the Case</h2>
            <p className="text-lg text-[#8a948c] mb-8 leading-relaxed">
              Graph analysis helps investigators move beyond individual records and understand hidden relationships between entities. Track money flows, communication bursts, and shared assets instantly.
            </p>
            <ul className="space-y-4 text-sm font-medium">
              <li className="flex items-center gap-3"><CheckCircle size={18} className="text-[#d9aa3d]"/> Entity Inspector</li>
              <li className="flex items-center gap-3"><CheckCircle size={18} className="text-[#d9aa3d]"/> Red-String Path Finder</li>
              <li className="flex items-center gap-3"><CheckCircle size={18} className="text-[#d9aa3d]"/> Interactive Network Graph</li>
            </ul>
          </div>
          
          <div className="flex-1 w-full relative h-[400px] border border-white/10 rounded-2xl bg-black/40 backdrop-blur-sm p-6 shadow-2xl flex items-center justify-center">
            {/* CSS Interactive-looking graph */}
            <div className="relative w-full h-full">
              {/* Lines */}
              <svg className="absolute inset-0 w-full h-full stroke-white/20" strokeWidth="2">
                <line x1="20%" y1="20%" x2="50%" y2="50%" strokeDasharray="4 4" className="animate-[dash_20s_linear_infinite]" />
                <line x1="50%" y1="50%" x2="80%" y2="30%" />
                <line x1="50%" y1="50%" x2="70%" y2="80%" stroke="#d62828" strokeWidth="3" />
                <line x1="20%" y1="80%" x2="50%" y2="50%" />
              </svg>
              
              {/* Nodes */}
              <div className="absolute top-[20%] left-[20%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center group-hover:border-white/80 transition"><Users size={16}/></div>
                <span className="mt-2 text-[10px] bg-black/50 px-2 py-1 rounded">Suspect</span>
              </div>
              <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="absolute inset-0 rounded-full border border-[#d9aa3d] animate-ping opacity-50 w-16 h-16 -ml-3 -mt-3"></div>
                <div className="w-10 h-10 rounded-full bg-[#d9aa3d]/20 border-2 border-[#d9aa3d] flex items-center justify-center z-10"><Database size={16} className="text-[#d9aa3d]"/></div>
                <span className="mt-2 text-[10px] bg-black/50 px-2 py-1 rounded text-[#d9aa3d]">Account</span>
              </div>
              <div className="absolute top-[30%] left-[80%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center"><Sparkles size={16}/></div>
                <span className="mt-2 text-[10px] bg-black/50 px-2 py-1 rounded">Related Entity</span>
              </div>
              <div className="absolute top-[80%] left-[70%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-[#d62828]/20 border-2 border-[#d62828] flex items-center justify-center"><Activity size={16} className="text-[#d62828]"/></div>
                <span className="mt-2 text-[10px] bg-black/50 px-2 py-1 rounded text-[#d62828]">High-Freq Transaction</span>
              </div>
              <div className="absolute top-[80%] left-[20%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center"><Map size={16}/></div>
                <span className="mt-2 text-[10px] bg-black/50 px-2 py-1 rounded">Location</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. INVESTIGATOR WORKFLOW */}
      <section className="py-24 px-6 relative border-b border-white/10 bg-transparent">
        <div className="max-w-6xl mx-auto text-center">
          <h3 className="text-sm font-bold tracking-widest text-[#d9aa3d] uppercase mb-12">Investigator Workbench</h3>
          
          <div className="flex flex-col md:flex-row items-center justify-between relative">
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-y-1/2"></div>
            
            {[
              { label: 'Criminal Pinboard', icon: Pin },
              { label: 'Select Case', icon: FolderOpen },
              { label: 'Case Investigation', icon: Search },
              { label: 'Smart Case Brief', icon: FileText },
              { label: 'Timeline & Evidence', icon: Activity },
              { label: 'Network Analysis', icon: Network },
              { label: 'AI Copilot', icon: Bot },
            ].map((step, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center gap-3 mb-8 md:mb-0 group cursor-default">
                <div className="w-12 h-12 rounded-full bg-[#080a08] border border-white/10 flex items-center justify-center group-hover:border-[#d9aa3d] group-hover:bg-[#d9aa3d]/10 transition-all duration-300 shadow-xl">
                  <step.icon size={18} className="text-white/60 group-hover:text-[#d9aa3d]" />
                </div>
                <span className="text-[10px] uppercase font-bold text-[#8a948c] group-hover:text-white max-w-[80px] text-center leading-tight">
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. ANALYST + ADMIN */}
      <section className="py-24 px-6 relative border-b border-white/10 bg-transparent">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="border border-white/10 bg-[#050706] p-10 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5"><Layers size={150}/></div>
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3"><BarChart3 className="text-[#d9aa3d]"/> Strategic Analyst</h3>
            <p className="text-[#8a948c] mb-8 text-sm leading-relaxed">
              Focuses on macroeconomic trends, broad suspicious patterns, and identifying fraud rings across multiple isolated cases.
            </p>
            <ul className="space-y-3 text-sm text-white/80 font-medium">
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#d9aa3d]"></div> Macro-level analysis</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#d9aa3d]"></div> Geographical crime patterns & Heatmaps</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#d9aa3d]"></div> Cross-case fraud ring analysis</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#d62828]"></div> Suspicious burst activity detection</li>
            </ul>
          </div>

          <div className="border border-white/10 bg-[#050706] p-10 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5"><Shield size={150}/></div>
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-3"><Shield className="text-[#d62828]"/> System Admin</h3>
            <p className="text-[#8a948c] mb-8 text-sm leading-relaxed">
              Ensures tamper-proof evidence integrity, monitors API health, and oversees system-wide operational security.
            </p>
            <ul className="space-y-3 text-sm text-white/80 font-medium">
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#d62828]"></div> System health & API tracking</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#d62828]"></div> Comprehensive Audit logs</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#d62828]"></div> User activity monitoring</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#4ade80]"></div> Merkle tree integrity validation</li>
            </ul>
          </div>
          
        </div>
      </section>

      {/* 8. INTELLIGENCE ENGINE */}
      <section className="py-32 px-6 relative border-b border-white/10 bg-transparent overflow-hidden flex items-center justify-center min-h-[600px]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(217,170,61,0.05)_0%,transparent_60%)]"></div>
        
        <div className="relative w-full max-w-4xl aspect-square md:aspect-[2/1] flex items-center justify-center bg-black/60 backdrop-blur-xl border border-white/10 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.8)] p-8">
          {/* Connecting Lines */}
          <svg className="absolute inset-0 w-full h-full stroke-[#d9aa3d]/30" strokeWidth="1.5">
            <line x1="50%" y1="50%" x2="20%" y2="20%" className="animate-pulse" style={{ animationDuration: '3s' }} />
            <line x1="50%" y1="50%" x2="80%" y2="20%" className="animate-pulse" style={{ animationDuration: '4s' }} />
            <line x1="50%" y1="50%" x2="20%" y2="80%" className="animate-pulse" style={{ animationDuration: '2.5s' }} />
            <line x1="50%" y1="50%" x2="80%" y2="80%" className="animate-pulse" style={{ animationDuration: '3.5s' }} />
            <line x1="50%" y1="50%" x2="10%" y2="50%" className="animate-pulse" style={{ animationDuration: '4.5s' }} />
            <line x1="50%" y1="50%" x2="90%" y2="50%" className="animate-pulse" style={{ animationDuration: '2s' }} />
          </svg>

          {/* Center */}
          <div className="absolute z-20 flex flex-col items-center justify-center w-40 h-40 bg-[#080a08] border border-[#d9aa3d]/40 rounded-full shadow-[0_0_50px_rgba(217,170,61,0.25)]">
            <Cpu size={32} className="text-[#d9aa3d] mb-2" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-center leading-tight">RiskLink<br/>Engine</span>
          </div>

          {/* Orbiting Nodes */}
          <div className="absolute top-[10%] left-[10%] bg-[#080a08] border border-white/15 shadow-xl px-4 py-2 rounded-lg text-xs font-bold text-white/90">NLP Extraction</div>
          <div className="absolute top-[10%] right-[10%] bg-[#080a08] border border-white/15 shadow-xl px-4 py-2 rounded-lg text-xs font-bold text-white/90">Graph Analysis</div>
          <div className="absolute bottom-[10%] left-[10%] bg-[#080a08] border border-[#d62828]/40 shadow-[0_0_20px_rgba(214,40,40,0.15)] px-4 py-2 rounded-lg text-xs font-bold text-[#d62828]">Pattern Detection</div>
          <div className="absolute bottom-[10%] right-[10%] bg-[#080a08] border border-white/15 shadow-xl px-4 py-2 rounded-lg text-xs font-bold text-white/90">Case Intelligence</div>
          <div className="absolute top-[50%] left-[0%] -translate-y-1/2 bg-[#080a08] border border-[#d9aa3d]/40 shadow-[0_0_20px_rgba(217,170,61,0.15)] px-4 py-2 rounded-lg text-xs font-bold text-[#d9aa3d]">AI Copilot</div>
          <div className="absolute top-[50%] right-[0%] -translate-y-1/2 bg-[#080a08] border border-white/15 shadow-xl px-4 py-2 rounded-lg text-xs font-bold text-white/90">Evidence Analysis</div>
        </div>
      </section>

      {/* 9. ROLE ACCESS SECTION (The Login Forms) */}
      <section id="access" className="py-24 px-6 relative bg-transparent border-b border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Enter the RiskLink Workbench</h2>
            <p className="text-[#8a948c] text-sm max-w-2xl mx-auto">Select your operational role below to access the forensic intelligence platform.</p>
          </div>

          {/* Quick Access Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {/* Investigator */}
            <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-8 flex flex-col items-center text-center hover:border-[#d9aa3d]/40 transition group">
              <div className="w-16 h-16 rounded-full bg-[#d9aa3d]/10 border border-[#d9aa3d]/20 flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <Search size={28} className="text-[#d9aa3d]" />
              </div>
              <h3 className="text-xl font-bold mb-3">Investigator</h3>
              <p className="text-xs text-[#8a948c] mb-8 leading-relaxed flex-1">
                Case investigation, Network analysis, Evidence timeline, and AI Copilot assistance.
              </p>
              <button onClick={() => quickLogin('investigator')} className="w-full py-3 rounded-lg bg-white/5 border border-white/10 hover:bg-[#d9aa3d]/10 hover:border-[#d9aa3d]/30 hover:text-[#d9aa3d] font-bold text-sm transition">
                Enter as Investigator
              </button>
            </div>

            {/* Analyst */}
            <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-8 flex flex-col items-center text-center hover:border-[#d9aa3d]/40 transition group">
              <div className="w-16 h-16 rounded-full bg-[#d9aa3d]/10 border border-[#d9aa3d]/20 flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <Activity size={28} className="text-[#d9aa3d]" />
              </div>
              <h3 className="text-xl font-bold mb-3">Analyst</h3>
              <p className="text-xs text-[#8a948c] mb-8 leading-relaxed flex-1">
                Cross-case analysis, Macro patterns, Geographical intelligence, and Heatmaps.
              </p>
              <button onClick={() => quickLogin('analyst')} className="w-full py-3 rounded-lg bg-white/5 border border-white/10 hover:bg-[#d9aa3d]/10 hover:border-[#d9aa3d]/30 hover:text-[#d9aa3d] font-bold text-sm transition">
                Enter as Analyst
              </button>
            </div>

            {/* Admin */}
            <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-8 flex flex-col items-center text-center hover:border-[#d62828]/40 transition group">
              <div className="w-16 h-16 rounded-full bg-[#d62828]/10 border border-[#d62828]/20 flex items-center justify-center mb-6 group-hover:scale-110 transition">
                <Shield size={28} className="text-[#d62828]" />
              </div>
              <h3 className="text-xl font-bold mb-3">Admin</h3>
              <p className="text-xs text-[#8a948c] mb-8 leading-relaxed flex-1">
                System oversight, Audit logs, User activity, and Merkle tree integrity validation.
              </p>
              <button onClick={() => quickLogin('admin')} className="w-full py-3 rounded-lg bg-white/5 border border-white/10 hover:bg-[#d62828]/10 hover:border-[#d62828]/30 hover:text-[#d62828] font-bold text-sm transition">
                Enter as Admin
              </button>
            </div>
          </div>

          {/* Manual Credentials Box */}
          <div className="max-w-md mx-auto bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl">
            <div className="relative mb-6 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <span className="relative bg-black px-3 text-[10px] font-semibold text-[#8a948c] uppercase tracking-wider rounded-full">
                Or manual credentials sign-in
              </span>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="mb-1.5 block text-[10px] font-bold tracking-wide text-[#8a948c] uppercase">Badge / Official Email</label>
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3 transition focus-within:border-[#d9aa3d]/60">
                  <BadgeCheck size={16} className="text-[#d9aa3d] shrink-0" />
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. investigator@police.gov.in"
                    className="w-full bg-transparent text-sm text-[#f1ebdd] outline-none placeholder:text-[#8a948c]/60"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="mb-1.5 block text-[10px] font-bold tracking-wide text-[#8a948c] uppercase">Password</label>
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 px-4 py-3 transition focus-within:border-[#d9aa3d]/60">
                  <Lock size={16} className="text-[#d9aa3d] shrink-0" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter secure password"
                    className="w-full bg-transparent text-sm text-[#f1ebdd] outline-none placeholder:text-[#8a948c]/60"
                  />
                  <button type="button" onClick={() => setShowPw((v) => !v)} className="text-[#8a948c] hover:text-[#f1ebdd] transition">
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d9aa3d] to-[#d97706] px-4 py-3 text-sm font-bold text-[#101311] shadow-[0_0_15px_rgba(217,170,61,0.2)] transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
              >
                {loading ? 'Authenticating…' : 'Secure Login'}
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 10. FINAL CTA */}
      <section className="py-24 px-6 relative bg-transparent text-center border-b border-white/10">
        <h2 className="text-3xl md:text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white to-[#8a948c]">
          From fragmented data<br />to connected intelligence.
        </h2>
        <p className="text-[#8a948c] text-sm max-w-xl mx-auto mb-10 leading-relaxed">
          RiskLink helps transform complex case information into an investigation-ready intelligence workspace.
        </p>
        <button onClick={() => scrollTo('access')} className="px-8 py-3 rounded-lg border border-[#d9aa3d]/40 bg-[#d9aa3d]/10 hover:bg-[#d9aa3d]/20 text-[#d9aa3d] transition text-sm font-bold tracking-wide">
          Enter Forensic Workbench
        </button>
      </section>

      {/* 11. FOOTER */}
      <footer className="py-8 px-6 bg-black/40 backdrop-blur-md flex flex-col md:flex-row items-center justify-between text-xs text-[#8a948c]">
        <div className="flex items-center gap-2 mb-4 md:mb-0">
          <Shield size={14} className="text-[#d9aa3d]"/> 
          <span className="font-bold text-white/80">RiskLink</span> 
          <span>— AI Criminal Network Analysis Platform</span>
        </div>
        
        <div className="flex gap-6 mb-4 md:mb-0">
          <button onClick={() => scrollTo('about')} className="hover:text-white transition">About</button>
          <button onClick={() => scrollTo('workflow')} className="hover:text-white transition">How It Works</button>
          <button onClick={() => scrollTo('access')} className="hover:text-white transition">Access</button>
        </div>

        <div className="font-bold tracking-wider uppercase text-white/50">
          SIH 2026
        </div>
      </footer>
    </main>
  );
}
