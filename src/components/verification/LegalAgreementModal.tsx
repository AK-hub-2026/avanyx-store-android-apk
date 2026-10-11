import React, { useState } from 'react';
import {
  ShieldCheck,
  FileText,
  Lock,
  BookOpen,
  CheckCircle2,
  X,
  Scale,
  Award,
  AlertTriangle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export type LegalDocType =
  | 'DEVELOPER_TERMS'
  | 'DEVELOPER_PRIVACY'
  | 'CONTENT_POLICY'
  | 'COMMUNITY_GUIDELINES'
  | 'STUDENT_AGREEMENT'
  | 'APP_SUBMISSION_AGREEMENT';

interface LegalAgreementModalProps {
  isOpen: boolean;
  initialDoc?: LegalDocType;
  onClose: () => void;
  onAccept?: () => void;
}

interface PolicySection {
  title: string;
  content: string[];
}

export const LEGAL_DOCS_DATA: Record<
  LegalDocType,
  {
    title: string;
    subtitle: string;
    version: string;
    lastUpdated: string;
    badge: string;
    sections: PolicySection[];
  }
> = {
  DEVELOPER_TERMS: {
    title: 'AVANYX Developer Terms & Conditions',
    subtitle: 'Standard Publisher & Distribution Agreement for Verified Developers (18+)',
    version: 'v3.4.2',
    lastUpdated: 'October 2026',
    badge: 'Mandatory Compliance',
    sections: [
      {
        title: '1. Developer Eligibility & Account Integrity',
        content: [
          'Publishers must be at least 18 years of age or represent a legally recognized business entity to distribute commercial applications on AVANYX Store.',
          'All identity documentation, government-issued IDs (masked Aadhaar/PAN), and contact details submitted during developer onboarding must be accurate, valid, and authentic.',
          'Account credentials and developer cryptographic signing keys must be securely held. Developers are strictly liable for all binary updates deployed under their developer key.'
        ]
      },
      {
        title: '2. Application Distribution & Binary Clearance',
        content: [
          'Developers grant AVANYX Store a worldwide, non-exclusive license to host, index, showcase, and distribute submitted Android Package Kit (APK) binaries.',
          'All binaries must target Android 13 (API Level 33) or higher (Android 14 API 34 recommended) and supply cryptographic SHA-256 integrity signatures matching their release keystore.',
          'AVANYX Store operates an AI-assisted and human security verification pipeline. Automated pre-flight scans and static binary analysis are conducted on every submission.'
        ]
      },
      {
        title: '3. Monetization, Pricing & Financial Settlements',
        content: [
          'Developers setting commercial price points for paid applications retain full ownership of their software IP and comply with store fee structures.',
          'Refund requests for defective binaries or non-functioning apps are evaluated within 48 hours in accordance with the AVANYX Consumer Protection Policy.',
          'Payout transfers require completed identity verification, valid tax/PAN data, and an active bank or payment settlement channel.'
        ]
      },
      {
        title: '4. Termination & License Revocation',
        content: [
          'AVANYX Store reserves the right to suspend or delist applications and revoke developer console access for severe policy violations, malware propagation, or fraudulent submissions.',
          'Developers may remove or unpublish their applications at any time from the Developer Console, subject to ongoing support obligations for existing users.'
        ]
      }
    ]
  },
  DEVELOPER_PRIVACY: {
    title: 'AVANYX Developer Privacy Policy',
    subtitle: 'Data Handling, User Telemetry & Sensitive Permissions Protocol',
    version: 'v3.4.2',
    lastUpdated: 'October 2026',
    badge: 'Zero Unconsented Telemetry',
    sections: [
      {
        title: '1. User Data Protection & Privacy By Design',
        content: [
          'Applications published on AVANYX Store must adhere to strict Privacy by Design principles. Unconsented data harvesting or background biometric profiling is strictly prohibited.',
          'Developers must clearly publish an accessible, public Privacy Policy URL that discloses exactly what user data is collected, stored, processed, or shared.',
          'Zero tracking of child users is permitted. Applications targeting educational audiences must comply with COPPA, GDPR-K, and India Digital Personal Data Protection (DPDP) Act standards.'
        ]
      },
      {
        title: '2. Permissions Disclosure & Least Privilege',
        content: [
          'Applications must request only the minimum runtime permissions essential to their core user-facing functionality.',
          'Sensitive Android permissions (including ACCESS_FINE_LOCATION, READ_EXTERNAL_STORAGE, CAMERA, and RECORD_AUDIO) require clear user justification and in-app disclosure before prompting.',
          'Background location tracking and accessibility service abuse for tracking purposes will trigger immediate binary rejection.'
        ]
      },
      {
        title: '3. Identity Verification Data Handling',
        content: [
          'All Aadhaar numbers submitted for developer verification are masked at rest (e.g. XXXX-XXXX-1234) and stored exclusively in dedicated encrypted access storage systems.',
          'Identity records are accessed solely by authorized AVANYX Store moderation staff for fraud prevention and are never shared with advertisers or third parties.'
        ]
      }
    ]
  },
  CONTENT_POLICY: {
    title: 'AVANYX Content & App Policy',
    subtitle: 'Standards for Software Quality, Safety, and Permissible Content',
    version: 'v3.4.2',
    lastUpdated: 'October 2026',
    badge: 'Strictly Enforced',
    sections: [
      {
        title: '1. Restricted & Forbidden Content',
        content: [
          'Zero tolerance for malware, trojans, ransomware, spyware, hidden miners, unauthorized SMS dialers, or exploit payloads.',
          'Hate speech, violent extremism, illegal substance facilitation, non-consensual sexual content, or deceptive phishing interfaces are strictly prohibited.',
          'Impersonation of existing brands, misleading titles, or deceptive thumbnail graphics designed to trick users into downloading unintended software will result in permanent developer ban.'
        ]
      },
      {
        title: '2. Functional Performance & Stability',
        content: [
          'Applications must install cleanly, launch without instant crashes, and provide a functioning user experience.',
          'Placeholder applications, non-functional shells, or software containing broken web views with repetitive full-screen adware will be rejected during moderation.'
        ]
      },
      {
        title: '3. Intellectual Property & Copyright',
        content: [
          'Developers must own or hold explicit written licensing rights for all trademarks, copyrighted media, and code assets integrated into their APK binaries.',
          'Verified copyright infringement notices under the DMCA or Indian Copyright Act will result in swift removal of infringing software.'
        ]
      }
    ]
  },
  COMMUNITY_GUIDELINES: {
    title: 'AVANYX Community Guidelines',
    subtitle: 'Fostering a Transparent, Safe, and Collaborative Developer Ecosystem',
    version: 'v3.4.2',
    lastUpdated: 'October 2026',
    badge: 'Community Standard',
    sections: [
      {
        title: '1. Transparent Developer Communications',
        content: [
          'Developers must provide responsive support channels (valid support email) for store visitors experiencing issues.',
          'Changelogs and release notes must genuinely describe updates, bug fixes, or feature enhancements rather than generic obfuscated text.'
        ]
      },
      {
        title: '2. User Reviews & Rating Integrity',
        content: [
          'Developers may not engage in artificial rating manipulation, review incentivization schemes, or coordinated spam attacks against other publishers.',
          'Developer replies to user reviews must remain professional, respectful, and helpful at all times.'
        ]
      },
      {
        title: '3. Constructive Collaboration',
        content: [
          'AVANYX Store is built to empower independent creators, student innovators, and professional studios worldwide.',
          'Constructive feedback, open reporting of security vulnerabilities, and collaborative growth are encouraged across the platform.'
        ]
      }
    ]
  },
  STUDENT_AGREEMENT: {
    title: 'AVANYX Student Publisher Agreement',
    subtitle: 'Special Terms for Verified Secondary & Higher Education Student Innovators',
    version: 'v3.4.2',
    lastUpdated: 'October 2026',
    badge: 'Educational Pathway',
    sections: [
      {
        title: '1. Educational Intent & Free Applications Only',
        content: [
          'Student accounts verified through 10th Standard / Secondary School completion are granted access to publish non-commercial software on AVANYX Store.',
          'Student publishers can publish 100% FREE applications only. Paid apps, in-app billing subscriptions, and commercial developer payouts are disabled until reaching age 18 and completing 18+ Developer Verification.',
          'All published student applications must serve educational, utility, creative, or positive social community purposes.'
        ]
      },
      {
        title: '2. Student Safety & Privacy Protections',
        content: [
          'Student developer profiles carry an authentic "Verified Student" badge honoring their academic standing.',
          'Student academic marksheet certificates and verification data are protected under high-security encryption and used solely for enrollment confirmation.'
        ]
      },
      {
        title: '3. Compliance with Platform Guidelines',
        content: [
          'Student developers must follow all AVANYX Community Guidelines, Privacy Policies, and Content Standards.',
          'Academic honesty is paramount. Submitting counterfeit academic documents or plagiarized APK binaries will result in immediate disqualification.'
        ]
      }
    ]
  },
  APP_SUBMISSION_AGREEMENT: {
    title: 'AVANYX App Submission Agreement & Declarations',
    subtitle: 'Pre-flight Declarations and Legal Warranties for Every Application Release',
    version: 'v3.4.2',
    lastUpdated: 'October 2026',
    badge: 'Mandatory Submission Pre-requisite',
    sections: [
      {
        title: '1. Mandatory Contact & Policy URLs',
        content: [
          'Every submitted application must supply an active, public Privacy Policy URL and a functional Developer Support Email.',
          'Store visitors must have a direct avenue to contact the publisher for technical assistance or privacy inquiries.'
        ]
      },
      {
        title: '2. Permission & Capability Declarations',
        content: [
          'The publisher warrants that all requested Android system permissions are strictly necessary and properly declared.',
          'The application binary has been verified free from undeclared background tracking, adware injections, or unauthorized remote code execution engines.'
        ]
      },
      {
        title: '3. Copyright Ownership & Content Rating Warranty',
        content: [
          'The publisher confirms full copyright ownership or authorization for all visual assets, logos, screenshots, audio, and code bundled in the APK.',
          'The selected content rating category accurately depicts the age-appropriateness and functional nature of the software.'
        ]
      }
    ]
  }
};

export const LegalAgreementModal: React.FC<LegalAgreementModalProps> = ({
  isOpen,
  initialDoc = 'DEVELOPER_TERMS',
  onClose,
  onAccept
}) => {
  const [activeDoc, setActiveDoc] = useState<LegalDocType>(initialDoc);

  if (!isOpen) return null;

  const currentData = LEGAL_DOCS_DATA[activeDoc];

  const docNavItems: Array<{ id: LegalDocType; label: string; icon: any }> = [
    { id: 'DEVELOPER_TERMS', label: 'Developer Terms', icon: Scale },
    { id: 'DEVELOPER_PRIVACY', label: 'Privacy Policy', icon: Lock },
    { id: 'CONTENT_POLICY', label: 'Content & App Policy', icon: FileText },
    { id: 'COMMUNITY_GUIDELINES', label: 'Community Guidelines', icon: BookOpen },
    { id: 'STUDENT_AGREEMENT', label: 'Student Agreement', icon: Award },
    { id: 'APP_SUBMISSION_AGREEMENT', label: 'App Submission Policy', icon: ShieldCheck }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl bg-[#1A1B23] border border-white/10 shadow-2xl overflow-hidden text-white">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-[#14151C]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#6750A4]/20 border border-[#6750A4]/40 flex items-center justify-center text-[#D0BCFF]">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-[#6750A4]/30 text-[#D0BCFF] border border-[#6750A4]/40">
                  Legal Compliance {currentData.version}
                </span>
                <span className="text-[10px] text-zinc-400 font-medium">
                  Updated: {currentData.lastUpdated}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white mt-0.5">
                AVANYX Store Legal & Policy Repository
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition active:scale-95"
            aria-label="Close legal modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 px-6 py-2.5 bg-[#161722] border-b border-white/5 overflow-x-auto no-scrollbar">
          {docNavItems.map((item) => {
            const Icon = item.icon;
            const isSelected = activeDoc === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveDoc(item.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all ${
                  isSelected
                    ? 'bg-[#6750A4] text-white shadow-md shadow-[#6750A4]/30'
                    : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Policy Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-gradient-to-b from-[#1A1B23] to-[#14151C]">
          {/* Header Card for Document */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg sm:text-xl font-black text-white">
                {currentData.title}
              </h3>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {currentData.badge}
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {currentData.subtitle}
            </p>
          </div>

          {/* Policy Sections */}
          <div className="space-y-6">
            {currentData.sections.map((sec, idx) => (
              <div key={idx} className="space-y-3">
                <h4 className="text-sm font-black text-[#D0BCFF] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6750A4]" />
                  <span>{sec.title}</span>
                </h4>
                <div className="space-y-2 pl-3.5 border-l border-white/10">
                  {sec.content.map((p, pIdx) => (
                    <p key={pIdx} className="text-xs text-zinc-300 leading-relaxed font-normal">
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Verification Warranty Card */}
          <div className="p-4 rounded-2xl bg-[#6750A4]/10 border border-[#6750A4]/30 flex items-start gap-3 text-xs">
            <ShieldCheck className="w-5 h-5 text-[#D0BCFF] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-extrabold text-[#D0BCFF]">
                Immutable Agreement Record (Version {currentData.version})
              </p>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                By ticking the agreement checkboxes during verification or app submission, your explicit acceptance is recorded with an authoritative cryptographic timestamp and linked to your UID in Firestore.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-[#14151C]">
          <span className="text-xs text-zinc-400 font-medium">
            AVANYX Store Legal Framework • v3.4.2 Production
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-bold text-xs text-zinc-300 hover:text-white transition"
            >
              Close
            </button>
            {onAccept && (
              <button
                type="button"
                onClick={() => {
                  onAccept();
                  onClose();
                }}
                className="px-6 py-2.5 rounded-xl bg-[#6750A4] hover:bg-[#533f85] font-black text-xs text-white shadow-lg shadow-[#6750A4]/30 flex items-center gap-2 transition active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Agree & Continue</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
