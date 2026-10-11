import React from 'react';
import {
  BookOpen,
  Sparkles,
  Code2,
  ExternalLink,
  Terminal,
  Cpu,
  Layers,
  FileText,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export const StudentPackResources: React.FC = () => {
  const resources = [
    {
      title: 'Google Gemini API Toolkit',
      category: 'AI & Machine Learning',
      description: 'Prototype intelligent multimodal AI agents, chat assistants, and code analysis within student apps.',
      icon: Sparkles,
      iconColor: 'text-purple-400 bg-purple-500/10',
      link: 'https://ai.google.dev',
      tag: 'Recommended'
    },
    {
      title: 'Jetpack Compose Starter Template',
      category: 'Android UI / UX',
      description: 'Production Kotlin boilerplate implementing Material You, reactive state flows, and AVANYX navigation.',
      icon: Code2,
      iconColor: 'text-cyan-400 bg-cyan-500/10',
      link: 'https://developer.android.com/jetpack/compose',
      tag: 'Official'
    },
    {
      title: 'Firebase Firestore Web & Mobile SDK',
      category: 'Cloud Backend',
      description: 'Connect your student mobile app to live Firestore collections, Auth tokens, and real-time listeners.',
      icon: Layers,
      iconColor: 'text-amber-400 bg-amber-500/10',
      link: 'https://firebase.google.com/docs/firestore',
      tag: 'Database'
    },
    {
      title: 'Material Design 3 Guidelines',
      category: 'Design Systems',
      description: 'Official typography, dynamic color palette, and accessibility specifications for student app submissions.',
      icon: Cpu,
      iconColor: 'text-emerald-400 bg-emerald-500/10',
      link: 'https://m3.material.io',
      tag: 'Material You'
    },
    {
      title: 'GitHub Student Developer Pack',
      category: 'Developer Perks',
      description: 'Unlock free domain names, cloud computing credits, CI/CD minutes, and IDE licenses with your .edu email.',
      icon: Terminal,
      iconColor: 'text-blue-400 bg-blue-500/10',
      link: 'https://education.github.com/pack',
      tag: 'Free Perks'
    },
    {
      title: 'Open Source Licensing & Ethics Guide',
      category: 'Academic Compliance',
      description: 'Learn how to apply MIT, Apache 2.0, or GPL licenses to your academic coursework repositories.',
      icon: FileText,
      iconColor: 'text-rose-400 bg-rose-500/10',
      link: 'https://choosealicense.com',
      tag: 'Licensing'
    }
  ];

  return (
    <div id="student-resources-module" className="space-y-6">
      <div className="p-6 rounded-3xl bg-white dark:bg-[#131926] border border-black/10 dark:border-cyan-500/10 space-y-1 shadow-sm">
        <h3 className="text-base font-black text-[#1D1B20] dark:text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#6750A4] dark:text-cyan-400" />
          <span>Student Developer Pack & Learning Resources</span>
        </h3>
        <p className="text-xs text-[#49454F] dark:text-slate-400">
          Handpicked starter kits, API sandboxes, and documentation to accelerate your semester software projects.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {resources.map((res) => {
          const Icon = res.icon;
          return (
            <div
              key={res.title}
              className="p-6 rounded-3xl bg-white dark:bg-[#131926] border border-black/10 dark:border-cyan-500/10 hover:border-[#6750A4]/30 dark:hover:border-cyan-500/30 transition-all space-y-4 flex flex-col justify-between group shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${res.iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-black/5 dark:bg-white/5 text-[#1D1B20] dark:text-slate-300 border border-black/10 dark:border-white/10">
                    {res.tag}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-[#6750A4] dark:text-cyan-400 uppercase tracking-wider block">
                    {res.category}
                  </span>
                  <h4 className="text-sm font-black text-[#1D1B20] dark:text-white group-hover:text-[#6750A4] dark:group-hover:text-cyan-300 transition-colors">
                    {res.title}
                  </h4>
                </div>

                <p className="text-xs text-[#49454F] dark:text-slate-400 leading-relaxed">
                  {res.description}
                </p>
              </div>

              <div className="pt-3 border-t border-black/5 dark:border-cyan-500/10 flex items-center justify-between">
                <span className="text-[11px] text-[#49454F] dark:text-slate-500">Free for verified students</span>
                <a
                  href={res.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6750A4] dark:text-cyan-400 hover:text-[#523e85] dark:hover:text-cyan-300 group-hover:underline"
                >
                  <span>Open Resource</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
