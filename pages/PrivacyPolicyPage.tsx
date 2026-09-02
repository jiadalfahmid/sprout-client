import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  HiOutlineShieldCheck, 
  HiOutlineLockClosed, 
  HiOutlineEyeSlash, 
  HiOutlineCloudArrowDown, 
  HiOutlineTrash, 
  HiOutlineHeart, 
  HiOutlineEnvelope, 
  HiOutlineArrowLeft 
} from 'react-icons/hi2';
import Card from '../components/ui/Card';

const PrivacyPolicyPage: React.FC = () => {
  const navigate = useNavigate();
  const lastUpdated = "September 1, 2026";

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Back button & Page header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-700 transition"
        >
          <HiOutlineArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
        <span className="text-xs text-slate-500 dark:text-zinc-400">
          Last Updated: {lastUpdated}
        </span>
      </div>

      {/* Hero Badge Card */}
      <Card className="p-6 sm:p-8 bg-gradient-to-br from-emerald-500/10 via-transparent to-primary/5 border border-emerald-500/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <HiOutlineShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-light-text-primary dark:text-text-primary tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-sm text-light-text-secondary dark:text-text-secondary mt-1.5 leading-relaxed">
              Your family's health records, financial logs, and daily schedules are deeply personal. We treat your data with the highest standard of privacy, bank-grade encryption, and zero third-party data selling.
            </p>
          </div>
        </div>
      </Card>

      {/* Privacy Highlights at a Glance */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 space-y-2 border-emerald-500/15">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <HiOutlineLockClosed className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-light-text-primary dark:text-text-primary">Encrypted End-to-End</h3>
          <p className="text-xs text-light-text-secondary dark:text-text-secondary leading-relaxed">
            All synced data in transit and at rest is secured via TLS 1.3 and AES-256 cloud encryption.
          </p>
        </Card>

        <Card className="p-4 space-y-2 border-primary/15">
          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <HiOutlineEyeSlash className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-light-text-primary dark:text-text-primary">Zero Ad Tracking</h3>
          <p className="text-xs text-light-text-secondary dark:text-text-secondary leading-relaxed">
            We do not sell, rent, or monetize your household data, health history, or financial records to advertisers.
          </p>
        </Card>

        <Card className="p-4 space-y-2 border-blue-500/15">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <HiOutlineTrash className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-light-text-primary dark:text-text-primary">Full Data Sovereignty</h3>
          <p className="text-xs text-light-text-secondary dark:text-text-secondary leading-relaxed">
            Export or permanently delete your entire family record with one tap anytime under Settings.
          </p>
        </Card>
      </div>

      {/* Main Policy Sections */}
      <Card className="p-6 sm:p-8 space-y-8 divide-y divide-slate-100 dark:divide-zinc-800 text-light-text-primary dark:text-text-primary">
        {/* 1. Information We Collect */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-zinc-800 text-xs flex items-center justify-center font-mono">1</span>
            Information We Collect
          </h2>
          <div className="text-xs sm:text-sm text-light-text-secondary dark:text-text-secondary space-y-2.5 leading-relaxed pl-8">
            <p>
              When you use Sprout Unified Home & Family Care, we collect information that you directly provide to organize your household:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Account Credentials:</strong> Name, email address, password hash, or Google OAuth identity tokens when signing in.</li>
              <li><strong>Family & Household Profiles:</strong> Member names, avatars, birthdays, relationship roles, allergies, blood type, and emergency contacts.</li>
              <li><strong>Health & Medicine Logs:</strong> Medication schedules, dosages, adherence timestamps, doctor appointments, and prescription notes.</li>
              <li><strong>Financial Logs:</strong> Household expense transactions, custom category budgets, income records, and recurring payment reminders.</li>
              <li><strong>Tasks & Chores:</strong> Todo items, household maintenance checklists, assignee labels, and completion timestamps.</li>
            </ul>
          </div>
        </section>

        {/* 2. Google API Services User Data Disclosure */}
        <section className="pt-6 space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-zinc-800 text-xs flex items-center justify-center font-mono">2</span>
            Google API Services & OAuth Integration
          </h2>
          <div className="text-xs sm:text-sm text-light-text-secondary dark:text-text-secondary space-y-2.5 leading-relaxed pl-8">
            <p>
              Sprout offers optional integrations with Google Workspace APIs (specifically Google Calendar and Gmail):
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Google Calendar Integration:</strong> When you connect your Google Calendar, Sprout accesses event titles and times solely to sync appointments into your family agenda. We do not modify or delete personal calendar entries outside of appointments created in Sprout.</li>
              <li><strong>Gmail Invitations:</strong> When you invite a family member via email, the Gmail integration sends an invitation email on your behalf. Sprout never reads, scrapes, or stores your personal inbox contents.</li>
              <li><strong>Limited Use Requirements:</strong> Sprout's use and transfer of information received from Google APIs adheres to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-primary underline">Google API Services User Data Policy</a>, including the Limited Use requirements.</li>
            </ul>
          </div>
        </section>

        {/* 3. How We Store & Secure Data */}
        <section className="pt-6 space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-zinc-800 text-xs flex items-center justify-center font-mono">3</span>
            How We Protect and Store Your Data
          </h2>
          <div className="text-xs sm:text-sm text-light-text-secondary dark:text-text-secondary space-y-2.5 leading-relaxed pl-8">
            <p>
              We implement industry-standard administrative, physical, and technical safeguards:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Cloud Storage:</strong> Data is synchronized to Google Cloud Firestore with strict user-level and family-level security access rules.</li>
              <li><strong>Offline / Local Storage:</strong> For guest mode and offline resilience, records are stored locally on your device via standard browser local storage.</li>
              <li><strong>Encryption:</strong> All network communication is enforced via HTTPS (TLS 1.3). Database files are encrypted at rest using AES-256 standard encryption.</li>
            </ul>
          </div>
        </section>

        {/* 4. Data Sharing & Third Parties */}
        <section className="pt-6 space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-zinc-800 text-xs flex items-center justify-center font-mono">4</span>
            Data Sharing & Third-Party Processors
          </h2>
          <div className="text-xs sm:text-sm text-light-text-secondary dark:text-text-secondary space-y-2.5 leading-relaxed pl-8">
            <p>
              We do <strong>not</strong> sell, rent, or trade your personal data. We only share information with certified infrastructure providers necessary to operate the application:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Google Firebase / Google Cloud Platform:</strong> Authentication, cloud database, and hosting infrastructure.</li>
              <li><strong>Google Gemini AI:</strong> When you use AI Smart Advice, anonymized prompts are processed server-side without being used to train general public models.</li>
            </ul>
          </div>
        </section>

        {/* 5. Your Rights & Data Deletion */}
        <section className="pt-6 space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-zinc-800 text-xs flex items-center justify-center font-mono">5</span>
            Your Privacy Rights & Data Deletion (GDPR / CCPA)
          </h2>
          <div className="text-xs sm:text-sm text-light-text-secondary dark:text-text-secondary space-y-2.5 leading-relaxed pl-8">
            <p>
              Regardless of your location, Sprout gives you full control over your family's data:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Access & Export:</strong> You can export your data as JSON/CSV records directly from the Settings menu.</li>
              <li><strong>Right to Erasure (Delete Data):</strong> You can permanently wipe your account and all associated family health and finance logs at any time via Settings &gt; Reset Session or by contacting support.</li>
              <li><strong>Revoke Google Access:</strong> You can disconnect Google Calendar or Gmail tokens with a single click in your Sprout Settings or via your Google Security Dashboard.</li>
            </ul>
          </div>
        </section>

        {/* 6. Children's Privacy (COPPA) */}
        <section className="pt-6 space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-zinc-800 text-xs flex items-center justify-center font-mono">6</span>
            Children's Privacy (COPPA Compliance)
          </h2>
          <div className="text-xs sm:text-sm text-light-text-secondary dark:text-text-secondary space-y-2.5 leading-relaxed pl-8">
            <p>
              Sprout is designed for family management by adult parents or guardians. Child profiles (including medication schedules and allergy notes) are created and managed strictly under the parental account holder's consent and control. We do not knowingly solicit direct registration from children under 13 without parental supervision.
            </p>
          </div>
        </section>

        {/* 7. Contact Us */}
        <section className="pt-6 space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-zinc-800 text-xs flex items-center justify-center font-mono">7</span>
            Contact & Privacy Inquiries
          </h2>
          <div className="text-xs sm:text-sm text-light-text-secondary dark:text-text-secondary space-y-2.5 leading-relaxed pl-8">
            <p>
              If you have any questions, requests, or privacy concerns regarding this policy, please reach out to our privacy team:
            </p>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 flex items-center gap-3">
              <HiOutlineEnvelope className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="font-semibold text-xs text-light-text-primary dark:text-text-primary">Sprout Privacy & Security Office</p>
                <p className="text-xs text-light-text-secondary dark:text-text-secondary">support@sproutfamily.app</p>
              </div>
            </div>
          </div>
        </section>
      </Card>
    </div>
  );
};

export default PrivacyPolicyPage;
