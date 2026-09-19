'use client';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CompanionSearchSection from '@/components/companions/CompanionSearchSection';

export default function CompanionsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <CompanionSearchSection />
      </main>
      <Footer />
    </div>
  );
}
