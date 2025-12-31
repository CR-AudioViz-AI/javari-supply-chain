'use client';
import { motion } from 'framer-motion';
import { Truck, ArrowRight, Check, BarChart3, Users, Zap, Shield, Clock, Globe } from 'lucide-react';

const features = [
  { icon: BarChart3, title: 'Smart Analytics', desc: 'AI-powered insights and reporting' },
  { icon: Users, title: 'Team Management', desc: 'Collaborate efficiently across teams' },
  { icon: Zap, title: 'Automation', desc: 'Automate repetitive workflows' },
  { icon: Shield, title: 'Compliance', desc: 'Built-in regulatory compliance' },
  { icon: Clock, title: 'Real-time Updates', desc: 'Live tracking and monitoring' },
  { icon: Globe, title: 'Integration', desc: 'Connect with existing tools' },
];

export default function Page() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Truck className="w-8 h-8 text-green-600" />
            <span className="text-xl font-bold">Javari Supply Chain</span>
          </div>
          <a href="/signup" className="bg-green-600 text-white px-4 py-2 rounded-lg">Get Started</a>
        </div>
      </nav>
      
      <section className="pt-32 pb-20 px-4 text-center">
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
          <span className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm mb-6">
            <Zap className="w-4 h-4" /> AI-Powered Platform
          </span>
          <h1 className="text-5xl font-bold text-slate-900 mb-6">Optimize Every Link.</h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Streamline operations, reduce costs, and scale your business with intelligent automation.
          </p>
          <a href="/signup" className="inline-flex items-center gap-2 bg-green-600 text-white px-8 py-4 rounded-lg font-semibold">
            Start Free Trial <ArrowRight className="w-5 h-5" />
          </a>
        </motion.div>
      </section>
      
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
          {features.map((f,i) => (
            <motion.div key={f.title} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} transition={{delay:i*0.1}} className="bg-white p-6 rounded-xl border hover:shadow-lg">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <f.icon className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
              <p className="text-slate-600">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
      
      <section className="py-20 px-4 bg-green-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Ready to Transform Your Business?</h2>
          <a href="/signup" className="inline-flex items-center gap-2 bg-white text-green-600 px-8 py-4 rounded-lg font-semibold">
            Get Started Free <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>
      
      <footer className="py-12 px-4 bg-slate-900 text-center">
        <p className="text-slate-500">© 2025 CR AudioViz AI, LLC. All rights reserved.</p>
      </footer>
    </div>
  );
}
