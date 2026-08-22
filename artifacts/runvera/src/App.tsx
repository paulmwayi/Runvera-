import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider, Show, SignIn, SignUp, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Link, Redirect, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import {
  ArrowLeft, ArrowRight, BriefcaseBusiness, Check, ChevronRight, CircleDollarSign,
  FileText, Landmark, LayoutGrid, LineChart, Minus, Plus, Settings as SettingsIcon,
  SlidersHorizontal, Sparkles, Target, TrendingUp, Users, WalletCards, Zap,
} from 'lucide-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';

const queryClient = new QueryClient();
const notify = (message: string) => window.dispatchEvent(new CustomEvent('rv-toast', { detail: message }));
const clerkPubKey = publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function stripBase(path: string) {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#5550D9',
    colorForeground: '#151A2D',
    colorMutedForeground: '#657083',
    colorDanger: '#C7465B',
    colorBackground: '#FFFFFF',
    colorInput: '#F7F8FC',
    colorInputForeground: '#151A2D',
    colorNeutral: '#DDE2EF',
    fontFamily: 'Manrope, sans-serif',
    borderRadius: '1rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#151A2D] font-bold',
    headerSubtitle: 'text-[#657083]',
    socialButtonsBlockButtonText: 'text-[#151A2D]',
    formFieldLabel: 'text-[#151A2D] font-semibold',
    footerActionLink: 'text-[#5550D9] font-semibold',
    footerActionText: 'text-[#657083]',
    dividerText: 'text-[#657083]',
    identityPreviewEditButton: 'text-[#5550D9]',
    formFieldSuccessText: 'text-[#168A67]',
    alertText: 'text-[#C7465B]',
    logoBox: 'mb-3',
    logoImage: 'max-h-10',
    socialButtonsBlockButton: 'border-[#DDE2EF] bg-white',
    formButtonPrimary: 'bg-[#5550D9] hover:bg-[#4843C4] text-white',
    formFieldInput: 'bg-[#F7F8FC] border-[#DDE2EF] text-[#151A2D]',
    footerAction: 'bg-transparent',
    dividerLine: 'bg-[#DDE2EF]',
    alert: 'bg-[#FFF4F5] border-[#F2C9D0]',
    otpCodeFieldInput: 'border-[#DDE2EF] text-[#151A2D]',
    formFieldRow: 'mb-4',
    main: 'gap-5',
  },
};

function Logo() {
  return <Link href="/" className="rv-brand"><span className="rv-mark" /><span className="rv-brand-name">run<span>vera</span></span></Link>;
}

function Header({ title, back = false, children }: { title: string; back?: boolean; children?: ReactNode }) {
  const [, setLocation] = useLocation();
  return <header className="rv-topbar">
    <div>{back ? <button className="rv-back" onClick={() => setLocation('/')}><ArrowLeft size={16} /> Back</button> : <Logo />}</div>
    <div className="rv-top-title">{title}</div>
    <div className="rv-top-note">{children ?? <><span className="rv-dot" />Default Alive</>}</div>
  </header>;
}

const bottomItems = [
  { href: '/command', label: 'Command', icon: LayoutGrid },
  { href: '/forecasts', label: 'Forecasts', icon: LineChart },
  { href: '/funding', label: 'Funding', icon: CircleDollarSign },
  { href: '/agency', label: 'Agency', icon: Users },
];

function BottomNav() {
  const [location] = useLocation();
  const active = location.startsWith('/agency') ? '/agency' : location.startsWith('/funding') || location === '/dilution' ? '/funding' : location.startsWith('/forecasts') || location === '/cash-flow' ? '/forecasts' : '/command';
  return <nav className="rv-bottom">{bottomItems.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={active === href ? 'active' : ''}><Icon /><span>{label}</span></Link>)}</nav>;
}

function Shell({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState('');
  useEffect(() => {
    const listener = (event: Event) => setToast((event as CustomEvent<string>).detail);
    window.addEventListener('rv-toast', listener);
    return () => window.removeEventListener('rv-toast', listener);
  }, []);
  useEffect(() => { if (!toast) return; const timeout = window.setTimeout(() => setToast(''), 2400); return () => window.clearTimeout(timeout); }, [toast]);
  return <div className="rv-app"><div className="rv-shell"><main className="rv-main">{children}</main></div><BottomNav />{toast && <div className="rv-toast" role="status">{toast}</div>}</div>;
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rv-card rv-card-pad ${className}`}>{children}</section>;
}

function SectionTitle({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="rv-section-title"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{action}</div>;
}

function Chart({ detailed = false }: { detailed?: boolean }) {
  const points = detailed ? '0,145 30,133 60,125 90,117 120,110 150,101 180,93 210,84 240,75 270,67 300,58 330,46' : '0,127 15,118 30,125 45,115 60,121 75,111 90,116 105,102 120,109 135,95 150,100 165,89 180,94 195,80 210,85 225,69 240,76 255,59 270,67 285,47 300,56 315,34 330,48';
  const exp = detailed ? '0,112 40,110 80,108 120,102 160,98 200,94 240,87 280,83 330,77' : '0,122 45,120 90,119 135,115 180,110 225,107 270,103 330,98';
  return <svg className="rv-chart" viewBox="0 0 340 185" preserveAspectRatio="none" aria-label="Revenue and expense trajectory">
    <defs><linearGradient id="revFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="hsl(158 65% 48% / .22)" /><stop offset="1" stopColor="hsl(158 65% 48% / 0)" /></linearGradient></defs>
    {[35, 75, 115, 155].map((y) => <line key={y} x1="0" x2="340" y1={y} y2={y} stroke="hsl(220 18% 90%)" strokeDasharray="2 4" />)}
    <polyline points={`${points} 330,165 0,165`} fill="url(#revFill)" stroke="none" />
    <polyline points={points} fill="none" stroke="hsl(158 65% 48%)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points={exp} fill="none" stroke="hsl(351 65% 54%)" strokeWidth="2" strokeDasharray="4 4" />
    {['$40k', '$30k', '$20k', '$10k', '$0k'].map((label, i) => <text key={label} x="2" y={28 + i * 34} fontSize="9" fill="hsl(225 9% 45%)">{label}</text>)}
  </svg>;
}

function Metrics() {
  return <div className="rv-grid rv-grid-2">
    <div className="rv-card rv-metric"><TrendingUp className="rv-metric-icon" size={18} /><label>Monthly Revenue</label><strong>$18,500</strong><small>↗ +7.0% MoM</small></div>
    <div className="rv-card rv-metric"><WalletCards className="rv-metric-icon" size={18} /><label>Total Expenses</label><strong>$24,120</strong><small>3 Team Seats</small></div>
    <div className="rv-card rv-metric"><span className="rv-metric-icon">%</span><label>Gross Margin</label><strong>88%</strong><small>↗ $49 / customer ARPU</small></div>
    <div className="rv-card rv-metric"><Users className="rv-metric-icon" size={18} /><label>Active Customers</label><strong>378</strong><small className="negative">↘ 508 for break-even</small></div>
  </div>;
}

function Dashboard() {
  return <><Header title="Command Center" /><div className="rv-content">
    <div className="rv-card rv-runway"><div className="rv-eyebrow">Business runway</div><strong>24.0</strong><span className="unit">Months</span><button className="rv-button ghost" style={{ float: 'right' }} onClick={() => notify('Model levers are ready')}><SlidersHorizontal size={14} /> Tune</button><div className="rv-runway-meta"><div><span>Cash Reserve</span><b>$135,000</b></div><div><span>Net Monthly Flow</span><b style={{ color: 'hsl(var(--destructive))' }}>-$5,620/mo</b></div><div><span>Break-Even Goal</span><b>$24,886/mo</b></div></div></div>
    <div style={{ height: 14 }} />
    <Metrics />
    <div style={{ height: 14 }} />
    <Card className="rv-chart-card"><SectionTitle title="12-Month Trajectory" description="Deterministic forecast based on active growth rate" action={<div className="rv-legend"><span><i className="rv-dot" />Rev</span><span><i className="rv-dot red" />Exp</span></div>} /><Chart /></Card>
    <div style={{ height: 14 }} />
    <Card className="rv-alert-card"><div className="rv-eyebrow">Decisions & alerts</div><div className="rv-alert" style={{ paddingInline: 0 }}><span className="tag">Runway priority</span><h3>Net burn at $5,620/month</h3><p>You are currently burning cash. Adding 130 customers or adjusting non-core spend by $5,620/mo reaches immediate break-even.</p><button className="rv-link" onClick={() => notify('Opening cost and pricing scenarios')}>Explore Cost & Price Scenarios <ArrowRight size={14} /></button></div></Card>
    <div style={{ height: 14 }} />
    <Card className="rv-agency-card"><SectionTitle title="AI Specialist Agency" description="Live perspectives from your operating model" action={<span className="rv-pill">6 Active</span>} /><div className="rv-specialists"><Link href="/agency/finance" className="rv-card rv-specialist"><div className="rv-agent-icon"><WalletCards size={16} /></div><h3>Finance</h3><p>Runway, burn analysis & break-even forecasting</p></Link><Link href="/agency/strategy" className="rv-card rv-specialist"><div className="rv-agent-icon purple"><Target size={16} /></div><h3>Strategy</h3><p>Competitive positioning & resource allocation</p></Link><div className="rv-card rv-specialist"><div className="rv-agent-icon pink"><Sparkles size={16} /></div><h3>Marketing</h3><p>Acquisition payback & channel economics</p></div></div></Card>
  </div></>;
}

function Slider({ label, value, min, max, step, display, onChange }: { label: string; value: number; min: number; max: number; step: number; display: string; onChange: (value: number) => void }) {
  return <div className="rv-control-block"><div className="rv-control"><label>{label}</label><output>{display}</output></div><input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /></div>;
}

function Model() {
  const [revenue, setRevenue] = useState(18500);
  const [growth, setGrowth] = useState(7);
  const [expenses, setExpenses] = useState(7500);
  const [cash, setCash] = useState(135000);
  const [seats, setSeats] = useState(3);
  return <><Header title="Adjust Model" back /><div className="rv-content"><div className="rv-page-head"><div className="rv-eyebrow">Active assumptions</div><h1>Shape the model.</h1><p>Small changes here flow through every forecast and specialist brief.</p></div>
    <h2 style={{ fontSize: 17, margin: '20px 0 10px' }}>Revenue & Growth</h2><Card><Slider label="Monthly Revenue" value={revenue} min={5000} max={100000} step={500} display={`$${revenue.toLocaleString()}`} onChange={setRevenue} /><Slider label="Monthly Growth Rate" value={growth} min={0} max={20} step={.5} display={`${growth.toFixed(1)}%`} onChange={setGrowth} /></Card>
    <h2 style={{ fontSize: 17, margin: '20px 0 10px' }}>Costs & Headcount</h2><Card><Slider label="Fixed Monthly Expenses" value={expenses} min={2000} max={50000} step={500} display={`$${expenses.toLocaleString()}`} onChange={setExpenses} /><div className="rv-control"><label>Team Headcount: {seats}</label><div className="rv-stepper"><button onClick={() => setSeats(Math.max(1, seats - 1))}><Minus size={14} /></button><span>{seats}</span><button onClick={() => setSeats(seats + 1)}><Plus size={14} /></button></div></div></Card>
    <h2 style={{ fontSize: 17, margin: '20px 0 10px' }}>Cash Reserve</h2><Card><Slider label="Cash in Bank" value={cash} min={10000} max={500000} step={5000} display={`$${cash.toLocaleString()}`} onChange={setCash} /></Card>
    <button className="rv-button" style={{ width: '100%', marginTop: 20 }} onClick={() => notify('Model saved — forecasts updated')}><Check size={15} /> Done</button>
  </div></>;
}

function Forecasts() {
  const [months, setMonths] = useState('12 Months');
  const [metric, setMetric] = useState('Rev vs Exp');
  return <><Header title="Forecast Studio" /><div className="rv-content"><div className="rv-tabs" style={{ width: '100%', justifyContent: 'space-between' }}>{['6 Months', '12 Months', '24 Months'].map((item) => <button key={item} className={`rv-tab ${months === item ? 'active' : ''}`} onClick={() => setMonths(item)}>{item}</button>)}</div><div style={{ height: 10 }} /><div className="rv-segment">{['Rev vs Exp', 'Cash Reserve', 'Net Cash Flow', 'Customers'].map((item) => <button key={item} className={metric === item ? 'active' : ''} onClick={() => setMetric(item)}>{item}</button>)}</div><div style={{ height: 14 }} /><Card><SectionTitle title={metric} description={`Forecast based on current model parameters`} action={<div style={{ textAlign: 'right' }}><span style={{ fontSize: 10, color: 'hsl(var(--muted-foreground))' }}>Month 12 Goal</span><b style={{ display: 'block', color: 'hsl(var(--accent))' }}>$38,940/mo</b></div>} /><Chart detailed /></Card><div style={{ height: 14 }} /><Card><SectionTitle title="Break-Even & Runway Velocity" action={<span className="rv-pill amber">Closing Gap</span>} /><div className="rv-stat-grid"><div className="rv-stat"><span>Break-Even Target</span><b>$24,886/mo</b></div><div className="rv-stat"><span>Break-Even Users</span><b>508 Accounts</b></div><div className="rv-stat"><span>Revenue Gap</span><b style={{ color: 'hsl(var(--destructive))' }}>$6,386</b></div><div className="rv-stat"><span>Accounts Needed</span><b style={{ color: '#c38a15' }}>+130 Users</b></div></div></Card><div style={{ height: 14 }} /><Card><SectionTitle title="Model Levers & Assumptions" /><div className="rv-list"><Link href="/model" className="rv-list-row" style={{ textDecoration: 'none' }}><div><strong>Monthly Growth Rate</strong><small>Current active assumption</small></div><span className="rv-pill">7.0%</span><ChevronRight size={15} /></Link><Link href="/cash-flow" className="rv-list-row" style={{ textDecoration: 'none' }}><div><strong>Cash flow detail</strong><small>See monthly inflows and outflows</small></div><ChevronRight size={15} /></Link></div></Card></div></>;
}

function CashFlow() {
  const [period, setPeriod] = useState('Monthly');
  return <><Header title="Cash Flow" back /><div className="rv-content"><div className="rv-page-head"><div className="rv-eyebrow">Forecast detail</div><h1>Follow the cash.</h1><p>Know what your operating rhythm makes possible.</p></div><div className="rv-tabs">{['Monthly', 'Quarterly'].map((x) => <button className={`rv-tab ${period === x ? 'active' : ''}`} onClick={() => setPeriod(x)} key={x}>{x}</button>)}</div><div style={{ height: 14 }} /><Card><SectionTitle title={`${period} net cash flow`} description="Next six periods" /><div style={{ display: 'flex', alignItems: 'end', height: 165, gap: 9, borderBottom: '1px solid hsl(var(--border))' }}>{[35, 50, 42, 66, 78, 92].map((height, i) => <div key={i} style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'end', flexDirection: 'column', justifyContent: 'end', gap: 6 }}><div style={{ width: '100%', height: `${height}%`, background: i < 2 ? 'hsl(var(--destructive) / .55)' : 'hsl(var(--accent) / .8)', borderRadius: '6px 6px 2px 2px' }} /><span style={{ fontSize: 9, color: 'hsl(var(--muted-foreground))' }}>M{i + 1}</span></div>)}</div></Card><div style={{ height: 14 }} /><div className="rv-grid rv-grid-2"><div className="rv-card rv-stat"><span>Opening cash</span><b>$135.0k</b><small>Current balance</small></div><div className="rv-card rv-stat"><span>Closing cash</span><b>$101.3k</b><small>After six periods</small></div><div className="rv-card rv-stat"><span>Cash in</span><b style={{ color: 'hsl(var(--accent))' }}>+$142.8k</b><small>Revenue collected</small></div><div className="rv-card rv-stat"><span>Cash out</span><b style={{ color: 'hsl(var(--destructive))' }}>-$176.5k</b><small>Operating spend</small></div></div><div style={{ height: 14 }} /><Card><SectionTitle title="Transaction summary" description="What is moving the balance" /><div className="rv-list">{[['Customer receipts', '+$18,500', TrendingUp], ['Team & contractors', '-$14,400', Users], ['Tools & infrastructure', '-$5,620', Zap], ['Tax reserve', '-$1,240', Landmark]].map(([label, value, Icon]) => <div className="rv-list-row" key={String(label)}><div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><div className="rv-agent-icon green"><Icon size={15} /></div><strong>{String(label)}</strong></div><b style={{ color: String(value).startsWith('+') ? 'hsl(var(--accent))' : 'hsl(var(--destructive))' }}>{String(value)}</b></div>)}</div></Card></div></>;
}

function Funding() {
  const [raise, setRaise] = useState(250);
  const [scenario, setScenario] = useState('Pre-Seed SAFE');
  const valuation = 2200 + raise;
  const dilution = Math.round((raise / valuation) * 1000) / 10;
  return <><Header title="Funding Planner"><button className="rv-button ghost" onClick={() => notify('New scenario started')}><Plus size={14} /> Scenario</button></Header><div className="rv-content"><div className="rv-segment">{['Pre-Seed SAFE', 'Seed Lead', 'Bridge'].map((x) => <button className={scenario === x ? 'active' : ''} onClick={() => setScenario(x)} key={x}>{x}</button>)}</div><div style={{ height: 14 }} /><Card><SectionTitle title="Post-Round Cap Table" description="Ownership after this round" action={<span className="rv-pill">80.0% Founder</span>} /><div className="rv-capbar"><span /><span /><span /></div><div className="rv-cap-legend"><span><i />Founders: 80.0%</span><span><i className="green" />Investors: 10.0%</span><span><i className="amber" />Pool: 10%</span></div></Card><div style={{ height: 14 }} /><div className="rv-grid rv-grid-2"><div className="rv-card rv-stat"><span>Post-Money Valuation</span><b>${(valuation / 1000).toFixed(1)}M</b><small>↗ Pre: $2.2M</small></div><div className="rv-card rv-stat"><span>Target Capital Raise</span><b>${raise}k</b><small>Dilution: {dilution}%</small></div><div className="rv-card rv-stat"><span>Founder Retained</span><b>{(100 - dilution).toFixed(1)}%</b><small>↗ Value: $2.0M</small></div><div className="rv-card rv-stat"><span>New Runway Buffer</span><b>+10.4 Mo</b><small>↗ Burn basis: $24,120/mo</small></div></div><div style={{ height: 14 }} /><Card><SectionTitle title="Tune Round Terms" description={scenario} /><Slider label="Target Raise" value={raise} min={100} max={1500} step={50} display={`$${raise},000`} onChange={setRaise} /><Slider label="Pre-Money Valuation" value={2200} min={1000} max={10000} step={100} display={`$${(2200 / 1000).toFixed(1)}M`} onChange={() => undefined} /><Slider label="Option Pool (ESOP)" value={10} min={0} max={20} step={1} display="10%" onChange={() => undefined} /><button className="rv-button" style={{ width: '100%', marginTop: 12 }} onClick={() => notify(`${scenario} scenario saved`)}><Check size={14} /> Save Scenario</button></Card><div style={{ height: 14 }} /><Link href="/dilution" className="rv-card rv-list-row" style={{ padding: 16, textDecoration: 'none' }}><div><strong>Open dilution calculator</strong><small>Compare ownership at different valuations</small></div><ArrowRight size={16} color="hsl(var(--primary))" /></Link></div></>;
}

function Dilution() {
  const [raise, setRaise] = useState(500);
  const [pre, setPre] = useState(3500);
  const [pool, setPool] = useState(10);
  const post = raise + pre;
  const investor = Math.round(raise / post * 1000) / 10;
  return <><Header title="New Scenario" back /><div className="rv-content"><div className="rv-page-head"><div className="rv-eyebrow">Funding calculator</div><h1>Model the round.</h1><p>Understand the trade before it becomes a term sheet.</p></div><label className="rv-label" htmlFor="scenario">Scenario title</label><input id="scenario" className="rv-input" defaultValue="Series Seed Tier" /><h2 style={{ fontSize: 17, margin: '22px 0 10px' }}>Round Economics</h2><Card><Slider label="Target Raise" value={raise} min={100} max={2000} step={50} display={`$${raise},000`} onChange={setRaise} /><Slider label="Pre-Money Valuation" value={pre} min={1000} max={15000} step={100} display={`$${(pre / 1000).toFixed(1)}M`} onChange={setPre} /><Slider label="Option Pool (ESOP)" value={pool} min={0} max={25} step={1} display={`${pool}%`} onChange={setPool} /></Card><div style={{ height: 14 }} /><Card><SectionTitle title="Ownership outcome" description="Post-money cap table" /><div className="rv-stat-grid"><div className="rv-stat"><span>Investor ownership</span><b>{investor}%</b></div><div className="rv-stat"><span>Founder ownership</span><b>{(100 - investor - pool).toFixed(1)}%</b></div><div className="rv-stat"><span>Post-money</span><b>${(post / 1000).toFixed(1)}M</b></div><div className="rv-stat"><span>Option pool</span><b>{pool}%</b></div></div></Card><button className="rv-button" style={{ width: '100%', marginTop: 18 }} onClick={() => notify('Scenario saved to Funding Planner')}><Check size={14} /> Save</button></div></>;
}

const agentData = [
  { name: 'Finance', icon: WalletCards, tone: '', detail: 'Runway: 24.0 Months Remaining', result: '-$5620/mo net burn rate', href: '/agency/finance' },
  { name: 'Strategy', icon: Target, tone: 'purple', detail: 'Default Alive Path Optimization', result: 'Compounding at +7.0%/mo', href: '/agency/strategy' },
  { name: 'Marketing', icon: Sparkles, tone: 'pink', detail: 'Acquisition Payback & Channel Economics', result: 'Estimated payback period: 3.1 mo', href: '#' },
  { name: 'Sales', icon: TrendingUp, tone: 'green', detail: 'Deal Velocity & Average Contract Value', result: 'ACV target: $588 - $1,068', href: '#' },
  { name: 'Product', icon: BriefcaseBusiness, tone: 'green', detail: 'Feature Stickiness & Churn Defenses', result: 'Target monthly retention: 94%', href: '#' },
  { name: 'Operations', icon: SettingsIcon, tone: 'orange', detail: 'SaaS Infrastructure & Fixed Cost Leverage', result: 'Fixed overhead: $21900/mo', href: '#' },
];

function Agency() {
  const [tab, setTab] = useState('6 AI Agents');
 return <><Header title="AI Agency & Reports" /><div className="rv-content"><div className="rv-tabs" style={{ width: '100%', justifyContent: 'space-around' }}>{['6 AI Agents', 'Reports', 'Projects'].map((x) => <button className={`rv-tab ${tab === x ? 'active' : ''}`} key={x} onClick={() => setTab(x)}>{x}</button>)}</div><div style={{ height: 18 }} />{tab === '6 AI Agents' && <><div className="rv-page-head"><h1>Specialist Business Team</h1><p>Sample analysis generated from your model</p></div><div className="rv-grid rv-grid-2">{agentData.map(({ name, icon: Icon, tone, detail, result, href }) => <Link key={name} href={href} onClick={(event) => href === '#' && (event.preventDefault(), notify(`${name} agent is coming into focus`))} className="rv-card rv-specialist" style={{ textDecoration: 'none' }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><div className={`rv-agent-icon ${tone}`}><Icon size={16} /></div><ChevronRight size={17} color="hsl(var(--muted-foreground))" /></div><h3>{name}</h3><p>{detail}</p><p style={{ color: 'hsl(var(--primary))', marginTop: 10 }}>{result}</p></Link>)}</div><div style={{ marginTop: 14 }}><Card><div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Zap size={18} color="hsl(var(--primary))" /><strong>Agent Intelligence Pipeline</strong></div><p style={{ color: 'hsl(var(--muted-foreground))', fontSize: 12, lineHeight: 1.4 }}>All 6 agents read your live Financial Model parameters synchronously. Any change instantly regenerates strategic advice.</p></Card></div></>}{tab === 'Reports' && <Reports compact />}{tab === 'Projects' && <Projects compact />}</div></>;
}

function AgentDetail({ type }: { type: 'finance' | 'strategy' }) {
  const finance = type === 'finance';
  const title = finance ? 'Finance Brief' : 'Strategy Brief';
  const specialist = finance ? 'Finance Specialist' : 'Strategy Specialist';
  const assessment = finance ? 'SaaS Infrastructure & Fixed Cost Leverage' : 'Default Alive Path Optimization';
  const body = finance ? 'Headcount of 3 accounts for $14,400/mo (60% of total expenses). Operational leverage will increase as revenue scales past fixed baselines.' : 'At 7.0% monthly revenue compounding, the company doubles ARR in ~10 months. Break-even threshold requires $24,886 total monthly turnover.';
  const decisions = finance ? ['Audit recurring subscriptions and eliminate unused SaaS tool seats ($300+/mo savings)', 'Document standard operating procedures for contractor onboarding', 'Consolidate cloud hosting and utilize annual reserved capacity discounts'] : ['Focus 80% of leadership bandwidth on single primary distribution channel', 'Position against legacy enterprise tools by emphasizing rapid 5-minute setup', 'Lock in 12-month customer commitments via discounted annual billing'];
  return <><Header title={title} back><button className="rv-button secondary" onClick={() => notify('Brief closed')}>Close</button></Header><div className="rv-content"><div className="rv-detail-hero"><div className={`rv-agent-icon ${finance ? 'orange' : 'purple'}`}>{finance ? <SettingsIcon size={18} /> : <Target size={18} />}</div><div><h2>{specialist}</h2><p>Sample analysis generated from your model</p></div></div><Card><div className="rv-eyebrow">Current assessment</div><h2 style={{ fontSize: 24, letterSpacing: '-.06em', margin: '10px 0 7px' }}>{assessment}</h2><p style={{ color: 'hsl(var(--muted-foreground))', fontSize: 14, lineHeight: 1.4, margin: 0 }}>{body}</p></Card><div style={{ height: 14 }} /><Card><h2 style={{ fontSize: 17, margin: 0 }}>Recommended Decisions</h2><div className="rv-numbered" style={{ marginTop: 15 }}>{decisions.map((decision, i) => <div className="rv-numbered-row" key={decision}><span className="rv-number">{i + 1}</span><span>{decision}</span></div>)}</div></Card><div className="rv-risk"><h3><Zap size={15} style={{ verticalAlign: 'middle', marginRight: 6 }} />Risk Factor</h3><p>{finance ? 'Ensure single-point-of-failure risks in infrastructure and key code modules are mitigated.' : 'Channel concentration risk: Ensure acquisition is not reliant on a single ad platform.'}</p></div></div></>;
}

const reportData = [
  ['September investor update', 'Investor', 'Updated 2 days ago'],
  ['Q3 financial close', 'Financial', 'Updated 8 days ago'],
  ['Northstar 2025 strategy', 'Strategy', 'Updated 12 days ago'],
  ['August investor update', 'Investor', 'Updated 1 month ago'],
];
function Reports({ compact = false }: { compact?: boolean }) {
  const [filter, setFilter] = useState('All');
  const [reports, setReports] = useState(reportData);
  const visible = reports.filter((item) => filter === 'All' || item[1] === filter);
  return <><div className={compact ? '' : 'rv-page-head'}>{!compact && <><div className="rv-eyebrow">Knowledge base</div><h1>Reports hub</h1><p>The latest financial, strategic and investor story.</p></>}</div><Card><SectionTitle title="Report library" description={`${visible.length} documents in context`} action={!compact && <button className="rv-button" onClick={() => { setReports((items) => [['New operating brief', 'Financial', 'Created just now'], ...items]); notify('New report draft created'); }}><Plus size={14} /> New</button>} /><div className="rv-segment">{['All', 'Financial', 'Strategy', 'Investor'].map((x) => <button className={filter === x ? 'active' : ''} key={x} onClick={() => setFilter(x)}>{x}</button>)}</div><div>{visible.map(([title, type, date], i) => <div className="rv-report" key={`${title}-${i}`}><div className="rv-report-main"><div className="rv-file"><FileText size={16} /></div><div><h3>{title}</h3><p><span className="rv-pill">{type}</span> {date}</p></div></div><button className="rv-back" onClick={() => notify(`Opening ${title}`)} aria-label={`Open ${title}`}><ChevronRight size={16} /></button></div>)}</div></Card></>;
}

function FinancialReport() {
  return <><Header title="Financial Report" back><button className="rv-button secondary" onClick={() => notify('Report exported as PDF')}>Export</button></Header><div className="rv-content"><div className="rv-page-head"><div className="rv-eyebrow">Q3 2024 · Prepared by Runvera</div><h1>Financial close</h1><p>A clean view of performance, liquidity, and what comes next.</p></div><Card><SectionTitle title="Executive summary" /><p style={{ fontSize: 14, lineHeight: 1.5, margin: 0 }}>Revenue reached <b>$184,240</b>, 12.8% ahead of plan. Gross margin held at 64.9% while operating costs finished 3.2% below plan.</p></Card><div style={{ height: 14 }} /><div className="rv-grid rv-grid-2"><div className="rv-card rv-stat"><span>Revenue</span><b>$184.2k</b><small>+12.8% vs plan</small></div><div className="rv-card rv-stat"><span>Gross profit</span><b>$119.5k</b><small>64.9% margin</small></div><div className="rv-card rv-stat"><span>Operating cost</span><b>$61.8k</b><small>−3.2% vs plan</small></div><div className="rv-card rv-stat"><span>Net income</span><b>$57.7k</b><small>+83.7% vs plan</small></div></div><div style={{ height: 14 }} /><Card><SectionTitle title="P&L summary" description="September actuals compared with plan" /><div className="rv-list">{[['Revenue', '$184,240', '$163,400'], ['Cost of revenue', '$64,720', '$68,100'], ['Operating expenses', '$61,840', '$63,900'], ['Net income', '$57,680', '$31,400']].map(([label, actual, plan]) => <div className="rv-list-row" key={label}><div><strong>{label}</strong><small>Plan {plan}</small></div><b>{actual}</b></div>)}</div></Card><div style={{ height: 14 }} /><Link href="/reports" className="rv-button secondary" style={{ textDecoration: 'none' }}>Back to Reports</Link></div></>;
}

function Projects({ compact = false }: { compact?: boolean }) {
  const [projects, setProjects] = useState([
    { title: 'Enterprise Annual Tier Launch', text: 'Introduce $490/mo annual plan targeting mid-tier agencies to increase upfront cash collections.', target: '+$8,500/mo ARR uplift', progress: 65, status: 'In Progress' },
    { title: 'Cloud Infrastructure Cost Trim', text: 'Migrate vector cache and optimize serverless cold starts to reduce monthly variable expense ratio.', target: '-$1,800/mo operating burn', progress: 40, status: 'In Progress' },
    { title: 'Organic Inbound Lead Loop', text: 'Publish 8 programmatic financial comparison tools to generate inbound high-intent founder trials.', target: '+120 monthly trial starts', progress: 20, status: 'Planning' },
  ]);
  return <><div className={compact ? '' : 'rv-page-head'}>{!compact && <><div className="rv-eyebrow">Operating system</div><h1>Cross-Agent Initiatives</h1><p>Coordinated work with the right specialist in the room.</p></>}</div>{!compact && <button className="rv-button" style={{ marginBottom: 14 }} onClick={() => { setProjects((items) => [{ title: 'New operating initiative', text: 'Define the first milestone and a clear owner.', target: '+$2,000/mo upside', progress: 8, status: 'Planning' }, ...items]); notify('New project added'); }}><Plus size={14} /> New Project</button>}<div className="rv-grid">{projects.map((project) => <Card className="rv-project" key={project.title}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><h3>{project.title}</h3><span className="rv-pill">{project.status}</span></div><p>{project.text}</p><div className="rv-project-meta">Assigned: <span className="rv-pill">Finance</span><span className="rv-pill">Strategy</span></div><div className="rv-project-foot"><span>Target: {project.target}</span><span style={{ color: 'hsl(var(--muted-foreground))' }}>{project.progress}%</span></div><div className="rv-progress"><span style={{ width: `${project.progress}%` }} /></div></Card>)}</div></>;
}

function Settings() {
  const [updates, setUpdates] = useState(true);
  const [sync, setSync] = useState(true);
  const { signOut } = useClerk();
  return <><Header title="Settings" back /><div className="rv-content"><div className="rv-page-head"><div className="rv-eyebrow">Workspace</div><h1>Make it yours.</h1><p>Quiet controls for the way Runvera works with you.</p></div><Card><SectionTitle title="Workspace profile" /><label className="rv-label" htmlFor="workspace">Workspace name</label><input className="rv-input" id="workspace" defaultValue="Northstar Studio" /><div style={{ height: 12 }} /><label className="rv-label" htmlFor="owner">Your name</label><input className="rv-input" id="owner" defaultValue="Alex Morgan" /><button className="rv-button" style={{ width: '100%', marginTop: 14 }} onClick={() => notify('Workspace profile saved')}><Check size={14} /> Save changes</button></Card><div style={{ height: 14 }} /><Card><SectionTitle title="Preferences" /><div className="rv-setting"><div><strong>Decision alerts</strong><small>Get notified when a model signal changes</small></div><button className={`rv-switch ${updates ? 'on' : ''}`} onClick={() => setUpdates(!updates)} aria-label="Toggle decision alerts"><span /></button></div><div className="rv-setting"><div><strong>Live model sync</strong><small>Keep specialists aligned with your assumptions</small></div><button className={`rv-switch ${sync ? 'on' : ''}`} onClick={() => setSync(!sync)} aria-label="Toggle live model sync"><span /></button></div><div className="rv-setting"><div><strong>Default forecast</strong><small>12-month trajectory</small></div><ChevronRight size={16} color="hsl(var(--muted-foreground))" /></div></Card><div style={{ height: 14 }} /><Card><SectionTitle title="Account" /><div className="rv-setting"><div><strong>Alex Morgan</strong><small>Founder · Northstar Studio</small></div><span className="rv-pill green">Active</span></div><button className="rv-button secondary" style={{ width: '100%' }} onClick={() => signOut({ redirectUrl: basePath || '/' })}>Sign out</button></Card></div></>;
}

function PublicHome() {
  return <main className="rv-auth-home">
    <div className="rv-auth-glow" />
    <Logo />
    <div className="rv-auth-home-copy">
      <div className="rv-eyebrow">AI business intelligence for founders</div>
      <h1>Understand your business.<br /><em>Model the future.</em></h1>
      <p>Runvera turns complex business numbers into clear decisions, with a virtual team of finance, strategy, marketing, sales, product and operations specialists beside you.</p>
      <div className="rv-auth-home-actions">
        <Link href="/sign-up" className="rv-button">Create your workspace <ArrowRight size={15} /></Link>
        <Link href="/sign-in" className="rv-button secondary">Sign in</Link>
      </div>
    </div>
    <div className="rv-auth-home-proof"><span><span className="rv-dot" /> Live business intelligence</span><span>Financial model · AI agency · funding plans</span></div>
  </main>;
}

function SignInPage() {
  return <div className="rv-auth-page"><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></div>;
}

function SignUpPage() {
  return <div className="rv-auth-page"><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></div>;
}

function AppRoutes() {
  return <Switch>
    <Route path="/command"><Dashboard /></Route>
    <Route path="/model"><Model /></Route>
    <Route path="/forecasts"><Forecasts /></Route>
    <Route path="/cash-flow"><CashFlow /></Route>
    <Route path="/funding"><Funding /></Route>
    <Route path="/dilution"><Dilution /></Route>
    <Route path="/agency"><Agency /></Route>
    <Route path="/agency/finance"><AgentDetail type="finance" /></Route>
    <Route path="/agency/strategy"><AgentDetail type="strategy" /></Route>
    <Route path="/reports"><Reports /></Route>
    <Route path="/reports/financial"><FinancialReport /></Route>
    <Route path="/projects"><Projects /></Route>
    <Route path="/settings"><Settings /></Route>
    <Route><Redirect to="/command" /></Route>
  </Switch>;
}

function HomeRedirect() {
  return <><Show when="signed-in"><Redirect to="/command" /></Show><Show when="signed-out"><PublicHome /></Show></>;
}

function ProtectedRoutes() {
  return <><Show when="signed-in"><Shell><AppRoutes /></Shell></Show><Show when="signed-out"><Redirect to="/" /></Show></>;
}

function AuthRouter() {
  const [, setLocation] = useLocation();
  return <ClerkProvider
    publishableKey={clerkPubKey}
    proxyUrl={clerkProxyUrl}
    appearance={clerkAppearance}
    signInUrl={`${basePath}/sign-in`}
    signUpUrl={`${basePath}/sign-up`}
    localization={{ signIn: { start: { title: 'Welcome back', subtitle: 'Your business command center is waiting.' } }, signUp: { start: { title: 'Create your Runvera workspace', subtitle: 'Turn your numbers into your next decision.' } } }}
    routerPush={(to) => setLocation(stripBase(to))}
    routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
  >
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route component={ProtectedRoutes} />
    </Switch>
  </ClerkProvider>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={basePath}><ErrorBoundary><AuthRouter /></ErrorBoundary></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;