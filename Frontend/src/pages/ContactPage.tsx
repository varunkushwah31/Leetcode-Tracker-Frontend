import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { PaperPlaneTiltIcon as Send, ArrowLeftIcon, EnvelopeIcon as Mail, MapPinIcon, PhoneIcon } from '@phosphor-icons/react';
import { ErrorBanner } from '../components/ui/ErrorBanner';
import { AmbientGlow } from '../components/ui/AmbientGlow';
import { BrandLogo } from '../components/common/BrandLogo';
import { ThemeToggle } from '../components/ui/ThemeToggle';

export function ContactPage() {
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.SubmitEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            setIsSuccess(true);
            setFormData({ name: '', email: '', subject: '', message: '' });
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to send message');
        } finally {
            setIsSubmitting(false);
        }
    };

    const clearError = () => {
        if (error) setError(null);
    };

    return (
        <div className="min-h-screen lg:h-screen overflow-y-auto lg:overflow-hidden flex flex-col lg:flex-row bg-[#f1f3f7] dark:bg-[#0a0a0a] text-zinc-900 dark:text-white font-sans selection:bg-[#5b4fff] selection:text-white transition-colors duration-200">

            {/* Left Panel - Visuals & Info */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-50 dark:bg-[#09090e] border-r border-zinc-200 dark:border-zinc-900 flex-col justify-center p-10 xl:p-16 transition-colors duration-200">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#0000000a_1px,transparent_1px),linear-gradient(to_bottom,#0000000a_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-size-[40px_40px] pointer-events-none"></div>

                <div className="relative z-10 w-full max-w-lg mx-auto">
                    <div className="flex items-center justify-between mb-12">
                        <BrandLogo size="md" theme="auto" />
                        <div className="flex items-center gap-3">
                            <ThemeToggle className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800" />
                            <Link
                                to="/"
                                className="flex items-center gap-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors text-sm font-medium hover:-translate-x-0.5"
                            >
                                <ArrowLeftIcon className="h-4 w-4" />
                                Back to Home
                            </Link>
                        </div>
                    </div>

                    <h1 className="text-4xl xl:text-5xl font-extrabold leading-[1.1] tracking-tight mb-4 text-zinc-900 dark:text-white">
                        Let's build something <br />
                        <span className="text-[#5b4fff] dark:text-[#968fff]">extraordinary.</span>
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400 text-[16px] leading-relaxed mb-12 max-w-105">
                        Have questions about MentorSync, want to request a feature, or need support? We're here to help you elevate your coding bootcamp.
                    </p>

                    <div className="grid gap-4">
                        <div className="bg-white dark:bg-transparent border border-zinc-200 dark:border-zinc-800/80 p-4 xl:p-5 rounded-2xl hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30 transition-colors flex items-center gap-4 shadow-xs">
                            <div className="bg-[#1a1b2e] w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                                <Mail className="h-5 w-5 text-[#968fff]" />
                            </div>
                            <div>
                                <h3 className="text-zinc-900 dark:text-white font-semibold text-[14px] mb-0.5 tracking-tight">Email Us</h3>
                                <p className="text-[13px] text-zinc-500 leading-snug">hello@mentorsync.in</p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-transparent border border-zinc-200 dark:border-zinc-800/80 p-4 xl:p-5 rounded-2xl hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30 transition-colors flex items-center gap-4 shadow-xs">
                            <div className="bg-[#1a1b2e] w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                                <PhoneIcon className="h-5 w-5 text-[#968fff]" />
                            </div>
                            <div>
                                <h3 className="text-zinc-900 dark:text-white font-semibold text-[14px] mb-0.5 tracking-tight">Call Us</h3>
                                <p className="text-[13px] text-zinc-500 leading-snug">+91 98765 43210</p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-transparent border border-zinc-200 dark:border-zinc-800/80 p-4 xl:p-5 rounded-2xl hover:bg-zinc-100/50 dark:hover:bg-zinc-900/30 transition-colors flex items-center gap-4 shadow-xs">
                            <div className="bg-[#1a1b2e] w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                                <MapPinIcon className="h-5 w-5 text-[#968fff]" />
                            </div>
                            <div>
                                <h3 className="text-zinc-900 dark:text-white font-semibold text-[14px] mb-0.5 tracking-tight">Headquarters</h3>
                                <p className="text-[13px] text-zinc-500 leading-snug">Bengaluru, Karnataka, India</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-10 relative bg-[#f8fafc] dark:bg-[#0a0a0a] overflow-hidden transition-colors duration-200">
                <div className="absolute inset-0 bg-[radial-gradient(rgba(50,205,50,0.14)_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.035)_1px,transparent_1px)] bg-size-[30px_30px] pointer-events-none"></div>
                <div className="hidden dark:block">
                    <AmbientGlow variant="center" />
                </div>

                <div className="w-full max-w-120 relative z-10 bg-white/95 dark:bg-[#111111]/85 backdrop-blur-2xl p-8 sm:p-10 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/60 shadow-xl my-auto max-h-[90vh] overflow-y-auto custom-scrollbar">

                    <div className="lg:hidden flex items-center justify-between mb-8">
                        <BrandLogo size="md" theme="auto" />
                        <div className="flex items-center gap-2">
                            <ThemeToggle className="bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800" />
                            <Link
                                to="/"
                                className="flex items-center gap-1.5 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors text-xs font-medium px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:-translate-x-0.5"
                            >
                                <ArrowLeftIcon className="h-3.5 w-3.5" />
                                Home
                            </Link>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-[28px] font-bold text-zinc-900 dark:text-white tracking-tight mb-2">
                            Get in touch
                        </h2>
                        <p className="text-zinc-600 dark:text-zinc-400 text-[15px]">
                            Fill out the form below and our team will get back to you within 24 hours.
                        </p>
                    </div>

                    {isSuccess ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in zoom-in duration-500">
                            <div className="w-16 h-16 bg-[#5b4fff]/15 dark:bg-[#5b4fff]/20 text-[#5b4fff] dark:text-[#968fff] rounded-full flex items-center justify-center mb-6 border border-[#5b4fff]/30">
                                <Send className="w-8 h-8 ml-1" />
                            </div>
                            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Message Sent!</h3>
                            <p className="text-zinc-600 dark:text-zinc-400 mb-8 max-w-70">
                                Thank you for reaching out. We've received your message and will respond shortly.
                            </p>
                            <Button
                                onClick={() => setIsSuccess(false)}
                                className="bg-transparent border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl px-8 transition-colors cursor-pointer"
                            >
                                Send another message
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <ErrorBanner message={error} />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <Label className="uppercase text-[11px] tracking-wider text-zinc-600 dark:text-zinc-400 font-semibold block">Your Name</Label>
                                    <Input
                                        required
                                        placeholder="John Doe"
                                        value={formData.name}
                                        onChange={(e) => { setFormData({...formData, name: e.target.value}); clearError(); }}
                                        className="bg-zinc-50 dark:bg-[#222] border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-[#5b4fff] h-12 rounded-xl w-full transition-all px-4"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="uppercase text-[11px] tracking-wider text-zinc-600 dark:text-zinc-400 font-semibold block">Email Address</Label>
                                    <Input
                                        type="email"
                                        required
                                        placeholder="john@example.com"
                                        value={formData.email}
                                        onChange={(e) => { setFormData({...formData, email: e.target.value}); clearError(); }}
                                        className="bg-zinc-50 dark:bg-[#222] border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-[#5b4fff] h-12 rounded-xl w-full transition-all px-4"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="uppercase text-[11px] tracking-wider text-zinc-600 dark:text-zinc-400 font-semibold block">Subject</Label>
                                <Input
                                    required
                                    placeholder="How can we help you?"
                                    value={formData.subject}
                                    onChange={(e) => { setFormData({...formData, subject: e.target.value}); clearError(); }}
                                    className="bg-zinc-50 dark:bg-[#222] border border-zinc-300 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-[#5b4fff] h-12 rounded-xl w-full transition-all px-4"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="uppercase text-[11px] tracking-wider text-zinc-600 dark:text-zinc-400 font-semibold block">Message</Label>
                                <textarea
                                    required
                                    placeholder="Tell us more about your inquiry..."
                                    value={formData.message}
                                    onChange={(e) => { setFormData({...formData, message: e.target.value}); clearError(); }}
                                    className="flex min-h-35 w-full rounded-xl bg-zinc-50 dark:bg-[#222] border border-zinc-300 dark:border-zinc-800 px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5b4fff] disabled:cursor-not-allowed disabled:opacity-50 transition-all resize-y custom-scrollbar"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full h-12 mt-6 bg-[#5b4fff] hover:bg-[#4d40ea] text-white text-[15px] font-medium rounded-xl transition-all duration-200 flex items-center justify-center shadow-md hover:-translate-y-0.5 active:translate-y-0 group cursor-pointer"
                            >
                                {isSubmitting ? (
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white mr-2"></div>
                                ) : (
                                    <Send className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
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
          background: #77777740;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #77777770;
        }
      `}</style>
        </div>
    );
}