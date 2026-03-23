'use client';

import Link from 'next/link';
import { Truck, Shield, Zap, Star, ArrowRight, CheckCircle } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="bg-brand-600 p-1.5 rounded-lg">
              <Truck className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Tra<span className="text-brand-600">X</span></span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Sign in
            </Link>
            <Link href="/auth/register" className="btn-primary text-sm">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-20 px-4 bg-gradient-to-br from-brand-50 via-white to-blue-50">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            The smarter way to move freight
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 tracking-tight mb-6 leading-tight">
            Freight on demand,<br />
            <span className="text-brand-600">drivers you trust.</span>
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto">
            TraX connects businesses with verified truck drivers instantly.
            Real-time matching, AI-powered pricing, full transparency.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register?role=client" className="btn-primary text-base flex items-center gap-2 justify-center">
              I need a truck <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/auth/register?role=driver" className="btn-secondary text-base">
              I&apos;m a driver
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Everything you need to move cargo
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="h-6 w-6 text-brand-600" />,
                title: 'Instant Matching',
                desc: 'Our algorithm matches your shipment with the nearest available verified driver in seconds.',
              },
              {
                icon: <Shield className="h-6 w-6 text-brand-600" />,
                title: 'Verified Drivers',
                desc: 'Every driver is background-checked, licensed, and rated by real customers.',
              },
              {
                icon: <Star className="h-6 w-6 text-brand-600" />,
                title: 'Smart Pricing',
                desc: 'AI-powered price estimation based on distance, load, and vehicle type — no surprises.',
              },
            ].map((f) => (
              <div key={f.title} className="card hover:shadow-md transition-shadow">
                <div className="bg-brand-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 bg-brand-600">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { value: '5,000+', label: 'Active Drivers' },
            { value: '50K+', label: 'Jobs Completed' },
            { value: '4.9★', label: 'Average Rating' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-4xl font-extrabold text-white">{s.value}</p>
              <p className="text-brand-200 mt-1 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How TraX works</h2>
          <div className="space-y-6">
            {[
              { step: '01', title: 'Post your shipment', desc: 'Enter pickup, destination, date, and cargo details.' },
              { step: '02', title: 'Get matched instantly', desc: 'Our ML engine finds the best available drivers for your route.' },
              { step: '03', title: 'Confirm & track', desc: 'Accept a driver, confirm the price, and track delivery in real-time.' },
            ].map((item) => (
              <div key={item.step} className="flex gap-6 items-start card">
                <div className="text-3xl font-extrabold text-brand-100 w-14 shrink-0">{item.step}</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                  <p className="text-gray-500 text-sm">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-brand-700 to-brand-900 text-center">
        <h2 className="text-4xl font-extrabold text-white mb-4">Ready to move smarter?</h2>
        <p className="text-brand-200 mb-8 text-lg">Join thousands of businesses and drivers on TraX today.</p>
        <Link href="/auth/register" className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold py-3 px-8 rounded-xl hover:bg-brand-50 transition-colors text-base">
          Start for free <ArrowRight className="h-5 w-5" />
        </Link>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-gray-100 text-center text-sm text-gray-400">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="bg-brand-600 p-1 rounded">
            <Truck className="h-4 w-4 text-white" />
          </div>
          <span className="font-semibold text-gray-700">TraX</span>
        </div>
        <p>© {new Date().getFullYear()} TraX Transport Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
