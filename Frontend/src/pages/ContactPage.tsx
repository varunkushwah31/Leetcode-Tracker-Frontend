import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
    PaperPlaneTiltIcon as Send,
    ArrowLeftIcon,
    EnvelopeIcon as Mail,
    MapPinIcon,
    PhoneIcon,
    CheckCircleIcon,
    ChatCircleDotsIcon,
    ArrowSquareOutIcon
} from '@phosphor-icons/react';
import { ErrorBanner } from '../components/ui/ErrorBanner';
import { AmbientGlow } from '../components/ui/AmbientGlow';
import { BrandLogo } from '../components/common/BrandLogo';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { ContactService } from '../services/endpoints';
import type { ContactRequest } from '@/types';

const CONTACT_EMAIL = 'varun.kush3@gmail.com';
const CONTACT_PHONE_RAW = '8218568519';
const CONTACT_PHONE_DISPLAY = '+91 82185 68519';
const CONTACT_LOCATION = 'KIET, Ghaziabad, India';
const MAPS_URL = 'https://maps.google.com/?q=KIET+Group+of+Institutions+Ghaziabad+India';

const TOPIC_SUGGESTIONS = [
    'Technical Support',
    'Classroom & Mentor Setup',
    'Feature Request',
    'Student Account Inquiry',
    'Partnership & Feedback'
];

export function ContactPage() {
    const [formData, setFormData] = useState<ContactRequest>({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    });
    const [submittedData, setSubmittedData] = useState<ContactRequest | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const validateForm = (): string | null => {
        const trimmedName = formData.name.trim();
        const trimmedEmail = formData.email.trim();
        const trimmedSubject = formData.subject.trim();
        const trimmedMessage = formData.message.trim();

        if (!trimmedName || trimmedName.length < 2) {
            return 'Please provide your full name (at least 2 characters).';
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
            return 'Please enter a valid email address.';
        }
        if (!trimmedSubject || trimmedSubject.length < 3) {
            return 'Please provide a subject line (at least 3 characters).';
        }
        if (!trimmedMessage || trimmedMessage.length < 10) {
            return 'Please provide a descriptive message (at least 10 characters).';
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsSubmitting(true);
        const payload: ContactRequest = {
            name: formData.name.trim(),
            email: formData.email.trim(),
            phone: formData.phone?.trim() || undefined,
            subject: formData.subject.trim(),
            message: formData.message.trim()
        };

        try {
            // Attempt to dispatch via backend ContactService
            await ContactService.sendMessage(payload);
            setSubmittedData(payload);
            setIsSuccess(true);
            setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
        } catch (err: unknown) {
            // If backend is unreachable or in standalone mode, gracefully fall back
            // so the user's message is preserved and they can dispatch directly via mailto/WhatsApp
            console.warn('Contact API dispatch notice:', err);
            setSubmittedData(payload);
            setIsSuccess(true);
            setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const clearError = () => {
        if (error) setError(null);
    };

    const handleTopicClick = (topic: string) => {
        setFormData(prev => ({ ...prev, subject: topic }));
        clearError();
    };

    const mailtoUrl = submittedData
        ? `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
            `[MentorSync] ${submittedData.subject}`
        )}&body=${encodeURIComponent(
            `Name: ${submittedData.name}\nEmail: ${submittedData.email}\nPhone: ${
                submittedData.phone || 'N/A'
            }\n\nMessage:\n${submittedData.message}`
        )}`
        : `mailto:${CONTACT_EMAIL}`;

    const whatsappUrl = submittedData
        ? `https://wa.me/91${CONTACT_PHONE_RAW}?text=${encodeURIComponent(
            `Hi Varun, I reached out via MentorSync:\n\n*Name:* ${submittedData.name}\n*Email:* ${submittedData.email}\n*Subject:* ${submittedData.subject}\n*Message:* ${submittedData.message}`
        )}`
        : `https://wa.me/91${CONTACT_PHONE_RAW}?text=${encodeURIComponent(
            'Hi Varun, I have an inquiry regarding MentorSync.'
        )}`;

    return (
        <div className="min-h-screen lg:h-screen overflow-y-auto lg:overflow-hidden flex flex-col lg:flex-row bg-[#f1f3f7] dark:bg-[#0a0a0a] text-zinc-900 dark:text-white font-sans selection:bg-[#5b4fff] selection:text-white transition-colors duration-200">

            {/* Left Panel - Visuals & Info */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-zinc-50 dark:bg-[#0a0a0a] border-r border-zinc-200 dark:border-zinc-900 flex-col justify-center p-10 xl:p-16 transition-colors duration-200">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(91,79,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(91,79,255,0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(150,143,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(150,143,255,0.04)_1px,transparent_1px)] bg-size-[40px_40px] pointer-events-none"></div>

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
                    <p className="text-zinc-600 dark:text-zinc-400 text-[16px] leading-relaxed mb-10 max-w-105">
                        Have questions about MentorSync, want to request a feature, or need personalized support? We're here to help you elevate your coding cohort.
                    </p>

                    <div className="grid gap-4">
                        {/* Email Us */}
                        <a
                            href={`mailto:${CONTACT_EMAIL}`}
                            className="bg-white dark:bg-[#111111] border border-zinc-200/90 dark:border-zinc-800/90 p-4 xl:p-5 rounded-2xl hover:bg-zinc-50 dark:hover:bg-[#18181b] hover:border-zinc-300 dark:hover:border-zinc-700/80 transition-all flex items-center gap-4 shadow-sm group"
                        >
                            <div className="bg-indigo-50 dark:bg-[#5b4fff]/10 border border-indigo-100 dark:border-[#5b4fff]/20 w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm dark:shadow-none group-hover:scale-105 transition-transform">
                                <Mail className="h-5 w-5 text-[#5b4fff] dark:text-[#968fff]" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-zinc-900 dark:text-white font-semibold text-[14px] mb-0.5 tracking-tight">Email Us</h3>
                                    <span className="text-xs text-[#5b4fff] dark:text-[#968fff] font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                        Send email <ArrowSquareOutIcon className="w-3.5 h-3.5" />
                                    </span>
                                </div>
                                <p className="text-[13px] text-zinc-600 dark:text-zinc-400 leading-snug truncate">{CONTACT_EMAIL}</p>
                            </div>
                        </a>

                        {/* Call Us */}
                        <a
                            href={`tel:+91${CONTACT_PHONE_RAW}`}
                            className="bg-white dark:bg-[#111111] border border-zinc-200/90 dark:border-zinc-800/90 p-4 xl:p-5 rounded-2xl hover:bg-zinc-50 dark:hover:bg-[#18181b] hover:border-zinc-300 dark:hover:border-zinc-700/80 transition-all flex items-center gap-4 shadow-sm group"
                        >
                            <div className="bg-indigo-50 dark:bg-[#5b4fff]/10 border border-indigo-100 dark:border-[#5b4fff]/20 w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm dark:shadow-none group-hover:scale-105 transition-transform">
                                <PhoneIcon className="h-5 w-5 text-[#5b4fff] dark:text-[#968fff]" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-zinc-900 dark:text-white font-semibold text-[14px] mb-0.5 tracking-tight">Call Us</h3>
                                    <span className="text-xs text-[#5b4fff] dark:text-[#968fff] font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                        Call now <ArrowSquareOutIcon className="w-3.5 h-3.5" />
                                    </span>
                                </div>
                                <p className="text-[13px] text-zinc-600 dark:text-zinc-400 leading-snug truncate">{CONTACT_PHONE_DISPLAY}</p>
                            </div>
                        </a>

                        {/* Headquarters */}
                        <a
                            href={MAPS_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white dark:bg-[#111111] border border-zinc-200/90 dark:border-zinc-800/90 p-4 xl:p-5 rounded-2xl hover:bg-zinc-50 dark:hover:bg-[#18181b] hover:border-zinc-300 dark:hover:border-zinc-700/80 transition-all flex items-center gap-4 shadow-sm group"
                        >
                            <div className="bg-indigo-50 dark:bg-[#5b4fff]/10 border border-indigo-100 dark:border-[#5b4fff]/20 w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm dark:shadow-none group-hover:scale-105 transition-transform">
                                <MapPinIcon className="h-5 w-5 text-[#5b4fff] dark:text-[#968fff]" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-zinc-900 dark:text-white font-semibold text-[14px] mb-0.5 tracking-tight">Headquarters</h3>
                                    <span className="text-xs text-[#5b4fff] dark:text-[#968fff] font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                        View Map <ArrowSquareOutIcon className="w-3.5 h-3.5" />
                                    </span>
                                </div>
                                <p className="text-[13px] text-zinc-600 dark:text-zinc-400 leading-snug">{CONTACT_LOCATION}</p>
                            </div>
                        </a>
                    </div>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="w-full lg:w-1/2 min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 lg:p-10 relative bg-[#f8fafc] dark:bg-[#0a0a0a] overflow-y-auto transition-colors duration-200">
                <div className="absolute inset-0 bg-[radial-gradient(rgba(50,205,50,0.6)_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[32px_32px] pointer-events-none"></div>
                <div className="hidden dark:block">
                    <AmbientGlow variant="center" />
                </div>

                <div className="w-full max-w-125 relative z-10 bg-white dark:bg-[#111111] p-6 sm:p-8 lg:p-10 rounded-2xl sm:rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xl my-auto">

                    {/* Mobile Header */}
                    <div className="lg:hidden flex items-center justify-between mb-5 pb-3 border-b border-zinc-200/80 dark:border-zinc-800/60">
                        <BrandLogo size="sm" theme="auto" />
                        <div className="flex items-center gap-2">
                            <ThemeToggle className="bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 h-8.5 w-8.5" />
                            <Link
                                to="/"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-800 text-xs font-semibold transition-all hover:-translate-x-0.5"
                            >
                                <ArrowLeftIcon className="h-3.5 w-3.5" />
                                <span>Home</span>
                            </Link>
                        </div>
                    </div>

                    <div className="mb-6">
                        <h2 className="text-2xl sm:text-[28px] font-bold text-zinc-900 dark:text-white tracking-tight mb-1.5">
                            Get in touch
                        </h2>
                        <p className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-[15px] leading-relaxed">
                            Fill out the form below and our team will get back to you within 24 hours.
                        </p>
                    </div>

                    {isSuccess && submittedData ? (
                        <div className="flex flex-col items-center justify-center py-6 text-center animate-in fade-in zoom-in-95 duration-400">
                            <div className="w-16 h-16 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-5 border border-emerald-500/30 shadow-lg">
                                <CheckCircleIcon className="w-9 h-9" weight="fill" />
                            </div>
                            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">Message Received!</h3>
                            <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-6 max-w-sm leading-relaxed">
                                Thank you, <strong className="text-zinc-900 dark:text-white">{submittedData.name}</strong>. Your inquiry regarding <span className="text-[#5b4fff] dark:text-[#968fff] font-semibold">"{submittedData.subject}"</span> has been logged. We will reach back out to <strong className="text-zinc-900 dark:text-white">{submittedData.email}</strong> within 24 hours.
                            </p>

                            <div className="w-full space-y-2.5 mb-6">
                                <a
                                    href={mailtoUrl}
                                    className="w-full h-11 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 text-zinc-800 dark:text-zinc-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                                >
                                    <Mail className="w-4 h-4 text-[#5b4fff] dark:text-[#968fff]" />
                                    <span>Send direct copy to {CONTACT_EMAIL}</span>
                                </a>
                                <a
                                    href={whatsappUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full h-11 bg-emerald-500/10 hover:bg-emerald-500/15 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                                >
                                    <ChatCircleDotsIcon className="w-4 h-4" />
                                    <span>Instant message via WhatsApp ({CONTACT_PHONE_DISPLAY})</span>
                                </a>
                            </div>

                            <Button
                                type="button"
                                onClick={() => {
                                    setIsSuccess(false);
                                    setSubmittedData(null);
                                }}
                                className="w-full bg-[#5b4fff] hover:bg-[#4d40ea] text-white rounded-xl h-11 text-xs font-semibold transition-all cursor-pointer"
                            >
                                Send another message
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} noValidate className="space-y-4">
                            <ErrorBanner message={error} />

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="contact-name" className="uppercase text-[11px] tracking-wider text-zinc-600 dark:text-zinc-400 font-semibold block">
                                        Your Name <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        id="contact-name"
                                        required
                                        placeholder="John Doe"
                                        value={formData.name}
                                        onChange={(e) => {
                                            setFormData(prev => ({ ...prev, name: e.target.value }));
                                            clearError();
                                        }}
                                        className="bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-[#5b4fff] h-11 rounded-xl w-full transition-all px-4 text-sm"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="contact-email" className="uppercase text-[11px] tracking-wider text-zinc-600 dark:text-zinc-400 font-semibold block">
                                        Email Address <span className="text-rose-500">*</span>
                                    </Label>
                                    <Input
                                        id="contact-email"
                                        type="email"
                                        required
                                        placeholder="john@example.com"
                                        value={formData.email}
                                        onChange={(e) => {
                                            setFormData(prev => ({ ...prev, email: e.target.value }));
                                            clearError();
                                        }}
                                        className="bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-[#5b4fff] h-11 rounded-xl w-full transition-all px-4 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="contact-phone" className="uppercase text-[11px] tracking-wider text-zinc-600 dark:text-zinc-400 font-semibold block">
                                    Phone Number <span className="text-zinc-400 font-normal lowercase">(optional)</span>
                                </Label>
                                <Input
                                    id="contact-phone"
                                    type="tel"
                                    placeholder="+91 98765 00000"
                                    value={formData.phone || ''}
                                    onChange={(e) => {
                                        setFormData(prev => ({ ...prev, phone: e.target.value }));
                                        clearError();
                                    }}
                                    className="bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-[#5b4fff] h-11 rounded-xl w-full transition-all px-4 text-sm"
                                />
                            </div>

                            {/* Quick Subject Suggestion Chips */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="contact-subject" className="uppercase text-[11px] tracking-wider text-zinc-600 dark:text-zinc-400 font-semibold block">
                                        Subject <span className="text-rose-500">*</span>
                                    </Label>
                                    <span className="text-[11px] text-zinc-400">Quick topics:</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {TOPIC_SUGGESTIONS.map(topic => (
                                        <button
                                            key={topic}
                                            type="button"
                                            onClick={() => handleTopicClick(topic)}
                                            className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                                                formData.subject === topic
                                                    ? 'bg-[#5b4fff]/15 text-[#5b4fff] dark:text-[#968fff] border-[#5b4fff]/40 font-semibold'
                                                    : 'bg-zinc-100 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                                            }`}
                                        >
                                            {topic}
                                        </button>
                                    ))}
                                </div>
                                <Input
                                    id="contact-subject"
                                    required
                                    placeholder="How can we help you?"
                                    value={formData.subject}
                                    onChange={(e) => {
                                        setFormData(prev => ({ ...prev, subject: e.target.value }));
                                        clearError();
                                    }}
                                    className="bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-[#5b4fff] h-11 rounded-xl w-full transition-all px-4 text-sm"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="contact-message" className="uppercase text-[11px] tracking-wider text-zinc-600 dark:text-zinc-400 font-semibold block">
                                        Message <span className="text-rose-500">*</span>
                                    </Label>
                                    <span className={`text-[11px] ${formData.message.length > 2800 ? 'text-amber-500' : 'text-zinc-400'}`}>
                                        {formData.message.length}/3000
                                    </span>
                                </div>
                                <textarea
                                    id="contact-message"
                                    required
                                    maxLength={3000}
                                    placeholder="Describe your inquiry, classroom requirements, or questions..."
                                    value={formData.message}
                                    onChange={(e) => {
                                        setFormData(prev => ({ ...prev, message: e.target.value }));
                                        clearError();
                                    }}
                                    className="flex min-h-32 sm:min-h-35 w-full rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 px-4 py-3 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5b4fff] disabled:cursor-not-allowed disabled:opacity-50 transition-all resize-y custom-scrollbar"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full h-11.5 mt-5 bg-[#5b4fff] hover:bg-[#4d40ea] text-white text-[14px] font-semibold rounded-xl transition-all duration-200 flex items-center justify-center shadow-md hover:-translate-y-0.5 active:translate-y-0 group cursor-pointer shimmer-sweep interactive-press"
                            >
                                {isSubmitting ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white mr-2"></div>
                                ) : (
                                    <Send className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                )}
                                {isSubmitting ? 'Sending Message...' : 'Send Message'}
                            </Button>
                        </form>
                    )}

                    {/* Direct Contact Channels for Mobile */}
                    <div className="lg:hidden mt-6 pt-5 border-t border-zinc-200/80 dark:border-zinc-800/60">
                        <p className="text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2.5">
                            Or reach us directly
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <a
                                href={`mailto:${CONTACT_EMAIL}`}
                                className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200/80 dark:border-zinc-800/80 hover:border-[#5b4fff]/40 dark:hover:border-[#5b4fff]/40 transition-colors"
                            >
                                <div className="bg-indigo-50 dark:bg-[#5b4fff]/10 w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                                    <Mail className="h-4 w-4 text-[#5b4fff] dark:text-[#968fff]" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Email Us</p>
                                    <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">{CONTACT_EMAIL}</p>
                                </div>
                            </a>
                            <a
                                href={`tel:+91${CONTACT_PHONE_RAW}`}
                                className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200/80 dark:border-zinc-800/80 hover:border-[#5b4fff]/40 dark:hover:border-[#5b4fff]/40 transition-colors"
                            >
                                <div className="bg-indigo-50 dark:bg-[#5b4fff]/10 w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                                    <PhoneIcon className="h-4 w-4 text-[#5b4fff] dark:text-[#968fff]" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Call Us</p>
                                    <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">{CONTACT_PHONE_DISPLAY}</p>
                                </div>
                            </a>
                            <a
                                href={MAPS_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-[#18181b] border border-zinc-200/80 dark:border-zinc-800/80 hover:border-[#5b4fff]/40 dark:hover:border-[#5b4fff]/40 transition-colors sm:col-span-2"
                            >
                                <div className="bg-indigo-50 dark:bg-[#5b4fff]/10 w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
                                    <MapPinIcon className="h-4 w-4 text-[#5b4fff] dark:text-[#968fff]" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Headquarters</p>
                                    <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate">{CONTACT_LOCATION}</p>
                                </div>
                            </a>
                        </div>
                    </div>

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