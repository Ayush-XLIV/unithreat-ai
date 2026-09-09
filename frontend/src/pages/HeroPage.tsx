import { useState, useEffect, type FC } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Shield,
  ArrowRight,
  Activity,
  Cpu,
  Brain,
  ChevronDown,
  CheckCircle2,
  LockKeyhole,
  Workflow,
  Radio,
  FileText,
  Lock,
  Globe,
  Network,
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

/** SIH 6 Core Threat Categories */
const SIH_THREAT_CLASSES = [
  {
    code: '01',
    title: 'Volumetric / Protocol DDoS',
    tag: 'Flow Rate Anomaly',
    description:
      'SYN floods, UDP reflection/amplification, and spoofed-source flood behavior detected via passive flow rates and packet inter-arrival times.',
    indicators: ['Packet rate spikes', 'Asymmetric byte ratios', 'Source IP fan-in'],
  },
  {
    code: '02',
    title: 'Botnet C2 Beaconing',
    tag: 'Periodicity Analysis',
    description:
      'Periodic C2 communication and persistent heartbeats identified through flow timing regularity and fixed inter-arrival intervals.',
    indicators: ['Fixed interval timing', 'Low-entropy flow duration', 'Persistent connection pairs'],
  },
  {
    code: '03',
    title: 'DGA / DNS Tunnelling',
    tag: 'Entropy Profiling',
    description:
      'High-entropy domain queries, long subdomain sequences, and covert data exfiltration over DNS protocol sessions.',
    indicators: ['High character entropy', 'Subdomain length anomalies', 'Query frequency spikes'],
  },
  {
    code: '04',
    title: 'Encrypted Session Malware',
    tag: 'TLS SNI & Fingerprints',
    description:
      'Malicious behavior inside TLS/QUIC sessions identified via handshake metadata, JA3/JA4 fingerprints, and packet size distributions without payload decryption.',
    indicators: ['JA3/JA4 signature match', 'Anomalous TLS SNI', 'Packet size progression'],
  },
  {
    code: '05',
    title: 'Reconnaissance / Port Scanning',
    tag: 'Host Fan-Out',
    description:
      'Network sweeps, sequential port scans, host discovery, and targeted service probing observed across unidirectional ingress flows.',
    indicators: ['Port fan-out ratio', 'Failed connection patterns', 'Sequential IP targeting'],
  },
  {
    code: '06',
    title: 'Data Exfiltration',
    tag: 'Asymmetric Transfer',
    description:
      'Unauthorized outbound data transfer and covert channels detected through asymmetric byte ratios and anomalous transfer volume.',
    indicators: ['Asymmetric flow volume', 'Long-lived session transfer', 'Unusual egress ratio'],
  },
];

/** Security Principles */
const SECURITY_PRINCIPLES = [
  {
    title: 'PASSIVE BY DESIGN',
    desc: 'Zero active packet transmission, zero return-path injection, and zero active network probing.',
    icon: <Radio className="h-5 w-5 text-cyan-400" />,
  },
  {
    title: 'READ-ONLY INGEST',
    desc: 'Physically & logically isolated ingest enclave. Impossible to compromise monitored networks.',
    icon: <LockKeyhole className="h-5 w-5 text-emerald-400" />,
  },
  {
    title: 'METADATA-ONLY ANALYSIS',
    desc: 'Operates entirely on IP/TCP/UDP headers, flow metrics, and TLS SNI metadata without payload decryption.',
    icon: <FileText className="h-5 w-5 text-slate-300" />,
  },
  {
    title: 'STREAMING INCREMENTAL ML',
    desc: 'Near-real-time statistical profiling and calibrated Random Forest model inference over live streams.',
    icon: <Brain className="h-5 w-5 text-cyan-300" />,
  },
  {
    title: 'EVIDENCE-DRIVEN TRIAGE',
    desc: 'Every threat alert is backed by quantitative feature evidence, flow context, and severity scoring.',
    icon: <Workflow className="h-5 w-5 text-amber-400" />,
  },
];

export const HeroPage: FC = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <div className="min-h-screen bg-[#030507] text-slate-100 font-sans selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-[#030507]/95 backdrop-blur-md border-b border-[#151d28]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & SIH Context */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-[#0a0f14] border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-xs shadow-black">
                <Shield className="h-4 w-4" />
              </div>
              <span className="font-mono font-bold text-slate-100 text-base tracking-wider">
                UNITHREAT <span className="text-cyan-400">AI</span>
              </span>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-2.5 py-0.5 text-[10px] font-mono font-medium text-cyan-300">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              SIH 2026 · PS 26145 · NTRO
            </span>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-mono text-slate-300">
            <a href="#architecture" className="hover:text-cyan-400 transition-colors">
              Architecture
            </a>
            <a href="#threats" className="hover:text-cyan-400 transition-colors">
              Threat Coverage
            </a>
            <a href="#pipeline" className="hover:text-cyan-400 transition-colors">
              Detection Pipeline
            </a>
            <a href="#principles" className="hover:text-cyan-400 transition-colors">
              Principles
            </a>
          </nav>

          {/* Header CTA Button */}
          <Link
            to="/overview"
            className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/50 bg-[#0d131a] px-3.5 py-1.5 text-xs font-mono font-semibold text-cyan-300 hover:bg-cyan-950/50 hover:border-cyan-400 hover:text-white transition-all shadow-xs shadow-black focus-ring"
          >
            <span>ENTER SOC CONSOLE</span>
            <ArrowRight className="h-3.5 w-3.5 text-cyan-400" />
          </Link>
        </div>
      </header>

      {/* Main Hero Section */}
      <main>
        <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-soc-grid border-b border-[#151d28]">
          {/* Subtle Background Graphite Ambient Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-cyan-500/5 blur-[140px] rounded-full pointer-events-none" />
          <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-teal-500/5 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
            >
              {/* Left Column: Hero Text & CTAs */}
              <div className="lg:col-span-6 space-y-6">
                {/* SIH Metadata Badge */}
                <motion.div variants={itemVariants} className="inline-flex items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-md border border-[#151d28] bg-[#0a0f14] px-3 py-1 text-[11px] font-mono text-slate-300">
                    <span className="h-2 w-2 rounded-full bg-cyan-400" />
                    <span>SIH 2026 PROBLEM STATEMENT 26145</span>
                    <span className="text-slate-600">|</span>
                    <span className="text-slate-400">NTRO CYBERSECURITY PROTOTYPE</span>
                  </span>
                </motion.div>

                {/* Primary Title */}
                <motion.h1
                  variants={itemVariants}
                  className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-100 font-mono leading-tight uppercase"
                >
                  AI-BASED DETECTION OF CYBER THREATS IN{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-200">
                    UNIDIRECTIONAL IP TRAFFIC
                  </span>
                </motion.h1>

                {/* Subtitle Description */}
                <motion.p
                  variants={itemVariants}
                  className="text-sm sm:text-base text-slate-300 font-sans leading-relaxed max-w-2xl"
                >
                  UniThreat AI passively observes one-directional IP traffic and extracts behavioral
                  metadata signals to identify cyber threats without requiring a return path, active
                  probing, or payload decryption.
                </motion.p>

                {/* Architecture Badges */}
                <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
                  <span className="inline-flex items-center gap-1.5 rounded border border-cyan-900/60 bg-cyan-950/30 px-2.5 py-1 text-cyan-300">
                    <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />
                    PASSIVE MONITORING
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded border border-emerald-900/60 bg-emerald-950/30 px-2.5 py-1 text-emerald-300">
                    <Lock className="h-3.5 w-3.5 text-emerald-400" />
                    ZERO RETURN PATH
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded border border-slate-800 bg-[#0a0f14] px-2.5 py-1 text-slate-300">
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                    METADATA-ONLY
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded border border-slate-800 bg-[#0a0f14] px-2.5 py-1 text-slate-300">
                    <LockKeyhole className="h-3.5 w-3.5 text-slate-400" />
                    READ-ONLY INGEST
                  </span>
                </motion.div>

                {/* Primary & Secondary Action Buttons */}
                <motion.div
                  variants={itemVariants}
                  className="flex flex-wrap items-center gap-4 pt-4"
                >
                  <Link
                    to="/overview"
                    className="inline-flex items-center gap-2.5 rounded-lg border border-cyan-400/80 bg-[#0d131a] hover:bg-cyan-950/60 hover:border-cyan-300 px-6 py-3 text-sm font-mono font-bold text-cyan-200 transition-all shadow-lg shadow-black focus-ring"
                  >
                    <span>ENTER SOC CONSOLE</span>
                    <ArrowRight className="h-4 w-4 text-cyan-400" />
                  </Link>

                  <a
                    href="#architecture"
                    className="inline-flex items-center gap-2 rounded-lg border border-[#151d28] bg-[#0a0f14] hover:bg-[#111820] px-5 py-3 text-sm font-mono text-slate-300 hover:text-slate-100 transition-colors focus-ring"
                  >
                    <span>VIEW ARCHITECTURE</span>
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </a>
                </motion.div>
              </div>

              {/* Right Column: 3D Conceptual Network Topology Visualization */}
              <motion.div variants={itemVariants} className="lg:col-span-6">
                <div className="relative w-full rounded-xl border border-[#1a2330] bg-[#070b10] p-6 shadow-2xl overflow-hidden group">
                  {/* Subtle Top Spec Header */}
                  <div className="flex items-center justify-between border-b border-[#151d28] pb-3 mb-5 font-mono text-xs">
                    <div className="flex items-center gap-2 text-slate-200 font-semibold">
                      <Network className="h-4 w-4 text-cyan-400" />
                      <span>3D UNIDIRECTIONAL TOPOLOGY MODEL</span>
                    </div>
                    <span className="text-[10px] text-cyan-300 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded font-mono font-bold">
                      CONCEPTUAL ARCHITECTURE
                    </span>
                  </div>

                  {/* 3D Perspective Topology Composition */}
                  <div className="relative min-h-[340px] w-full flex flex-col justify-between items-center py-2 space-y-4">
                    {/* Layer 1: Monitored Production Network Nodes */}
                    <div className="w-full rounded-lg border border-[#151d28] bg-[#0a0f14] p-3 text-xs font-mono flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="h-7 w-7 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                          <Globe className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <div className="text-slate-200 font-semibold">PRODUCTION IP NETWORK</div>
                          <div className="text-[10px] text-slate-500 font-sans">
                            High-bandwidth operational traffic source
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                        SOURCE
                      </span>
                    </div>

                    {/* Vector Connector Line 1 with 1-Way Particle Stream */}
                    <div className="relative h-10 w-full flex justify-center items-center">
                      <div className="h-full w-0.5 bg-gradient-to-b from-slate-700 via-cyan-500 to-emerald-500" />
                      {!prefersReducedMotion && (
                        <div className="absolute top-1/4 h-2 w-2 rounded-full bg-cyan-400 shadow-xs shadow-cyan-400 animate-bounce" />
                      )}
                      <div className="absolute left-[calc(50%+16px)] whitespace-nowrap text-[10px] font-mono text-cyan-400 flex items-center gap-1">
                        <span>ONE-WAY INGRESS</span>
                        <span>↓</span>
                      </div>
                    </div>

                    {/* Layer 2: Central Focal Point — Data Diode / Passive Tap Node */}
                    <div className="w-full rounded-lg border border-cyan-500/50 bg-[#0d1520] p-4 text-xs font-mono flex items-center justify-between shadow-md shadow-cyan-950/40 relative">
                      <div className="absolute -top-2 left-6 text-[9px] font-bold text-cyan-300 bg-cyan-950 border border-cyan-700/60 px-2 py-0.2 rounded uppercase tracking-wider">
                        PHYSICAL ISOLATION ENCLAVE
                      </div>
                      <div className="flex items-center gap-3 pt-1">
                        <div className="h-8 w-8 rounded bg-cyan-950/80 border border-cyan-400 flex items-center justify-center text-cyan-300">
                          <Lock className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-cyan-200 font-bold text-xs">
                            PASSIVE TAP / DATA DIODE
                          </div>
                          <div className="text-[10px] text-cyan-400/80 font-sans">
                            Hardware one-way physical isolation (Zero return path)
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
                        ONE WAY ONLY
                      </span>
                    </div>

                    {/* Vector Connector Line 2 with 1-Way Particle Stream */}
                    <div className="relative h-10 w-full flex justify-center items-center">
                      <div className="h-full w-0.5 bg-gradient-to-b from-emerald-500 via-teal-500 to-cyan-500" />
                      {!prefersReducedMotion && (
                        <div className="absolute top-2/4 h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400" />
                      )}
                      <div className="absolute right-[calc(50%+16px)] whitespace-nowrap text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                        <span>↓</span>
                        <span>READ-ONLY INGEST</span>
                      </div>
                    </div>

                    {/* Layer 3: Isolated Ingest & ML Detection Pipeline Node */}
                    <div className="w-full rounded-lg border border-slate-800 bg-[#0a0f14] p-3 text-xs font-mono flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-7 w-7 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400">
                          <Cpu className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <div className="text-slate-200 font-semibold">READ-ONLY INGEST & ML PIPELINE</div>
                          <div className="text-[10px] text-slate-400 font-sans">
                            Feature extraction → Statistical + ML Classifier
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-cyan-300 bg-cyan-950/40 border border-cyan-900 px-2 py-0.5 rounded">
                        INFERENCE
                      </span>
                    </div>

                    {/* Vector Connector Line 3 */}
                    <div className="h-6 w-0.5 bg-slate-800" />

                    {/* Layer 4: SOC Operational Console Node */}
                    <div className="w-full rounded-lg border border-[#151d28] bg-[#05080b] p-3 text-xs font-mono flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-7 w-7 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300">
                          <Activity className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <div className="text-slate-200 font-semibold">SOC OPERATIONAL CONSOLE</div>
                          <div className="text-[10px] text-slate-500 font-sans">
                            Analyst threat triage & evidence inspection
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                        OUTPUT
                      </span>
                    </div>
                  </div>

                  {/* Architecture Guarantee Note */}
                  <div className="mt-4 rounded-lg border border-[#151d28] bg-[#030507] p-3 text-[11px] font-mono text-slate-400 space-y-1">
                    <div className="text-slate-200 font-semibold flex items-center gap-1.5 text-[11px]">
                      <LockKeyhole className="h-3.5 w-3.5 text-cyan-400" />
                      ZERO RETURN PATH GUARANTEE:
                    </div>
                    <p className="font-sans text-slate-400 text-[11px]">
                      The system is physically and logically incapable of injecting packets, performing return-path handshakes, or transmitting signals back into the monitored network.
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Section 1: Unidirectional Architecture (`#architecture`) */}
        <section id="architecture" className="py-20 border-b border-[#151d28] bg-[#030507]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold">
                SYSTEM ARCHITECTURE
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold font-mono text-slate-100 uppercase">
                UNIDIRECTIONAL DATA DIODE ARCHITECTURE
              </h2>
              <p className="text-xs sm:text-sm font-sans text-slate-400">
                Strict physical & logical one-way isolation ensures zero risk to monitored operational networks.
              </p>
            </div>

            {/* Architecture Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
              <div className="rounded-xl border border-[#151d28] bg-[#0a0f14] p-6 space-y-3 shadow-sm hover:border-cyan-500/40 transition-all">
                <div className="h-10 w-10 rounded-lg bg-cyan-950/60 border border-cyan-800/40 flex items-center justify-center text-cyan-400">
                  <Radio className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold font-mono text-slate-100 uppercase">
                  Passive Observation
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Traffic is copied passively using an optical splitter or data diode mirror port. The detector never sits inline on the active communications path.
                </p>
              </div>

              <div className="rounded-xl border border-[#151d28] bg-[#0a0f14] p-6 space-y-3 shadow-sm hover:border-emerald-500/40 transition-all">
                <div className="h-10 w-10 rounded-lg bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
                  <Lock className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold font-mono text-slate-100 uppercase">
                  Zero Return Path
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  No return-path drivers, packet injection modules, or active probing mechanisms exist. The detector cannot send signals back to the target network.
                </p>
              </div>

              <div className="rounded-xl border border-[#151d28] bg-[#0a0f14] p-6 space-y-3 shadow-sm hover:border-slate-700/60 transition-all">
                <div className="h-10 w-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-300">
                  <FileText className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold font-mono text-slate-100 uppercase">
                  Metadata-Only Inspection
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Feature extraction relies entirely on IP/TCP/UDP packet headers, flow statistics, and TLS SNI metadata without payload decryption.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: SIH Threat Detection Coverage (`#threats`) */}
        <section id="threats" className="py-20 border-b border-[#151d28] bg-soc-grid">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold">
                PROBLEM STATEMENT 26145
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold font-mono text-slate-100 uppercase">
                SIH THREAT DETECTION COVERAGE
              </h2>
              <p className="text-xs sm:text-sm font-sans text-slate-400">
                Authoritative coverage across the six core cyber threat categories specified in the SIH problem statement.
              </p>
            </div>

            {/* 6 Threat Class Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
              {SIH_THREAT_CLASSES.map((item) => (
                <div
                  key={item.code}
                  className="rounded-xl border border-[#151d28] bg-[#0a0f14] p-6 space-y-4 shadow-sm hover:border-cyan-500/40 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded">
                        {item.code}
                      </span>
                      <span className="font-mono text-[11px] text-slate-400 bg-[#05080b] border border-[#151d28] px-2 py-0.5 rounded">
                        {item.tag}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>
                  </div>

                  <div className="pt-3 border-t border-[#151d28] space-y-1.5">
                    <div className="text-[10px] font-mono text-slate-500 uppercase">Key Indicators:</div>
                    <ul className="space-y-1">
                      {item.indicators.map((ind) => (
                        <li
                          key={ind}
                          className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5"
                        >
                          <span className="h-1 w-1 rounded-full bg-cyan-400" />
                          <span>{ind}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 3: Metadata-Only Encrypted Traffic Analysis */}
        <section className="py-20 border-b border-[#151d28] bg-[#030507]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 space-y-4">
                <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold">
                  CRYPTOGRAPHIC PRIVACY COMPLIANCE
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold font-mono text-slate-100 uppercase leading-tight">
                  ENCRYPTED TRAFFIC ANALYSIS WITHOUT DECRYPTION
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                  TLS and QUIC encrypted sessions are analyzed using observable metadata signatures—such as JA3/JA4 fingerprints, packet length sequences, and inter-arrival timing—without decrypting payload content or violating privacy boundaries.
                </p>
                <div className="pt-2">
                  <div className="rounded-lg border border-cyan-900/50 bg-[#0a121c] p-4 text-xs font-mono text-cyan-300 space-y-1">
                    <div className="font-semibold text-cyan-200 uppercase">
                      NO DECRYPTION REQUIRED
                    </div>
                    <p className="font-sans text-slate-300 text-xs leading-relaxed">
                      Detects malicious encrypted sessions using statistical behavior & handshake parameters while leaving session keys and payloads completely untouched.
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                <div className="rounded-lg border border-[#151d28] bg-[#0a0f14] p-4 space-y-2">
                  <div className="text-cyan-400 font-bold">01 · JA3/JA4 FINGERPRINTS</div>
                  <div className="text-slate-300 text-[11px] font-sans">
                    Client & server TLS cipher suite and extension negotiation signatures.
                  </div>
                </div>

                <div className="rounded-lg border border-[#151d28] bg-[#0a0f14] p-4 space-y-2">
                  <div className="text-emerald-400 font-bold">02 · INTER-ARRIVAL TIME (IAT)</div>
                  <div className="text-slate-300 text-[11px] font-sans">
                    Packet timing distributions revealing automated C2 beaconing.
                  </div>
                </div>

                <div className="rounded-lg border border-[#151d28] bg-[#0a0f14] p-4 space-y-2">
                  <div className="text-slate-300 font-bold">03 · PACKET LENGTH SEQUENCES</div>
                  <div className="text-slate-400 text-[11px] font-sans">
                    Payload size progression patterns characterising specific malware types.
                  </div>
                </div>

                <div className="rounded-lg border border-[#151d28] bg-[#0a0f14] p-4 space-y-2">
                  <div className="text-cyan-300 font-bold">04 · SNI & CERT METADATA</div>
                  <div className="text-slate-300 text-[11px] font-sans">
                    Server Name Indication domains and certificate validation state.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Detection Pipeline (`#pipeline`) */}
        <section id="pipeline" className="py-20 border-b border-[#151d28] bg-soc-grid">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold">
                END-TO-END WORKFLOW
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold font-mono text-slate-100 uppercase">
                DETECTION PIPELINE FLOW
              </h2>
              <p className="text-xs sm:text-sm font-sans text-slate-400">
                From passive optical TAP ingest to SOC analyst evidence triage.
              </p>
            </div>

            {/* Pipeline Horizontal Flow Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 font-mono text-xs">
              {[
                { step: '01', title: 'PASSIVE INGEST', desc: 'Optical TAP / Data Diode mirror stream' },
                { step: '02', title: 'FEATURE EXTRACTION', desc: 'Flow profiling & statistical metrics' },
                { step: '03', title: 'STATISTICAL ENGINE', desc: 'Baseline anomaly detection' },
                { step: '04', title: 'ML INFERENCE', desc: 'Calibrated Threat Classifier model' },
                { step: '05', title: 'EVIDENCE SIGNALS', desc: 'Quantitative feature breakdown' },
                { step: '06', title: 'SOC VISUALIZATION', desc: 'Analyst triage & monitoring' },
              ].map((s) => (
                <div
                  key={s.step}
                  className="rounded-lg border border-[#151d28] bg-[#0a0f14] p-4 space-y-2 text-center flex flex-col justify-between"
                >
                  <div className="space-y-1.5">
                    <span className="inline-block text-xs font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded">
                      STEP {s.step}
                    </span>
                    <div className="font-bold text-slate-100 uppercase text-[11px] tracking-wider">
                      {s.title}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 font-sans pt-1 border-t border-[#151d28]">
                    {s.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 5: Security Principles (`#principles`) */}
        <section id="principles" className="py-20 border-b border-[#151d28] bg-[#030507]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold">
                ARCHITECTURAL GUARANTEES
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold font-mono text-slate-100 uppercase">
                CORE SECURITY PRINCIPLES
              </h2>
              <p className="text-xs sm:text-sm font-sans text-slate-400">
                Engineered for sovereign defense, OT/ICS networks, and critical national infrastructure.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 font-sans text-xs">
              {SECURITY_PRINCIPLES.map((p) => (
                <div
                  key={p.title}
                  className="rounded-xl border border-[#151d28] bg-[#0a0f14] p-5 space-y-3 shadow-sm hover:border-cyan-500/40 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="h-9 w-9 rounded-lg bg-[#05080b] border border-[#151d28] flex items-center justify-center">
                      {p.icon}
                    </div>
                    <h3 className="font-bold font-mono text-slate-100 uppercase text-xs">
                      {p.title}
                    </h3>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="py-20 bg-soc-grid">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-950/40 px-3 py-1 text-xs font-mono text-cyan-300">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              OPERATIONAL CONSOLE READY
            </div>

            <h2 className="text-3xl sm:text-4xl font-bold font-mono text-slate-100 uppercase tracking-tight">
              READY TO EXPLORE THE SOC CONSOLE?
            </h2>

            <p className="text-sm text-slate-300 font-sans max-w-xl mx-auto leading-relaxed">
              Access passive threat intelligence, flow metrics, ML predictions, and alert triage inside the UniThreat AI SOC Command Center.
            </p>

            <div className="pt-2">
              <Link
                to="/overview"
                className="inline-flex items-center gap-3 rounded-lg border border-cyan-400/80 bg-[#0d131a] hover:bg-cyan-950/60 hover:border-cyan-300 px-8 py-3.5 text-base font-mono font-bold text-cyan-200 transition-all shadow-xl shadow-black focus-ring"
              >
                <span>ENTER SOC CONSOLE</span>
                <ArrowRight className="h-5 w-5 text-cyan-400" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#151d28] bg-[#030507] py-8 text-xs font-mono text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center md:text-left">
            <div className="font-bold text-slate-200">
              UNITHREAT <span className="text-cyan-400">AI</span>
            </div>
            <div className="text-[11px] text-slate-400 font-sans">
              AI-Based Detection of Cyber Threats in Unidirectional IP Traffic
            </div>
          </div>

          <div className="text-center text-[11px] text-slate-400 space-y-1">
            <div>SIH 2026 · PROBLEM STATEMENT 26145</div>
            <div className="text-slate-300">NATIONAL TECHNICAL RESEARCH ORGANISATION (NTRO)</div>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-cyan-300">
            <span className="border border-cyan-900/60 bg-cyan-950/40 px-2 py-0.5 rounded">PASSIVE</span>
            <span className="border border-emerald-900/60 bg-emerald-950/40 px-2 py-0.5 rounded">READ-ONLY</span>
            <span className="border border-slate-800 bg-[#0a0f14] px-2 py-0.5 rounded">METADATA-ONLY</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
