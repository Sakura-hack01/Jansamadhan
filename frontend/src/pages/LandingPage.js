import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { FiSearch, FiMail, FiShield, FiClock, FiPhone, FiMapPin, FiChevronRight, FiChevronDown, FiFileText, FiUsers, FiCheckCircle, FiAlertCircle, FiHelpCircle, FiExternalLink, FiArrowRight, FiDownload, FiGlobe, FiStar, FiBarChart2, FiPlay } from 'react-icons/fi';
import { RiGovernmentLine, RiBuilding4Line } from 'react-icons/ri';
import { MdEditNote, MdTrackChanges, MdOutlineGavel, MdSupportAgent, MdOutlineNotificationsActive, MdOutlineFeedback, MdOutlinePolicy, MdLanguage, MdAccessTime } from 'react-icons/md';
import { BiPackage } from 'react-icons/bi';
import { HiOutlineDocumentSearch, HiOutlineUserGroup, HiOutlineChartBar } from 'react-icons/hi';

// ===== Animated Counter =====
function AnimatedCounter({ target, suffix = '', duration = 2000 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, target, duration]);
  return <span ref={ref}>{count.toLocaleString('en-IN')}{suffix}</span>;
}

// ===== Smooth scroll helper =====
function scrollToHash(hash) {
  const id = hash.replace('#', '');
  const el = document.getElementById(id);
  if (el) {
    const headerOffset = 80;
    const top = el.getBoundingClientRect().top + window.pageYOffset - headerOffset;
    window.scrollTo({ top, behavior: 'smooth' });
  }
}

// ===== Smart Nav Link (handles both hash and route) =====
function SmartNavLink({ href, onClick, children, style, onMouseOver, onMouseOut }) {
  const navigate = useNavigate();
  const handleClick = (e) => {
    if (onClick) onClick();
    if (href.startsWith('#')) {
      e.preventDefault();
      scrollToHash(href);
    } else {
      e.preventDefault();
      navigate(href);
    }
  };
  return (
    <a href={href} onClick={handleClick} style={{ textDecoration: 'none', ...style }} onMouseOver={onMouseOver} onMouseOut={onMouseOut}>
      {children}
    </a>
  );
}

// ===== Dropdown Nav Item =====
function NavDropdown({ label, items, isActive }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  return (
    <div ref={ref} style={{ position: 'relative' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          padding: '14px 18px', color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: 500,
          whiteSpace: 'nowrap', transition: 'all 0.2s', background: open ? 'rgba(255,255,255,0.1)' : 'transparent',
          border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          borderBottom: isActive ? '3px solid #FF9933' : '3px solid transparent', fontFamily: 'inherit',
        }}
      >
        {label} <FiChevronDown size={14} style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: '0.2s' }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute', top: '100%', left: 0, background: '#fff',
              borderRadius: '0 0 10px 10px', boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
              minWidth: 260, zIndex: 200, overflow: 'hidden', border: '1px solid #dee2e6', borderTop: '3px solid #FF9933',
            }}
          >
            {items.map((item, i) => (
              <SmartNavLink key={i} href={item.href} onClick={() => setOpen(false)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px',
                fontSize: '14px', color: '#343a40', fontWeight: 500, borderBottom: i < items.length - 1 ? '1px solid #f0f0f0' : 'none',
                transition: 'all 0.15s',
              }}
                onMouseOver={e => { e.currentTarget.style.background = '#f8f9fa'; e.currentTarget.style.color = '#000080'; }}
                onMouseOut={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#343a40'; }}
              >
                {item.icon && <span style={{ color: '#FF9933', display: 'flex' }}>{item.icon}</span>}
                {item.label}
              </SmartNavLink>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ===== Accordion (FAQ) =====
function Accordion({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: '#fff', borderRadius: '10px', marginBottom: '10px', border: '1px solid #dee2e6', overflow: 'hidden' }}>
      <button onClick={() => setOpen(!open)} style={{
        width: '100%', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
      }}>
        <span style={{ fontSize: '15px', fontWeight: 700, color: '#000080' }}>{question}</span>
        <FiChevronDown size={18} color="#6c757d" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: '0.3s', flexShrink: 0 }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
            <div style={{ padding: '0 24px 18px', fontSize: '14px', color: '#6c757d', lineHeight: 1.7 }}>{answer}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ===== MAIN COMPONENT =====
export default function LandingPage() {
  const [trackingId, setTrackingId] = useState('');
  const [newsTicker, setNewsTicker] = useState(0);
  const navigate = useNavigate();

  const containerV = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemV = { hidden: { opacity: 0, y: 25 }, visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80, damping: 15 } } };

  const newsItems = [
    '📢 JanSamadhan Portal v7.0 launched with AI-powered grievance routing — 15 Mar 2026',
    '📢 Comprehensive Guidelines for Handling Public Grievances issued by DoPG — 02 Mar 2026',
    '📢 UMANG App integration completed — Citizens can now file grievances via mobile — 18 Feb 2026',
    '📢 Nodal PG Officers list updated for all Central Ministries — 01 Feb 2026',
    '📢 Government is NOT charging any fee for filing grievances — Beware of scams',
  ];

  useEffect(() => {
    const timer = setInterval(() => setNewsTicker(p => (p + 1) % newsItems.length), 4000);
    return () => clearInterval(timer);
  }, []);

  const quickLinks = [
    { icon: <MdEditNote size={28} />, title: 'Lodge Public Grievance', desc: 'File a new grievance against any government department', link: '/register', color: '#FF9933' },
    { icon: <MdTrackChanges size={28} />, title: 'Track Grievance Status', desc: 'Check your complaint status with Registration ID', link: '/login', color: '#000080' },
    { icon: <MdOutlineFeedback size={28} />, title: 'Rate Grievance / Feedback', desc: 'Provide feedback on grievance resolution quality', link: '/login', color: '#138808' },
    { icon: <MdOutlineGavel size={28} />, title: 'File an Appeal', desc: 'Escalate if you are not satisfied with the resolution', link: '/login', color: '#dc3545' },
    { icon: <FiPhone size={28} />, title: 'Toll-Free Helpline', desc: '1800-11-0031 (Mon-Sat, 9AM-6PM)', link: '#contact', color: '#6c757d' },
    { icon: <FiMapPin size={28} />, title: 'Physical Centers & Map', desc: 'Turn-by-turn directions to nearest office', link: '/centers', color: '#17a2b8' },
  ];

  const features = [
    { icon: <MdEditNote size={32} />, title: 'Online Grievance Filing', desc: 'Submit complaints to any government department digitally. Available 24×7 from any device — mobile, tablet, or desktop.' },
    { icon: <FiSearch size={32} />, title: 'Real-time Tracking', desc: 'Track complaint status with unique Registration ID. View complete audit trail with officer names and action taken.' },
    { icon: <FiMail size={32} />, title: 'Email & SMS Alerts', desc: 'Instant notifications via email and SMS for every status change — from filing to final resolution.' },
    { icon: <RiBuilding4Line size={32} />, title: '580+ Departments', desc: 'Connected to all Central Ministries, State Governments, District bodies, and PSUs seamlessly.' },
    { icon: <MdOutlineGavel size={32} />, title: 'Appeal Mechanism', desc: 'If the resolution is unsatisfactory, file an appeal that goes to a higher Nodal Authority for independent review.' },
    { icon: <FiShield size={32} />, title: 'Government-Grade Security', desc: '256-bit SSL encryption, JWT authentication, CAPTCHA verification, and XSS/NoSQL injection prevention.' },
    { icon: <MdSupportAgent size={32} />, title: 'Pradarshak AI Assistant', desc: 'AI-powered chatbot provides 24/7 guidance on filing, tracking, and navigating the portal. Available on every page.' },
    { icon: <MdLanguage size={32} />, title: 'Multi-Language Support', desc: 'Available in Hindi, English, and 20+ regional languages to serve citizens across all states and union territories.' },
    { icon: <BiPackage size={32} />, title: 'Document Delivery', desc: 'Request official government documents and certificates to be delivered to your registered address.' },
    { icon: <MdAccessTime size={32} />, title: 'SLA-Based Resolution', desc: 'All grievances follow defined Service Level Agreements — Regular (30 days), Priority (15 days), Emergency (7 days).' },
    { icon: <FiBarChart2 size={32} />, title: 'Analytics Dashboard', desc: 'Department-wise analytics, resolution rates, pending grievances — full transparency in performance metrics.' },
    { icon: <FiStar size={32} />, title: 'Citizen Feedback System', desc: 'Rate resolution quality on a 5-star scale. Poor-rated grievances automatically qualify for appeal.' },
  ];

  const processSteps = [
    { step: 1, title: 'Register & Login', desc: 'Create your citizen account with email/mobile or sign in via Google or Email OTP verification.', color: '#FF9933' },
    { step: 2, title: 'Select Department', desc: 'Choose from 580+ departments — Central Ministries, State Government bodies, PSUs, or District-level offices.', color: '#000080' },
    { step: 3, title: 'Describe Grievance', desc: 'Write your complaint with details. Attach supporting documents (PDF, JPG). Max 10MB per attachment.', color: '#138808' },
    { step: 4, title: 'Get Registration No.', desc: 'Receive a unique Registration Number instantly via SMS and email. Use it to track status anytime.', color: '#dc3545' },
    { step: 5, title: 'Officer Review', desc: 'Your grievance is forwarded to the concerned Nodal PG Officer. They must respond within the defined SLA.', color: '#6c757d' },
    { step: 6, title: 'Resolution & Appeal', desc: 'Get resolution and provide feedback. If rated "Poor", an Appeal option is automatically enabled.', color: '#000080' },
  ];

  const centralDepartments = [
    'Ministry of Home Affairs', 'Ministry of Finance', 'Ministry of Health & Family Welfare',
    'Ministry of Education', 'Ministry of Railways', 'Ministry of Defence',
    'Ministry of Agriculture & Farmers Welfare', 'Ministry of Electronics & IT',
    'Ministry of Commerce & Industry', 'Ministry of External Affairs',
    'Ministry of Law & Justice', 'Ministry of Environment, Forest & Climate Change',
    'Ministry of Housing & Urban Affairs', 'Ministry of Labour & Employment',
    'Ministry of Road Transport & Highways', 'Ministry of Women & Child Development',
  ];

  const stateDepartments = [
    'Uttar Pradesh', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Rajasthan',
    'Gujarat', 'Madhya Pradesh', 'West Bengal', 'Bihar', 'Telangana',
    'Andhra Pradesh', 'Kerala', 'Punjab', 'Haryana', 'Delhi NCT',
    'Uttarakhand', 'Jharkhand', 'Chhattisgarh', 'Odisha', 'Assam',
  ];

  const announcements = [
    { date: '15 Mar 2026', title: 'Comprehensive Guidelines for Handling Public Grievances issued by DoPG', type: 'Circular', size: 'PDF - 1.05 MB' },
    { date: '02 Mar 2026', title: 'JanSamadhan Portal v7.0 launched with AI-powered routing and Pradarshak Assistant', type: 'Update', size: '' },
    { date: '18 Feb 2026', title: 'Integration with UMANG App completed for seamless mobile grievance filing', type: 'Integration', size: '' },
    { date: '01 Feb 2026', title: 'Nodal PG Officers list updated for all Central Ministries (2026 Edition)', type: 'Update', size: 'PDF - 0.25 MB' },
    { date: '15 Jan 2026', title: 'DoPT OM on Service Matters: Grievances to be routed through prescribed channels first', type: 'OM', size: 'PDF - 0.15 MB' },
    { date: '01 Jan 2026', title: 'Annual Report 2025: 2.5M+ grievances resolved with 95% satisfaction rate', type: 'Report', size: 'PDF - 3.2 MB' },
  ];

  const faqs = [
    { q: 'Who can file a grievance on this portal?', a: 'Any citizen of India can file a grievance relating to service delivery by any Government department — Central, State, or District level. NRIs with valid Indian identity can also file grievances related to Indian government services.' },
    { q: 'How do I track the status of my grievance?', a: 'Use the "Track Status" option from the navigation menu. Enter your unique Grievance Registration Number provided at the time of filing. You can also check status via the UMANG mobile app or by calling the Toll-Free Helpline 1800-11-0031.' },
    { q: 'What is the expected resolution timeline?', a: 'Regular Grievances: 30 working days. Priority Grievances: 15 working days. Emergency Grievances: 7 working days. You will receive notifications at every stage — Acknowledged → Assigned → In Progress → Resolved.' },
    { q: 'Can I file a grievance anonymously?', a: 'Yes, JanSamadhan allows anonymous grievance filing. However, providing your contact details helps departments communicate with you for clarification and send resolution updates. Anonymous grievances can only be tracked via the Registration Number.' },
    { q: 'What if I am not satisfied with the resolution?', a: 'After closure of your grievance, you can provide feedback with a star rating. If your rating is "Poor" (1-2 stars), the option to file an Appeal is automatically enabled. The appeal goes to the designated Appellate Authority (higher Nodal Officer) for independent review.' },
    { q: 'What subjects are NOT addressed through this portal?', a: 'The following are NOT handled: (1) RTI matters, (2) Court-related / Sub-judice matters, (3) Religious matters, (4) Service matters of Government employees unless prescribed departmental channels are exhausted first as per DoPT OM dated 31.08.2015.' },
    { q: 'Is there any fee for filing a grievance?', a: 'Absolutely NOT. The Government does NOT charge any fee for filing grievances on JanSamadhan. Beware of third-party websites or agents claiming to charge fees. Report such scams immediately.' },
    { q: 'What documents do I need to upload?', a: 'Identity proof (Aadhaar/PAN), previous correspondence with the department, relevant receipts/bills, photographs or evidence. Supported formats: PDF, JPG, PNG. Maximum file size: 10 MB per attachment.' },
  ];

  const handleTrack = (e) => {
    e.preventDefault();
    if (trackingId.trim()) navigate(`/track/${trackingId.trim()}`);
  };

  // Render nav items
  const navItems = [
    { type: 'link', label: 'Home', href: '/', active: true },
    {
      type: 'dropdown', label: 'Grievance', items: [
        { label: 'Lodge Public Grievance', href: '/register', icon: <MdEditNote size={18} /> },
        { label: 'Lodge Pension Grievance', href: '/register', icon: <FiFileText size={18} /> },
        { label: 'Lodge Service Matter Grievance', href: '/register', icon: <FiUsers size={18} /> },
        { label: 'Lodge Grievance for PM Office', href: '/register', icon: <RiGovernmentLine size={18} /> },
        { label: 'View / Edit Saved Draft', href: '/login', icon: <MdEditNote size={18} /> },
        { label: 'Send Reminder / Clarification', href: '/login', icon: <FiClock size={18} /> },
        { label: 'Rate Closed Grievance', href: '/login', icon: <FiStar size={18} /> },
      ]
    },
    {
      type: 'dropdown', label: 'View Status', items: [
        { label: 'Grievance Status', href: '/login', icon: <FiSearch size={18} /> },
        { label: 'Appeal Status', href: '/login', icon: <MdOutlineGavel size={18} /> },
        { label: 'Pension Grievance Status', href: '/login', icon: <FiFileText size={18} /> },
        { label: 'Reminder Status', href: '/login', icon: <FiClock size={18} /> },
        { label: 'Monthly Progress Report', href: '/login', icon: <FiBarChart2 size={18} /> },
      ]
    },
    {
      type: 'dropdown', label: 'Nodal PG Officers', items: [
        { label: 'Central Ministry Officers', href: '#departments', icon: <RiGovernmentLine size={18} /> },
        { label: 'State Government Officers', href: '#departments', icon: <FiMapPin size={18} /> },
        { label: 'District Level Officers', href: '#departments', icon: <FiMapPin size={18} /> },
        { label: 'PSU / Autonomous Body Officers', href: '#departments', icon: <RiBuilding4Line size={18} /> },
        { label: 'Directorate of Public Grievances', href: '#about', icon: <RiGovernmentLine size={18} /> },
        { label: 'Download Officers Directory (PDF)', href: '#contact', icon: <FiDownload size={18} /> },
      ]
    },
    { type: 'link', label: 'Redress Process', href: '#process' },
    { type: 'link', label: 'Physical Centers Map', href: '/centers' },
    {
      type: 'dropdown', label: 'Nodal Authority for Appeal', items: [
        { label: 'View Appellate Authorities', href: '/login', icon: <MdOutlineGavel size={18} /> },
        { label: 'File an Appeal (Unsatisfied)', href: '/login', icon: <FiFileText size={18} /> },
        { label: 'Appeal Guidelines & Rules', href: '#faq', icon: <FiHelpCircle size={18} /> },
        { label: 'DPG — Cabinet Secretariat', href: '#about', icon: <RiGovernmentLine size={18} /> },
        { label: 'Appeal Status & Tracking', href: '/login', icon: <FiSearch size={18} /> },
      ]
    },
    { type: 'link', label: 'About Us', href: '#about' },
    { type: 'link', label: 'FAQs', href: '#faq' },
    { type: 'link', label: 'Contact Us', href: '#contact' },
  ];

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      {/* Tricolor Top Bar */}
      <div className="tricolor-bar" />

      {/* Top Utility Strip (no screen reader) */}
      <div style={{ background: '#f8f9fa', borderBottom: '1px solid #dee2e6', padding: '5px 0', fontSize: '12px' }}>
        <div className="container-lg" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', color: '#495057' }}>
            <a href="#main-content" style={{ color: '#495057', cursor: 'pointer', fontWeight: 500 }}>Skip to Main Content</a>
          </div>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center', color: '#495057' }}>
            <span style={{ cursor: 'pointer', fontSize: 11 }} title="Decrease Font Size">A<sup>-</sup></span>
            <span style={{ cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>A</span>
            <span style={{ cursor: 'pointer', fontSize: 15 }} title="Increase Font Size">A<sup>+</sup></span>
            <span style={{ width: 1, height: 14, background: '#ced4da', display: 'inline-block' }} />
            <span style={{ fontWeight: 700, color: '#000080', cursor: 'pointer' }}>English</span>
            <span style={{ cursor: 'pointer' }}>हिंदी</span>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <motion.header initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }}
        style={{ background: '#fff', borderBottom: '2px solid #dee2e6', padding: '10px 0', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}
      >
        <div className="container-lg" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none' }}>
            <img src="/emblem.png" alt="National Emblem of India" style={{ height: 68, width: 68, objectFit: 'contain' }} />
            <div>
              <div style={{ fontSize: '10px', color: '#6c757d', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>
                Ministry of Personnel, Public Grievances & Pensions
              </div>
              <div style={{ fontSize: '25px', fontWeight: 900, color: '#000080', fontFamily: 'Poppins, sans-serif', lineHeight: 1.1 }}>
                JanSamadhan
              </div>
              <div style={{ fontSize: '11px', color: '#6c757d', fontWeight: 500 }}>
                A proposed Centralised Public Grievance Redress & Monitoring System
              </div>
            </div>
          </Link>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Link to="/login" className="btn btn-outline" style={{ padding: '10px 22px', fontSize: '13px', borderRadius: '8px' }}>Sign In</Link>
            <Link to="/register" className="btn btn-saffron" style={{ padding: '10px 22px', fontSize: '13px', borderRadius: '8px' }}>Register Now</Link>
          </div>
        </div>
      </motion.header>

      {/* Navigation Bar with Dropdowns */}
      <nav style={{ background: '#000080', padding: '0', position: 'relative', zIndex: 150 }}>
        <div className="container-lg" style={{ display: 'flex', alignItems: 'center', gap: '0', flexWrap: 'wrap' }}>
          {navItems.map((item, i) => (
            item.type === 'dropdown' ? (
              <NavDropdown key={i} label={item.label} items={item.items} />
            ) : (
              <SmartNavLink key={i} href={item.href} style={{
                padding: '14px 18px', color: 'rgba(255,255,255,0.9)', fontSize: '14px', fontWeight: 500,
                whiteSpace: 'nowrap', transition: 'all 0.2s', display: 'block',
                borderBottom: item.active ? '3px solid #FF9933' : '3px solid transparent',
              }}
                onMouseOver={e => { e.target.style.background = 'rgba(255,255,255,0.1)'; e.target.style.borderBottomColor = '#FF9933'; }}
                onMouseOut={e => { e.target.style.background = 'transparent'; if (!item.active) e.target.style.borderBottomColor = 'transparent'; }}
              >{item.label}</SmartNavLink>
            )
          ))}
        </div>
      </nav>

      {/* News Ticker */}
      <div style={{ background: '#FFF3E0', borderBottom: '1px solid #FFE0B2', padding: '8px 0', overflow: 'hidden' }}>
        <div className="container-lg" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ background: '#FF9933', color: '#fff', padding: '3px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap', textTransform: 'uppercase' }}>Latest</span>
          <AnimatePresence mode="wait">
            <motion.span key={newsTicker} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} transition={{ duration: 0.3 }}
              style={{ fontSize: '13px', color: '#343a40', fontWeight: 500 }}
            >{newsItems[newsTicker]}</motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* Hero Banner */}
      <section id="main-content" style={{ background: 'linear-gradient(135deg, #000080 0%, #00005C 60%, #1A1A2E 100%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'url(/banner.png) center/cover no-repeat', opacity: 0.12 }} />
        <div className="container-lg" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '70px 24px', position: 'relative', zIndex: 2, gap: '40px', flexWrap: 'wrap' }}>
          <motion.div initial="hidden" animate="visible" variants={containerV} style={{ flex: '1 1 500px', maxWidth: 620 }}>
            <motion.div variants={itemV} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: '100px', background: 'rgba(255,153,51,0.2)', border: '1px solid rgba(255,153,51,0.4)', color: '#FFB366', fontSize: '13px', fontWeight: 600, marginBottom: 20 }}>
              <RiGovernmentLine size={16} /> Official Government Portal &middot; Available 24/7
            </motion.div>
            <motion.h1 variants={itemV} style={{ fontSize: '48px', fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: '18px', fontFamily: 'Poppins, sans-serif' }}>
              Your Grievance,{' '}
              <span style={{ color: '#FF9933' }}>Our Priority.</span>
            </motion.h1>
            <motion.p variants={itemV} style={{ fontSize: '17px', color: 'rgba(255,255,255,0.75)', maxWidth: 540, marginBottom: '28px', lineHeight: 1.7 }}>
              Lodge, track, and resolve public grievances against any Central or State Government department. A digital platform serving <strong style={{ color: '#fff' }}>1.4 billion citizens</strong>.
            </motion.p>

            {/* Inline Tracking Widget */}
            <motion.div variants={itemV} style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: '14px', padding: '20px', border: '1px solid rgba(255,255,255,0.15)', marginBottom: 24 }}>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <FiSearch size={14} style={{ marginRight: 6 }} /> Quick Track Your Grievance
              </div>
              <form onSubmit={handleTrack} style={{ display: 'flex', gap: 8 }}>
                <input value={trackingId} onChange={e => setTrackingId(e.target.value)} placeholder="Enter Registration Number (e.g. JANSR/2026/00001)" style={{
                  flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '14px', outline: 'none',
                }} />
                <button type="submit" className="btn btn-saffron" style={{ padding: '12px 24px', borderRadius: '8px', fontWeight: 700 }}>
                  Track <FiArrowRight size={16} />
                </button>
              </form>
            </motion.div>

            <motion.div variants={itemV} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link to="/register">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="btn btn-saffron btn-lg">
                  <MdEditNote size={20} /> Lodge Grievance
                </motion.button>
              </Link>
              <Link to="/login">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="btn btn-ghost btn-lg">
                  <MdOutlineGavel size={20} /> File Appeal
                </motion.button>
              </Link>
              <Link to="/centers">
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="btn btn-white btn-lg">
                  <FiMapPin size={20} /> Find Physical Centers
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.3 }} style={{ flex: '1 1 360px', maxWidth: 460 }}>
            <img src="/citizens.png" alt="Citizens using JanSamadhan" style={{ width: '100%', borderRadius: '18px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }} />
          </motion.div>
        </div>
      </section>

      {/* Quick Action Cards */}
      <section style={{ background: '#fff', padding: '0', marginTop: '-36px', position: 'relative', zIndex: 10 }}>
        <div className="container-lg">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={containerV}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}
          >
            {quickLinks.map((item, idx) => (
              <motion.div key={idx} variants={itemV} whileHover={{ y: -5 }}>
                <Link to={item.link} style={{ textDecoration: 'none' }}>
                  <div className="gov-card" style={{ padding: '22px 20px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}>
                    <div style={{ width: 50, height: 50, borderRadius: '10px', background: `${item.color}12`, color: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {item.icon}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A2E', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                      <div style={{ fontSize: '12px', color: '#6c757d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.desc}</div>
                    </div>
                    <FiChevronRight size={18} color="#adb5bd" style={{ marginLeft: 'auto', flexShrink: 0 }} />
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" style={{ padding: '70px 0', background: '#f8f9fa' }}>
        <div className="container-lg" style={{ maxWidth: 900, margin: '0 auto' }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={containerV}>
            <motion.div variants={itemV} style={{ textAlign: 'center' }}>
              <span style={{ display: 'inline-block', padding: '5px 16px', borderRadius: '100px', background: '#000080', color: '#fff', fontSize: '11px', fontWeight: 700, marginBottom: 14, letterSpacing: '1px', textTransform: 'uppercase' }}>About JanSamadhan</span>
              <h2 style={{ fontSize: '34px', fontWeight: 800, color: '#000080', marginBottom: '18px', fontFamily: 'Poppins, sans-serif' }}>
                Centralized Public Grievance Redress & Monitoring System
              </h2>
            </motion.div>
            <motion.div variants={itemV}>
              <p style={{ fontSize: '15px', color: '#495057', lineHeight: 1.8, marginBottom: 16 }}>
                <strong>JanSamadhan (CPGRAMS)</strong> is an online platform available to citizens <strong>24×7</strong> to lodge their grievances to public authorities on any subject related to service delivery. It is a single portal connected to all the <strong>Ministries/Departments of Government of India</strong> and States. Every Ministry and State has role-based access to this system.
              </p>
              <p style={{ fontSize: '15px', color: '#495057', lineHeight: 1.8, marginBottom: 16 }}>
                JanSamadhan is also accessible through a standalone mobile application downloadable through Google Play Store and a mobile application integrated with <strong>UMANG</strong>. The status of any grievance can be tracked with the unique Registration ID.
              </p>
              <p style={{ fontSize: '15px', color: '#495057', lineHeight: 1.8 }}>
                The portal provides an <strong>appeal facility</strong> to citizens if they are not satisfied with the resolution. After closure, complainants can provide feedback. If rated "Poor," an appeal is automatically enabled for escalated review by the Appellate Authority.
              </p>
            </motion.div>
            {/* Exclusion Notice */}
            <motion.div variants={itemV} style={{ marginTop: 24, padding: '18px 22px', background: '#fff3cd', borderRadius: '10px', border: '1px solid #ffeeba' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, color: '#856404', fontWeight: 700, fontSize: '14px' }}>
                <FiAlertCircle size={18} /> Grievances NOT Addressed Through This Portal
              </div>
              <ul style={{ paddingLeft: '20px', fontSize: '13px', color: '#856404', lineHeight: 1.9, margin: 0 }}>
                <li>RTI (Right to Information) Matters</li>
                <li>Court-related / Sub-judice Matters</li>
                <li>Religious Matters</li>
                <li>Service matters of Government employees unless departmental channels are exhausted <em>(as per DoPT OM No. 11013/08/2013-Estt.(A-III) dated 31.08.2015)</em></li>
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Statistics */}
      <section style={{ background: 'linear-gradient(135deg, #000080, #00005C)', padding: '50px 0' }}>
        <div className="container-lg">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={containerV}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '28px', textAlign: 'center' }}
          >
            {[
              { value: 2500000, suffix: '+', label: 'Grievances Resolved', icon: <FiCheckCircle size={26} /> },
              { value: 580, suffix: '+', label: 'Departments Connected', icon: <RiBuilding4Line size={26} /> },
              { value: 36, suffix: '', label: 'States & UTs Covered', icon: <FiMapPin size={26} /> },
              { value: 7029735, suffix: '', label: 'Total Portal Visitors', icon: <HiOutlineUserGroup size={26} /> },
              { value: 95, suffix: '%', label: 'Resolution Rate', icon: <HiOutlineChartBar size={26} /> },
              { value: 30, suffix: ' Days', label: 'Avg. Resolution Time', icon: <FiClock size={26} /> },
            ].map((stat, idx) => (
              <motion.div key={idx} variants={itemV} style={{ color: '#fff' }}>
                <div style={{ color: '#FF9933', marginBottom: 10, display: 'flex', justifyContent: 'center' }}>{stat.icon}</div>
                <div style={{ fontSize: '36px', fontWeight: 900, fontFamily: 'Poppins, sans-serif', marginBottom: 2 }}>
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '70px 0', background: '#fff' }}>
        <div className="container-lg">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={containerV}>
            <motion.div variants={itemV} style={{ textAlign: 'center', marginBottom: '48px' }}>
              <span style={{ display: 'inline-block', padding: '5px 16px', borderRadius: '100px', background: '#FF993315', color: '#FF9933', fontSize: '11px', fontWeight: 700, marginBottom: 14, letterSpacing: '1px', textTransform: 'uppercase' }}>Portal Features</span>
              <h2 style={{ fontSize: '34px', fontWeight: 800, color: '#000080', fontFamily: 'Poppins' }}>Salient Features of JanSamadhan</h2>
            </motion.div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
              {features.map((f, idx) => (
                <motion.div key={idx} variants={itemV} whileHover={{ y: -4 }} className="gov-card" style={{ padding: '26px 22px' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '12px', background: idx % 3 === 0 ? '#FF993310' : idx % 3 === 1 ? '#00008010' : '#13880810', color: idx % 3 === 0 ? '#FF9933' : idx % 3 === 1 ? '#000080' : '#138808', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    {f.icon}
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1A1A2E', marginBottom: '8px', fontFamily: 'Poppins' }}>{f.title}</h3>
                  <p style={{ fontSize: '13px', color: '#6c757d', lineHeight: 1.6 }}>{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Redress Process */}
      <section id="process" style={{ padding: '70px 0', background: '#f8f9fa' }}>
        <div className="container-lg">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={containerV}>
            <motion.div variants={itemV} style={{ textAlign: 'center', marginBottom: '48px' }}>
              <span style={{ display: 'inline-block', padding: '5px 16px', borderRadius: '100px', background: '#13880815', color: '#138808', fontSize: '11px', fontWeight: 700, marginBottom: 14, letterSpacing: '1px', textTransform: 'uppercase' }}>Redress Process Flow</span>
              <h2 style={{ fontSize: '34px', fontWeight: 800, color: '#000080', fontFamily: 'Poppins' }}>How Grievance Redressal Works</h2>
            </motion.div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '20px', maxWidth: 1100, margin: '0 auto' }}>
              {processSteps.map((item, idx) => (
                <motion.div key={idx} variants={itemV} whileHover={{ y: -3 }} style={{ textAlign: 'center', position: 'relative' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: item.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 900, fontFamily: 'Poppins', margin: '0 auto 14px', boxShadow: `0 6px 20px ${item.color}40` }}>
                    {item.step}
                  </div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A2E', marginBottom: 6 }}>{item.title}</h4>
                  <p style={{ fontSize: '12px', color: '#6c757d', lineHeight: 1.5 }}>{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Departments + Announcements */}
      <section id="departments" style={{ padding: '70px 0', background: '#fff' }}>
        <div className="container-lg" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '36px' }}>
          {/* Central Departments */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={containerV}>
            <motion.h3 variants={itemV} style={{ fontSize: '22px', fontWeight: 800, color: '#000080', marginBottom: '20px', fontFamily: 'Poppins', display: 'flex', alignItems: 'center', gap: 10 }}>
              <RiGovernmentLine size={22} /> Central Ministries / Departments
            </motion.h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {centralDepartments.map((d, i) => (
                <motion.div key={i} variants={itemV} style={{ padding: '10px 14px', background: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef', fontSize: '12px', fontWeight: 500, color: '#343a40', cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = '#FF9933'; e.currentTarget.style.background = '#FFF9F3'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = '#e9ecef'; e.currentTarget.style.background = '#f8f9fa'; }}
                >{d}</motion.div>
              ))}
            </div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#000080', marginTop: 28, marginBottom: 16, fontFamily: 'Poppins', display: 'flex', alignItems: 'center', gap: 10 }}>
              <FiMapPin size={20} /> State Governments / UTs
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {stateDepartments.map((s, i) => (
                <span key={i} style={{ padding: '6px 12px', background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '6px', fontSize: '11px', fontWeight: 500, color: '#495057', cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = '#138808'; e.currentTarget.style.color = '#138808'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = '#e9ecef'; e.currentTarget.style.color = '#495057'; }}
                >{s}</span>
              ))}
            </div>
          </motion.div>

          {/* Announcements */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={containerV}>
            <motion.h3 variants={itemV} style={{ fontSize: '22px', fontWeight: 800, color: '#000080', marginBottom: '20px', fontFamily: 'Poppins', display: 'flex', alignItems: 'center', gap: 10 }}>
              <MdOutlineNotificationsActive size={22} /> What's New / Circulars
            </motion.h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {announcements.map((item, idx) => (
                <motion.div key={idx} variants={itemV} style={{ padding: '16px 18px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef', borderLeft: '4px solid #FF9933', cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.08)'}
                  onMouseOut={e => e.currentTarget.style.boxShadow = 'none'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#FF9933', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.date}</span>
                    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: '#E3F2FD', color: '#1565C0', fontWeight: 600 }}>{item.type}</span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: '#343a40', lineHeight: 1.5 }}>
                    {item.title}
                    {item.size && <span style={{ fontSize: '11px', color: '#6c757d', marginLeft: 8 }}>({item.size})</span>}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Scam Notice */}
            <div style={{ marginTop: 20, padding: '16px 18px', background: '#f8d7da', borderRadius: '8px', border: '1px solid #f5c6cb' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#721c24', fontWeight: 700, fontSize: '13px' }}>
                <FiAlertCircle size={16} /> Fraud Alert
              </div>
              <p style={{ fontSize: '12px', color: '#721c24', lineHeight: 1.7, margin: 0 }}>
                Government does <strong>NOT charge any fee</strong> from the public for filing grievances. All money being paid by individuals for filing grievances goes only to unauthorized third parties. <strong>Report such scams immediately</strong>.
              </p>
            </div>

            {/* DPG Notice */}
            <div style={{ marginTop: 12, padding: '14px 18px', background: '#d1ecf1', borderRadius: '8px', border: '1px solid #bee5eb' }}>
              <p style={{ fontSize: '12px', color: '#0c5460', lineHeight: 1.7, margin: 0 }}>
                If you have not got satisfactory redress of your grievance within a reasonable period, you may seek help of <strong>Directorate of Public Grievances (DPG), Cabinet Secretariat, GOI</strong>.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ padding: '70px 0', background: '#f8f9fa' }}>
        <div className="container-lg" style={{ maxWidth: 800, margin: '0 auto' }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={containerV}>
            <motion.div variants={itemV} style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h2 style={{ fontSize: '34px', fontWeight: 800, color: '#000080', fontFamily: 'Poppins' }}>
                <FiHelpCircle style={{ marginRight: 8 }} /> Frequently Asked Questions
              </h2>
            </motion.div>
            {faqs.map((faq, idx) => (
              <motion.div key={idx} variants={itemV}>
                <Accordion question={faq.q} answer={faq.a} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'linear-gradient(135deg, #FF9933, #E8860D)', padding: '56px 0' }}>
        <div className="container-lg" style={{ textAlign: 'center' }}>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={containerV}>
            <motion.h2 variants={itemV} style={{ fontSize: '36px', fontWeight: 900, color: '#fff', marginBottom: 14, fontFamily: 'Poppins' }}>
              Your Voice Matters. Make It Heard.
            </motion.h2>
            <motion.p variants={itemV} style={{ fontSize: '16px', color: 'rgba(255,255,255,0.9)', marginBottom: 28, maxWidth: 600, margin: '0 auto 28px' }}>
              Join millions of citizens. File your grievance today — it's secure, transparent, and completely free.
            </motion.p>
            <motion.div variants={itemV} style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/register"><motion.button whileHover={{ scale: 1.03 }} className="btn btn-lg" style={{ background: '#fff', color: '#000080', fontWeight: 800, boxShadow: '0 8px 25px rgba(0,0,0,0.15)' }}>Register Now — Free</motion.button></Link>
              <Link to="/login"><motion.button whileHover={{ scale: 1.03 }} className="btn btn-lg" style={{ background: 'transparent', color: '#fff', border: '2px solid #fff', fontWeight: 700 }}><FiSearch size={18} /> Track Grievance</motion.button></Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" style={{ padding: '56px 0', background: '#fff' }}>
        <div className="container-lg">
          <h2 style={{ textAlign: 'center', fontSize: '28px', fontWeight: 800, color: '#000080', marginBottom: 36, fontFamily: 'Poppins' }}>Contact Us</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '28px', textAlign: 'center' }}>
            {[
              { icon: <FiPhone size={26} />, title: 'Toll-Free Helpline', info: '1800-11-0031', sub: 'Mon-Sat, 9:00 AM - 6:00 PM' },
              { icon: <FiMail size={26} />, title: 'Email Support', info: 'grievance@jansamadhan.gov.in', sub: 'Response within 24 hours' },
              { icon: <FiMapPin size={26} />, title: 'Office Address', info: 'Sardar Patel Bhawan, Sansad Marg', sub: 'New Delhi - 110001, India' },
              { icon: <FiGlobe size={26} />, title: 'Portal Status', info: '24/7 Online Access', sub: 'Chrome, Firefox, Edge, Safari' },
            ].map((c, i) => (
              <div key={i} style={{ padding: '20px' }}>
                <div style={{ width: 52, height: 52, borderRadius: '12px', background: '#00008010', color: '#000080', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>{c.icon}</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A2E', marginBottom: 3 }}>{c.title}</div>
                <div style={{ fontSize: '13px', color: '#000080', fontWeight: 600, marginBottom: 3 }}>{c.info}</div>
                <div style={{ fontSize: '11px', color: '#6c757d' }}>{c.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#000080', color: 'rgba(255,255,255,0.85)', padding: '44px 0 0' }}>
        <div className="container-lg">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '28px', paddingBottom: '36px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <img src="/favicon.png" alt="JanSamadhan Logo" style={{ height: 48, width: 48, objectFit: 'contain', borderRadius: '10px' }} />
                <div>
                  <div style={{ fontWeight: 800, fontSize: '18px', color: '#fff', fontFamily: 'Poppins' }}>JanSamadhan</div>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>Government of India</div>
                </div>
              </div>
              <p style={{ fontSize: '12px', lineHeight: 1.7, color: 'rgba(255,255,255,0.5)' }}>
                A proposed Centralised Public Grievance Redress & Monitoring System under the Ministry of Personnel, Public Grievances & Pensions.
              </p>
            </div>
            <div>
              <h4 style={{ color: '#FF9933', fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>Quick Links</h4>
              {['Lodge Grievance', 'Track Status', 'Redress Process', 'Nodal PG Officers', 'File Appeal', 'Rate Grievance'].map((l, i) => (
                <div key={i} style={{ marginBottom: '8px' }}>
                  <Link to="/login" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }} onMouseOver={e => e.target.style.color = '#FF9933'} onMouseOut={e => e.target.style.color = 'rgba(255,255,255,0.6)'}>{l}</Link>
                </div>
              ))}
            </div>
            <div>
              <h4 style={{ color: '#FF9933', fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>Policies</h4>
              {['Privacy Policy', 'Terms of Use', 'Disclaimer', 'Website Policies', 'Accessibility', 'Hyperlinking Policy'].map((l, i) => (
                <div key={i} style={{ marginBottom: '8px' }}><span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer' }}>{l}</span></div>
              ))}
            </div>
            <div>
              <h4 style={{ color: '#FF9933', fontSize: '14px', fontWeight: 700, marginBottom: '14px' }}>Related Portals</h4>
              {['india.gov.in', 'pgportal.gov.in (CPGRAMS)', 'Digital India', 'MyGov.in', 'data.gov.in', 'UMANG App'].map((l, i) => (
                <div key={i} style={{ marginBottom: '8px' }}><span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{l}</span></div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '16px 0' }}>
          <div className="container-lg" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>© {new Date().getFullYear()} JanSamadhan(proposed app) — Government of India | Version 1.0</div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Best viewed in 1440×900</div>
          </div>
        </div>
        <div className="tricolor-bar" />
      </footer>
    </div>
  );
}
