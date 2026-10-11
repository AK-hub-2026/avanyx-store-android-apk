import React from 'react';
import {
  ShieldCheck,
  Check,
  X,
  ArrowRight,
  GraduationCap,
  Code2,
  Lock,
  Sparkles
} from 'lucide-react';

interface StudentPermissionsMatrixProps {
  onApplyDeveloper: () => void;
}

export const StudentPermissionsMatrix: React.FC<StudentPermissionsMatrixProps> = ({
  onApplyDeveloper
}) => {
  const permissions = [
    {
      feature: 'Publish to AVANYX Store',
      student: 'Free Educational Only',
      developer: 'Free & Commercial',
      admin: 'Full Unlimited',
      studentOk: true
    },
    {
      feature: 'Verified Student Badge',
      student: 'Yes (Verified)',
      developer: 'No (Commercial)',
      admin: 'Admin Authority',
      studentOk: true
    },
    {
      feature: 'Student Spotlight Eligibility',
      student: 'Automatic Priority',
      developer: 'Special Request',
      admin: 'Curated by Admin',
      studentOk: true
    },
    {
      feature: 'Direct APK Release Distribution',
      student: 'Yes (GitHub/Direct)',
      developer: 'Yes (Multi-channel)',
      admin: 'Full Storage',
      studentOk: true
    },
    {
      feature: 'In-App Purchases & Monetization',
      student: 'Strictly Prohibited',
      developer: 'Permitted',
      admin: 'Permitted',
      studentOk: false
    },
    {
      feature: 'Custom Developer Domain Linking',
      student: 'Subdomain / .edu only',
      developer: 'Custom Domain',
      admin: 'Full DNS Admin',
      studentOk: false
    },
    {
      feature: 'Commercial Analytics & Telemetry',
      student: 'Academic Telemetry',
      developer: 'Full Multi-Stream',
      admin: 'Global Analytics',
      studentOk: true
    },
    {
      feature: 'Store Promotion Requests',
      student: 'Academic Spotlight',
      developer: 'Paid & Organic',
      admin: 'Promotion Manager',
      studentOk: true
    }
  ];

  return (
    <div id="student-permissions-module" className="space-y-6">
      <div className="p-6 rounded-3xl bg-white dark:bg-[#131926] border border-black/10 dark:border-cyan-500/10 space-y-1 shadow-sm">
        <h3 className="text-base font-black text-[#1D1B20] dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#6750A4] dark:text-cyan-400" />
          <span>Role-Based Access Control (RBAC) & Academic Privileges</span>
        </h3>
        <p className="text-xs text-[#49454F] dark:text-slate-400">
          Compare the privileges of the Student Developer role against Commercial Developers and Store Admins.
        </p>
      </div>

      {/* Comparison Table */}
      <div className="overflow-hidden rounded-3xl bg-white dark:bg-[#131926] border border-black/10 dark:border-cyan-500/10 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1D1B20] dark:text-slate-300">
            <thead className="bg-[#F8F9FA] dark:bg-[#0B0F17] text-[#49454F] dark:text-slate-400 uppercase text-[10px] tracking-wider font-bold border-b border-black/10 dark:border-cyan-500/10">
              <tr>
                <th className="py-4 px-6">Capability / Scope</th>
                <th className="py-4 px-6 text-[#6750A4] dark:text-cyan-400 font-black">
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4" />
                    <span>Student Tier</span>
                  </div>
                </th>
                <th className="py-4 px-6 text-purple-700 dark:text-purple-400 font-bold">
                  <div className="flex items-center gap-1.5">
                    <Code2 className="w-4 h-4" />
                    <span>Commercial Dev</span>
                  </div>
                </th>
                <th className="py-4 px-6 text-amber-700 dark:text-amber-400 font-bold">
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-4 h-4" />
                    <span>Store Admin</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-cyan-500/10">
              {permissions.map((p) => (
                <tr key={p.feature} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-6 font-semibold text-[#1D1B20] dark:text-white">{p.feature}</td>
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-2">
                      {p.studentOk ? (
                        <Check className="w-4 h-4 text-[#6750A4] dark:text-cyan-400 shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                      )}
                      <span className={p.studentOk ? 'text-[#6750A4] dark:text-cyan-300 font-bold' : 'text-slate-400 dark:text-slate-500'}>
                        {p.student}
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-6 text-purple-800 dark:text-purple-300 font-medium">{p.developer}</td>
                  <td className="py-3.5 px-6 text-amber-800 dark:text-amber-300 font-medium">{p.admin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upgrade Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-100 via-white to-purple-50 dark:from-purple-900/30 dark:via-[#131926] dark:to-cyan-950/30 border border-purple-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 font-black text-sm">
            <Sparkles className="w-4 h-4" />
            <span>Ready for Commercial Publishing?</span>
          </div>
          <p className="text-xs text-[#49454F] dark:text-slate-400 max-w-xl">
            If your application is transitioning from a university class project to a commercial startup or monetized app, apply for the Full Commercial Developer status.
          </p>
        </div>

        <button
          onClick={onApplyDeveloper}
          className="px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs transition-all shadow-md flex items-center gap-2 shrink-0 self-start md:self-auto"
        >
          <span>Apply for Full Developer</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
