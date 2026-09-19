'use client';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CompanionSearchSection from '@/components/companions/CompanionSearchSection';

export default function CompanionsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 overflow-x-hidden w-full max-w-full">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 w-full min-w-0 overflow-hidden">
        <CompanionSearchSection />
      </main>
      <Footer />
    </div>
  );
}
