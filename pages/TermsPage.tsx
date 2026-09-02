import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  HiOutlineDocumentCheck, 
  HiOutlineScale, 
  HiOutlineSparkles, 
  HiOutlineShieldExclamation, 
  HiOutlineEnvelope, 
  HiOutlineArrowLeft 
} from 'react-icons/hi2';
import Card from '../components/ui/Card';

const TermsPage: React.FC = () => {
  const navigate = useNavigate();
  const lastUpdated = "September 1, 2026";

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Back button & Header */}
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
      <Card className="p-6 sm:p-8 bg-gradient-to-br from-primary/10 via-transparent to-emerald-500/5 border border-primary/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
            <HiOutlineDocumentCheck className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-light-text-primary dark:text-text-primary tracking-tight">
              Terms of Service
            </h1>
            <p className="text-sm text-light-text-secondary dark:text-text-secondary mt-1.5 leading-relaxed">
              These terms govern your use of the Sprout Unified Home & Family Care platform. By using the app, you agree to these clear and fair terms.
            </p>
          </div>
        </div>
      </Card>

      {/* Main Terms Sections */}
      <Card className="p-6 sm:p-8 space-y-8 divide-y divide-slate-100 dark:divide-zinc-800 text-light-text-primary dark:text-text-primary">
        {/* 1. Acceptance */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-zinc-800 text-xs flex items-center justify-center font-mono">1</span>
            Acceptance of Terms
          </h2>
          <div className="text-xs sm:text-sm text-light-text-secondary dark:text-text-secondary space-y-2 leading-relaxed pl-8">
            <p>
              By accessing or using Sprout, creating an account, or syncing data with our services, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use the application.
            </p>
          </div>
        </section>

        {/* 2. Medical & Health Disclaimer */}
        <section className="pt-6 space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <HiOutlineShieldExclamation className="w-6 h-6 shrink-0" />
            Medical & Healthcare Advisory Disclaimer
          </h2>
          <div className="text-xs sm:text-sm text-light-text-secondary dark:text-text-secondary space-y-2.5 leading-relaxed pl-8">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 font-medium">
              Sprout is an organization and tracking tool, not a licensed healthcare provider. Medication logs, reminder notifications, and AI health summaries do not constitute medical diagnoses, clinical advice, or prescriptions.
            </div>
            <p>
              Always consult qualified healthcare professionals or emergency services for medical emergencies, prescription modifications, or treatment decisions.
            </p>
          </div>
        </section>

        {/* 3. Account Responsibilities */}
        <section className="pt-6 space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-zinc-800 text-xs flex items-center justify-center font-mono">3</span>
            Account Security & Family Access
          </h2>
          <div className="text-xs sm:text-sm text-light-text-secondary dark:text-text-secondary space-y-2 leading-relaxed pl-8">
            <p>
              You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. When inviting family members or caregivers to your household, you represent that you have authorization to share the associated family logs.
            </p>
          </div>
        </section>

        {/* 4. AI Features & Smart Advice */}
        <section className="pt-6 space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-zinc-800 text-xs flex items-center justify-center font-mono">4</span>
            AI Assistant & Generative Summaries
          </h2>
          <div className="text-xs sm:text-sm text-light-text-secondary dark:text-text-secondary space-y-2 leading-relaxed pl-8">
            <p>
              Sprout leverages artificial intelligence models (such as Google Gemini) to generate budget recommendations, meal suggestions, and routine optimizations. While we strive for high accuracy, AI outputs should be reviewed by users for factual correctness before making financial or household commitments.
            </p>
          </div>
        </section>

        {/* 5. Contact */}
        <section className="pt-6 space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-zinc-800 text-xs flex items-center justify-center font-mono">5</span>
            Questions Regarding Terms
          </h2>
          <div className="text-xs sm:text-sm text-light-text-secondary dark:text-text-secondary space-y-2 leading-relaxed pl-8">
            <p>
              For legal inquiries or questions concerning these terms:
            </p>
            <p className="font-semibold text-light-text-primary dark:text-text-primary">
              legal@sproutfamily.app
            </p>
          </div>
        </section>
      </Card>
    </div>
  );
};

export default TermsPage;
