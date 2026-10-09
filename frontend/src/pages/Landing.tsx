import React, { useState } from 'react';
import { Link } from 'react-router-dom';

export const Landing: React.FC = () => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="min-h-screen bg-surface text-text-primary flex flex-col font-sans">
      {/* Navigation Bar */}
      <header className="h-14 bg-white border-b border-border sticky top-0 z-50 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-[16px] font-semibold tracking-tight text-text-primary hover:opacity-90">
            NIRNAY
          </Link>
          <span className="text-[12px] text-text-muted">Delhi PWD</span>
          <div className="h-4 w-px bg-border hidden sm:block" />
          <span className="hidden sm:inline-block text-[11px] font-medium text-text-secondary bg-surface px-2 py-0.5 rounded-sm border border-border">
            Pre-Storm Decision Support
          </span>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="#problem"
            className="hidden md:inline-block text-[13px] text-text-secondary hover:text-text-primary transition-colors"
          >
            Problem
          </a>
          <a
            href="#how-it-works"
            className="hidden md:inline-block text-[13px] text-text-secondary hover:text-text-primary transition-colors"
          >
            How it works
          </a>
          <a
            href="#scope"
            className="hidden md:inline-block text-[13px] text-text-secondary hover:text-text-primary transition-colors"
          >
            Scope & Limits
          </a>
          <a
            href="#architecture"
            className="hidden md:inline-block text-[13px] text-text-secondary hover:text-text-primary transition-colors"
          >
            Architecture
          </a>
          <Link
            to="/app"
            className="h-8 px-3.5 bg-primary hover:bg-primary-hover text-white text-[12px] font-medium rounded-sm inline-flex items-center justify-center transition-colors"
          >
            Open simulator
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-12 space-y-24">
        {/* 1. HERO SECTION */}
        <section className="space-y-6 pt-4">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-sm bg-white border border-border text-[11px] font-mono text-text-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            PWD / DRAINAGE / PRE-STORM WHAT-IF SIMULATOR
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-text-primary max-w-3xl leading-[1.15]">
            Test pump and crew decisions before the rain
          </h1>

          <p className="text-[15px] sm:text-[16px] text-text-secondary max-w-2xl leading-relaxed">
            A pre-storm what-if simulator allowing Delhi PWD control-room engineers to stress-test mobile pump and field crew allocations across vulnerable underpasses before rainfall begins.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/app"
              className="h-9 px-5 bg-primary hover:bg-primary-hover text-white text-[13px] font-medium rounded-sm inline-flex items-center justify-center transition-colors"
            >
              Open simulator
            </Link>
            <Link
              to="/app?preset=july2026"
              className="h-9 px-4 bg-white border border-border hover:bg-surface text-text-primary text-[13px] font-medium rounded-sm inline-flex items-center justify-center transition-colors"
            >
              Try the July 2026 replay
            </Link>
          </div>

          {/* Screenshot container with neutral gray fallback box */}
          <div className="mt-8 rounded-sm border border-border bg-white overflow-hidden shadow-sm">
            {/* Mock browser header */}
            <div className="h-8 px-3 bg-surface border-b border-border flex items-center justify-between text-[11px] font-mono text-text-muted">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#E5E7EB]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#E5E7EB]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#E5E7EB]" />
                <span className="ml-2 text-text-secondary">nirnay.pwd.delhi.gov.in/app</span>
              </div>
              <span className="hidden sm:inline">CONTROL ROOM INTERFACE</span>
            </div>

            {/* Image or neutral gray placeholder */}
            <div className="relative w-full aspect-[16/9] max-h-[640px] bg-[#F3F4F6] flex items-center justify-center overflow-hidden">
              {!imgError ? (
                <img
                  src="/app-screenshot.png"
                  alt="NIRNAY simulator interface view"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-12 h-12 rounded-sm border border-dashed border-border-dark flex items-center justify-center text-text-muted mb-2 font-mono text-xs">
                    IMG
                  </div>
                  <p className="text-[13px] font-medium text-text-secondary">
                    Application Interface View
                  </p>
                  <p className="text-[11px] font-mono text-text-muted mt-1">
                    Placeholder: add /public/app-screenshot.png
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 2. PROBLEM SECTION */}
        <section id="problem" className="space-y-6 scroll-mt-20">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-text-muted mb-1">
              OPERATIONAL CONTEXT
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-text-primary">
              The operational challenge
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-sm border border-border bg-white space-y-2">
              <div className="text-[11px] font-mono text-text-muted uppercase">
                Challenge 01
              </div>
              <h3 className="text-[14px] font-semibold text-text-primary">
                Scarce mobile resources
              </h3>
              <p className="text-[13px] text-text-secondary leading-relaxed">
                A limited pool of high-capacity mobile pumps and response crews must be distributed across recurring underpass vulnerability nodes across the city.
              </p>
            </div>

            <div className="p-5 rounded-sm border border-border bg-white space-y-2">
              <div className="text-[11px] font-mono text-text-muted uppercase">
                Challenge 02
              </div>
              <h3 className="text-[14px] font-semibold text-text-primary">
                Lead time vs transit time
              </h3>
              <p className="text-[13px] text-text-secondary leading-relaxed">
                Underpasses accumulate water rapidly once local gravity drainage capacity is overwhelmed, while mobilizing heavy dewatering equipment through pre-storm congestion takes substantial time.
              </p>
            </div>

            <div className="p-5 rounded-sm border border-border bg-white space-y-2">
              <div className="text-[11px] font-mono text-text-muted uppercase">
                Challenge 03
              </div>
              <h3 className="text-[14px] font-semibold text-text-primary">
                Risk of uniform dispatch
              </h3>
              <p className="text-[13px] text-text-secondary leading-relaxed">
                Spreading equipment evenly across all locations dilutes response capacity, leaving critical arterial and designated hospital access corridors under-protected.
              </p>
            </div>
          </div>
        </section>

        {/* 3. HOW IT WORKS SECTION */}
        <section id="how-it-works" className="space-y-6 scroll-mt-20">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-text-muted mb-1">
              WORKFLOW
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-text-primary">
              How it works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-sm border border-border bg-white space-y-2">
              <div className="text-[11px] font-mono text-primary font-medium">
                STEP 01
              </div>
              <h3 className="text-[14px] font-semibold text-text-primary">
                Set a rainfall scenario
              </h3>
              <p className="text-[13px] text-text-secondary leading-relaxed">
                Specify total rainfall and storm duration, or select an IMD precipitation class or calibrated historical replay.
              </p>
            </div>

            <div className="p-5 rounded-sm border border-border bg-white space-y-2">
              <div className="text-[11px] font-mono text-primary font-medium">
                STEP 02
              </div>
              <h3 className="text-[14px] font-semibold text-text-primary">
                Test interventions
              </h3>
              <p className="text-[13px] text-text-secondary leading-relaxed">
                Model the hydrological effect of deploying temporary mobile pumps, clearing inlet grates, and executing upstream traffic pre-diversion.
              </p>
            </div>

            <div className="p-5 rounded-sm border border-border bg-white space-y-2">
              <div className="text-[11px] font-mono text-primary font-medium">
                STEP 03
              </div>
              <h3 className="text-[14px] font-semibold text-text-primary">
                Get a recommended allocation with a range
              </h3>
              <p className="text-[13px] text-text-secondary leading-relaxed">
                Run optimization across all hotspots to receive an allocation that minimizes total closure-hours, accompanied by uncertainty ranges.
              </p>
            </div>
          </div>
        </section>

        {/* 4. CLAIMS TABLE */}
        <section id="scope" className="space-y-6 scroll-mt-20">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-text-muted mb-1">
              BOUNDARIES & SCOPE
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-text-primary">
              What NIRNAY claims vs. what it does not claim
            </h2>
          </div>

          <div className="border border-border rounded-sm bg-white overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
              {/* Claims Column */}
              <div>
                <div className="p-4 bg-surface border-b border-border">
                  <h3 className="text-[13px] font-semibold text-text-primary">
                    What NIRNAY claims
                  </h3>
                </div>
                <div className="p-4 space-y-3.5 text-[13px] text-text-secondary">
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-[11px] text-primary shrink-0 mt-0.5">01</span>
                    <p>Scenario simulation and decision support</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-[11px] text-primary shrink-0 mt-0.5">02</span>
                    <p>Relative impact index with uncertainty ranges</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-[11px] text-primary shrink-0 mt-0.5">03</span>
                    <p>Textbook hydrology (rational method, storage balance)</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-[11px] text-primary shrink-0 mt-0.5">04</span>
                    <p>Validated against known hotspots and historical events</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-[11px] text-primary shrink-0 mt-0.5">05</span>
                    <p>Optimal allocation under stated assumptions</p>
                  </div>
                </div>
              </div>

              {/* Does Not Claim Column */}
              <div>
                <div className="p-4 bg-surface border-b border-border">
                  <h3 className="text-[13px] font-semibold text-text-primary">
                    What it does not claim
                  </h3>
                </div>
                <div className="p-4 space-y-3.5 text-[13px] text-text-secondary">
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-[11px] text-text-muted shrink-0 mt-0.5">—</span>
                    <p>Flood forecasting</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-[11px] text-text-muted shrink-0 mt-0.5">—</span>
                    <p>Exact counts of people or vehicles</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-[11px] text-text-muted shrink-0 mt-0.5">—</span>
                    <p>A calibrated hydrodynamic model</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-[11px] text-text-muted shrink-0 mt-0.5">—</span>
                    <p>Street-level depth from the DEM</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-[11px] text-text-muted shrink-0 mt-0.5">—</span>
                    <p>Hotspot interaction (hotspots assumed independent)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. ARCHITECTURE SECTION */}
        <section id="architecture" className="space-y-6 scroll-mt-20">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-text-muted mb-1">
              SYSTEM SCHEMATIC
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-text-primary">
              Architecture
            </h2>
          </div>

          <div className="border border-border rounded-sm bg-white p-6 overflow-x-auto">
            {/* SVG Boxes-and-arrows diagram */}
            <svg
              viewBox="0 0 880 340"
              className="w-full min-w-[760px] h-auto select-none"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              <defs>
                <marker
                  id="arrow"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#64748B" />
                </marker>
              </defs>

              {/* Top Infrastructure Label */}
              <rect x="20" y="15" width="840" height="305" rx="4" fill="#F8F9FA" stroke="#E5E7EB" strokeWidth="1" />
              <text x="40" y="38" fontSize="11" fontWeight="600" fill="#475467" letterSpacing="0.5">
                AWS ARCHITECTURE & CLIENT ENGINE FLOW
              </text>

              {/* 1. Browser Box */}
              <rect x="40" y="70" width="190" height="90" rx="3" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.2" />
              <text x="55" y="96" fontSize="12" fontWeight="600" fill="#0F172A">Browser</text>
              <text x="55" y="114" fontSize="11" fill="#475467">TypeScript simulator</text>
              <text x="55" y="138" fontSize="10" fontFamily="JetBrains Mono, monospace" fill="#1D4ED8">MapLibre GL + Zustand</text>

              {/* Amplify Hosting Container Badge */}
              <rect x="40" y="170" width="190" height="40" rx="3" fill="#EFF6FF" stroke="#BFDBFE" strokeWidth="1" />
              <text x="55" y="195" fontSize="11" fontWeight="500" fill="#1D4ED8">AWS Amplify Hosting</text>

              {/* Arrow from Browser to API Gateway */}
              <line x1="230" y1="115" x2="290" y2="115" stroke="#64748B" strokeWidth="1.5" markerEnd="url(#arrow)" />

              {/* 2. API Gateway Box */}
              <rect x="295" y="70" width="150" height="90" rx="3" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.2" />
              <text x="310" y="96" fontSize="12" fontWeight="600" fill="#0F172A">API Gateway</text>
              <text x="310" y="114" fontSize="11" fill="#475467">REST Endpoints</text>
              <text x="310" y="138" fontSize="10" fontFamily="JetBrains Mono, monospace" fill="#64748B">/api/recommend</text>

              {/* Arrow from API Gateway to Lambda */}
              <line x1="445" y1="115" x2="505" y2="115" stroke="#64748B" strokeWidth="1.5" markerEnd="url(#arrow)" />

              {/* 3. Lambda Box */}
              <rect x="510" y="70" width="165" height="90" rx="3" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.2" />
              <text x="525" y="96" fontSize="12" fontWeight="600" fill="#0F172A">AWS Lambda</text>
              <text x="525" y="114" fontSize="11" fill="#475467">Optimizer & Solver</text>
              <text x="525" y="138" fontSize="10" fontFamily="JetBrains Mono, monospace" fill="#1D4ED8">Monte Carlo Engine</text>

              {/* Arrow from Lambda to DynamoDB (Right) */}
              <line x1="675" y1="115" x2="720" y2="115" stroke="#64748B" strokeWidth="1.5" markerEnd="url(#arrow)" />

              {/* 4. DynamoDB Box */}
              <rect x="725" y="70" width="120" height="90" rx="3" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.2" />
              <text x="737" y="96" fontSize="12" fontWeight="600" fill="#0F172A">DynamoDB</text>
              <text x="737" y="114" fontSize="11" fill="#475467">Scenario DB</text>
              <text x="737" y="138" fontSize="10" fontFamily="JetBrains Mono, monospace" fill="#64748B">Precomputed</text>

              {/* Branch Down Arrow from Lambda to Bedrock */}
              <path d="M 592 160 L 592 225 L 640 225" fill="none" stroke="#64748B" strokeWidth="1.5" markerEnd="url(#arrow)" />

              {/* 5. Bedrock + Strands Box */}
              <rect x="645" y="200" width="200" height="70" rx="3" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.2" />
              <text x="660" y="226" fontSize="12" fontWeight="600" fill="#0F172A">Bedrock + Strands Agent</text>
              <text x="660" y="246" fontSize="11" fill="#475467">Tactical Rationale & Chat</text>

              {/* 6. S3 Data Source */}
              <rect x="295" y="200" width="150" height="70" rx="3" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.2" />
              <text x="310" y="226" fontSize="12" fontWeight="600" fill="#0F172A">Amazon S3</text>
              <text x="310" y="246" fontSize="11" fill="#475467">Data (Hotspots & DEM)</text>

              {/* Arrow from S3 to Browser & Lambda */}
              <path d="M 295 235 L 240 235 L 240 145" fill="none" stroke="#64748B" strokeWidth="1" strokeDasharray="3 3" markerEnd="url(#arrow)" />
              <path d="M 445 235 L 530 235 L 530 165" fill="none" stroke="#64748B" strokeWidth="1" strokeDasharray="3 3" markerEnd="url(#arrow)" />
            </svg>
          </div>
        </section>

        {/* Validation section: To be added */}

        {/* 6. CALLOUT STRIP */}
        <section className="border border-border rounded-sm bg-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-[14px] font-semibold text-text-primary">
              Ready to test pre-storm scenarios?
            </h3>
            <p className="text-[13px] text-text-secondary">
              Launch the decision simulator to adjust rainfall depth, run interventions, and evaluate pump allocations.
            </p>
          </div>
          <Link
            to="/app"
            className="h-9 px-4 bg-primary hover:bg-primary-hover text-white text-[13px] font-medium rounded-sm inline-flex items-center justify-center shrink-0 transition-colors"
          >
            Open simulator
          </Link>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-border mt-16 py-6 px-4 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-text-muted">
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/TanmayJ17/NIRNAY"
              target="_blank"
              rel="noreferrer"
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              GitHub
            </a>
            <span className="text-border">|</span>
            <a
              href="#"
              className="text-text-secondary hover:text-text-primary transition-colors"
            >
              Blog
            </a>
          </div>

          <div className="text-center sm:text-right font-medium text-text-secondary">
            Decision support, not flood forecasting.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
