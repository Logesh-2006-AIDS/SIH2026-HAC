/**
 * CRIMENEXUS AI — Permission Guard
 * Wraps page content. If the current user's role does not permit the page, renders AccessRestricted.
 */
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, ArrowLeft } from 'lucide-react';

export default function PermissionGuard({ pageId, children, onRedirect }) {
  const { checkPermission, role, metadata } = useAuth();

  if (!checkPermission(pageId)) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-6 p-8 rounded-2xl bg-slate-900/80 border border-red-500/30 backdrop-blur-xl shadow-2xl">
          {/* Lock Icon */}
          <div className="w-20 h-20 mx-auto rounded-full bg-red-950/50 border-2 border-red-500/40 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <Shield className="w-10 h-10 text-red-500" />
          </div>

          {/* Title */}
          <div>
            <h2 className="text-xl font-bold text-red-400 tracking-wide">ACCESS RESTRICTED</h2>
            <p className="text-xs text-slate-400 mt-2 font-mono">
              Your role <span className="text-cyan-400 font-bold uppercase">[{role}]</span> does not have permission to access this module.
            </p>
          </div>

          {/* Attempted Page */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-500">
            Attempted page: <span className="text-red-400 font-bold">{pageId}</span>
          </div>

          {/* Return Button */}
          <button
            onClick={onRedirect}
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:opacity-90 text-white font-bold text-xs transition shadow-lg shadow-cyan-500/20"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to {metadata?.workstationTitle || 'Dashboard'}</span>
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
