import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Terminal, Send, ArrowLeft, Mail, MapPin, Phone } from 'lucide-react';

export function ContactPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 1500);
  };

  return (
    <div className="h-screen overflow-hidden flex text-white font-sans selection:bg-[#5b4fff] selection:text-white">
      
      {/* Left Panel - Visuals & Info */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#09090e] border-r border-zinc-900 flex-col justify-center p-10 xl:p-16">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

        <div className="relative z-10 w-full max-w-lg mx-auto">
          {/* Logo & Back button */}
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3">
              <div className="bg-[#5b4fff] p-2 rounded-xl flex items-center justify-center shadow-lg">
                <Terminal className="h-5 w-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">LeetTracker</span>
            </div>
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </button>
          </div>

          <h1 className="text-4xl xl:text-5xl font-extrabold leading-[1.1] tracking-tight mb-4 text-white">
            Let's build something <br />
            <span className="text-[#968fff]">extraordinary.</span>
          </h1>
          <p className="text-zinc-400 text-[16px] leading-relaxed mb-12 max-w-[420px]">
            Have questions about LeetTracker, want to request a feature, or need support? We're here to help you elevate your coding bootcamp.
          </p>

          {/* Contact Details Cards */}
          <div className="grid gap-4">
            <div className="bg-transparent border border-zinc-800/80 p-4 xl:p-5 rounded-2xl hover:bg-zinc-900/30 transition-colors flex items-center gap-4">
               <div className="bg-[#1a1b2e] w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5 text-[#968fff]" />
               </div>
               <div>
                 <h3 className="text-white font-semibold text-[14px] mb-0.5 tracking-tight">Email Us</h3>
                 <p className="text-[13px] text-zinc-500 leading-snug">hello@leettracker.app</p>
               </div>
            </div>
            <div className="bg-transparent border border-zinc-800/80 p-4 xl:p-5 rounded-2xl hover:bg-zinc-900/30 transition-colors flex items-center gap-4">
               <div className="bg-[#1a1b2e] w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                  <Phone className="h-5 w-5 text-[#968fff]" />
               </div>
               <div>
                 <h3 className="text-white font-semibold text-[14px] mb-0.5 tracking-tight">Call Us</h3>
                 <p className="text-[13px] text-zinc-500 leading-snug">+1 (555) 123-4567</p>
               </div>
            </div>
            <div className="bg-transparent border border-zinc-800/80 p-4 xl:p-5 rounded-2xl hover:bg-zinc-900/30 transition-colors flex items-center gap-4">
               <div className="bg-[#1a1b2e] w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                  <MapPin className="h-5 w-5 text-[#968fff]" />
               </div>
               <div>
                 <h3 className="text-white font-semibold text-[14px] mb-0.5 tracking-tight">Headquarters</h3>
                 <p className="text-[13px] text-zinc-500 leading-snug">San Francisco, CA</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 relative bg-[#0a0a0a] overflow-hidden">
        
        {/* Unique dot grid texture background */}
        <div className="absolute inset-0 bg-[radial-gradient(#333_1px,transparent_1px)] bg-[size:24px_24px] opacity-60 pointer-events-none"></div>
        
        {/* Subtle ambient glow behind form */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-[#5b4fff] opacity-[0.06] blur-[100px] rounded-full pointer-events-none"></div>

        <div className="w-full max-w-[480px] relative z-10 bg-[#111111]/85 backdrop-blur-2xl p-8 sm:p-10 rounded-3xl border border-zinc-800/60 shadow-[0_8px_40px_rgb(0,0,0,0.5)] my-auto max-h-[90vh] overflow-y-auto custom-scrollbar">
          
          {/* Mobile Logo & Back */}
          <div className="lg:hidden flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-[#5b4fff] p-2 rounded-lg">
                <Terminal className="h-5 w-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">LeetTracker</span>
            </div>
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          </div>

          <div className="mb-8">
            <h2 className="text-[28px] font-bold text-white tracking-tight mb-2">
              Get in touch
            </h2>
            <p className="text-zinc-400 text-[15px]">
              Fill out the form below and our team will get back to you within 24 hours.
            </p>
          </div>

          {isSuccess ? (
             <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in zoom-in duration-500">
               <div className="w-16 h-16 bg-[#5b4fff]/20 text-[#968fff] rounded-full flex items-center justify-center mb-6 border border-[#5b4fff]/30">
                 <Send className="w-8 h-8 ml-1" />
               </div>
               <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
               <p className="text-zinc-400 mb-8 max-w-[280px]">
                 Thank you for reaching out. We've received your message and will respond shortly.
               </p>
               <Button 
                  onClick={() => setIsSuccess(false)}
                  className="bg-transparent border border-zinc-700 text-white hover:bg-zinc-800 rounded-xl px-8 transition-colors"
               >
                 Send another message
               </Button>
             </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="uppercase text-[11px] tracking-wider text-zinc-400 font-semibold block">Your Name</Label>
                  <Input 
                    required 
                    placeholder="John Doe" 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    className="bg-[#222] border-none text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-[#5b4fff] h-12 rounded-xl w-full transition-all px-4" 
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="uppercase text-[11px] tracking-wider text-zinc-400 font-semibold block">Email Address</Label>
                  <Input 
                    type="email" 
                    required 
                    placeholder="john@example.com" 
                    value={formData.email} 
                    onChange={(e) => setFormData({...formData, email: e.target.value})} 
                    className="bg-[#222] border-none text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-[#5b4fff] h-12 rounded-xl w-full transition-all px-4" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="uppercase text-[11px] tracking-wider text-zinc-400 font-semibold block">Subject</Label>
                <Input 
                  required 
                  placeholder="How can we help you?" 
                  value={formData.subject} 
                  onChange={(e) => setFormData({...formData, subject: e.target.value})} 
                  className="bg-[#222] border-none text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-[#5b4fff] h-12 rounded-xl w-full transition-all px-4" 
                />
              </div>

              <div className="space-y-1.5">
                <Label className="uppercase text-[11px] tracking-wider text-zinc-400 font-semibold block">Message</Label>
                <textarea 
                  required 
                  placeholder="Tell us more about your inquiry..." 
                  value={formData.message} 
                  onChange={(e) => setFormData({...formData, message: e.target.value})} 
                  className="flex min-h-[140px] w-full rounded-xl bg-[#222] px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5b4fff] disabled:cursor-not-allowed disabled:opacity-50 border-none transition-all resize-y custom-scrollbar" 
                />
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full h-12 mt-6 bg-transparent border border-zinc-700 text-white text-[15px] font-medium hover:bg-zinc-800 rounded-xl transition-all duration-200 flex items-center justify-center hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] hover:-translate-y-0.5 active:translate-y-0"
              >
                {isSubmitting ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-400 border-t-white mr-2"></div>
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          )}

        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #444;
        }
      `}</style>
    </div>
  );
}
