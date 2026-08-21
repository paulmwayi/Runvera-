import { type ReactNode, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  Activity, ArrowDownRight, ArrowUpRight, BarChart3, Bell, Bot, BriefcaseBusiness,
  Building2, Check, ChevronDown, CircleDollarSign, CircleHelp, Clock3, Download,
  FileBarChart, FileText, FolderKanban, Gauge, Landmark, LayoutDashboard, Menu,
  MoreHorizontal, Plus, Presentation, RefreshCw, Search, Settings as SettingsIcon,
  ShieldCheck, SlidersHorizontal, Sparkles, Target, TrendingUp, Users, WalletCards,
  X,
} from 'lucide-react';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

type IconType = typeof LayoutDashboard;
type ToastSetter = (message: string) => void;

const navItems: { label: string; href: string; icon: IconType }[] = [
  { label: 'Overview', href: '/', icon: LayoutDashboard },
  { label: 'Business', href: '/business', icon: BarChart3 },
  { label: 'Agency', href: '/agency', icon: Bot },
  { label: 'Funding', href: '/funding', icon: CircleDollarSign },
  { label: 'Reports', href: '/reports', icon: FileBarChart },
  { label: 'Projects', href: '/projects', icon: FolderKanban },
];

const revenueBars: Record<string, { revenue: number; cost: number }[]> = {
  '7D': [
    { revenue: 39, cost: 25 }, { revenue: 57, cost: 30 }, { revenue: 48, cost: 34 },
    { revenue: 72, cost: 36 }, { revenue: 64, cost: 46 }, { revenue: 82, cost: 48 }, { revenue: 94, cost: 49 },
  ],
  '30D': [
    { revenue: 48, cost: 31 }, { revenue: 61, cost: 37 }, { revenue: 58, cost: 45 },
    { revenue: 77, cost: 48 }, { revenue: 70, cost: 53 }, { revenue: 90, cost: 62 }, { revenue: 98, cost: 59 },
  ],
  '90D': [
    { revenue: 34, cost: 29 }, { revenue: 43, cost: 34 }, { revenue: 57, cost: 38 },
    { revenue: 64, cost: 47 }, { revenue: 70, cost: 51 }, { revenue: 80, cost: 54 }, { revenue: 96, cost: 57 },
  ],
};

function Logo() {
  return (
    <Link href="/" className="rv-brand" data-testid="link-brand">
      <span className="rv-mark" aria-hidden="true" />
      <span className="rv-brand-name">run<span>vera</span></span>
    </Link>
  );
}

function Sidebar({ location }: { location: string }) {
  return (
    <aside className="rv-sidebar">
      <Logo />
      <div className="rv-eyebrow">Command center</div>
      <nav className="rv-nav" aria-label="Main navigation">
        {navItems.map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href} className={`rv-nav-link ${location === href ? 'active' : ''}`} data-testid={`link-nav-${label.toLowerCase()}`}>
            <Icon />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <div className="rv-side-footer">
        <div className="rv-eyebrow">Workspace</div>
        <Link href="/settings" className={`rv-nav-link ${location === '/settings' ? 'active' : ''}`} data-testid="link-nav-settings">
          <SettingsIcon /><span>Settings</span>
        </Link>
        <button className="rv-command" onClick={() => window.dispatchEvent(new CustomEvent('rv-toast', { detail: 'Command palette is ready' }))} data-testid="button-command-palette">
          <span>Open command palette</span><kbd>⌘ K</kbd>
        </button>
        <div className="rv-profile">
          <div className="rv-avatar" data-testid="avatar-user">AM</div>
          <div><strong>Alex Morgan</strong><small>Founder · Northstar</small></div>
          <ChevronDown size={14} style={{ marginLeft: 'auto', opacity: .55 }} />
        </div>
      </div>
    </aside>
  );
}

function Topbar({ location, onToast }: { location: string; onToast: ToastSetter }) {
  const pageName = location === '/' ? 'Overview' : navItems.find((item) => item.href === location)?.label ?? 'Settings';
  return (
    <header className="rv-topbar">
      <div className="rv-topbar-left">
        <div className="rv-mobile-bar">
          <button className="rv-icon-button rv-mobile-menu" onClick={() => onToast('Navigation is available from the desktop sidebar')} data-testid="button-mobile-menu" aria-label="Open navigation"><Menu size={17} /></button>
          <Logo />
        </div>
        <div className="rv-context"><span>Northstar Studio</span><span>/</span><b>{pageName}</b></div>
      </div>
      <div className="rv-top-actions">
        <button className="rv-icon-button" onClick={() => onToast('No new alerts')} data-testid="button-notifications" aria-label="Notifications"><Bell size={16} /></button>
        <button className="rv-icon-button" onClick={() => onToast('Search is ready')} data-testid="button-search" aria-label="Search"><Search size={16} /></button>
        <button className="rv-quiet-button" onClick={() => onToast('Last synced just now')} data-testid="button-sync" aria-label="Sync status"><RefreshCw size={15} /></button>
      </div>
    </header>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [toast, setToast] = useState('');
  useEffect(() => {
    const handleToast = (event: Event) => setToast((event as CustomEvent<string>).detail);
    window.addEventListener('rv-toast', handleToast);
    return () => window.removeEventListener('rv-toast', handleToast);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timeout);
  }, [toast]);
  return (
    <div className="rv-app">
      <div className="rv-shell">
        <Sidebar location={location} />
        <main className="rv-main">
          <Topbar location={location} onToast={setToast} />
          <div className="rv-content">{children}</div>
        </main>
      </div>
      {toast && <div className="rv-toast" role="status" data-testid="status-toast">{toast}</div>}
    </div>
  );
}

function PageHead({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children?: ReactNode }) {
  return (
    <div className="rv-page-head">
      <div><div className="rv-eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>
      {children && <div className="rv-head-actions">{children}</div>}
    </div>
  );
}

function SectionTitle({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return <div className="rv-section-title"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{action ?? <MoreHorizontal size={16} />}</div>;
}

function MetricCard({ label, value, change, icon: Icon, tone = 'good' }: { label: string; value: string; change: string; icon: IconType; tone?: 'good' | 'amber' }) {
  return (
    <div className="rv-card rv-metric" data-testid={`card-metric-${label.toLowerCase().replaceAll(' ', '-')}`}>
      <div className="rv-metric-top"><span className="rv-metric-label">{label}</span><span className={`rv-pill ${tone === 'good' ? 'good' : ''}`}><Icon size={12} /></span></div>
      <div className="rv-metric-value">{value}</div>
      <div className="rv-metric-change">{change}</div>
    </div>
  );
}

function Dashboard() {
  const [range, setRange] = useState('30D');
  const [view, setView] = useState<'health' | 'momentum'>('health');
  const [toast, setToast] = useState('');
  const bars = revenueBars[range];
  const labels = range === '7D' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : range === '30D' ? ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'] : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
  const showToast = (message: string) => setToast(message);
  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(''), 2500);
    return () => window.clearTimeout(timeout);
  }, [toast]);
  return (
    <>
      <PageHead eyebrow="Monday, 14 October 2024 · 09:42" title="Good morning, Alex." description="Your business at a glance. Three decisions are waiting for you.">
        <div className="rv-tabs" aria-label="Dashboard view">
          <button className={`rv-tab ${view === 'health' ? 'active' : ''}`} onClick={() => setView('health')} data-testid="button-view-health">Health</button>
          <button className={`rv-tab ${view === 'momentum' ? 'active' : ''}`} onClick={() => setView('momentum')} data-testid="button-view-momentum">Momentum</button>
        </div>
        <button className="rv-button" onClick={() => showToast('Weekly brief is being prepared')} data-testid="button-generate-brief"><Sparkles size={14} />Generate brief</button>
      </PageHead>
      <section className="rv-grid rv-grid-health">
        <div className="rv-health" data-testid="card-business-health">
          <div className="rv-eyebrow">Business health</div>
          <div className="rv-health-score"><strong>{view === 'health' ? '82' : '74'}</strong><span>/ 100 · strong</span></div>
          <div className="rv-health-note">Cash is stable. Growth is outpacing plan by 8.4%.</div>
        </div>
        <MetricCard label="Cash runway" value="8.6 mo" change="↑ 1.2 months vs last month" icon={WalletCards} />
        <MetricCard label="MRR" value="$184.2k" change="↑ 12.8% month over month" icon={TrendingUp} />
        <MetricCard label="Net margin" value="31.4%" change="↑ 4.7 pts vs plan" icon={Gauge} tone="good" />
      </section>
      <section className="rv-grid rv-grid-main">
        <div className="rv-card rv-card-pad">
          <SectionTitle title="Revenue & operating cost" description="A clean view of your trajectory" action={<div className="rv-tabs">{(['7D', '30D', '90D'] as const).map((item) => <button key={item} className={`rv-tab ${range === item ? 'active' : ''}`} onClick={() => setRange(item)} data-testid={`button-range-${item.toLowerCase()}`}>{item}</button>)}</div>} />
          <div className="rv-chart-wrap">
            <div className="rv-chart" data-testid="chart-revenue-cost">{bars.map((bar, index) => <div className="rv-bar-group" key={labels[index]}><div className="rv-bars"><span className="rv-bar revenue" style={{ height: `${bar.revenue}%` }} /><span className="rv-bar cost" style={{ height: `${bar.cost}%` }} /></div><span className="rv-chart-label">{labels[index]}</span></div>)}</div>
            <div className="rv-legend"><span><i style={{ background: 'hsl(var(--primary))' }} />Revenue</span><span><i style={{ background: 'hsl(var(--accent))' }} />Operating cost</span><span style={{ marginLeft: 'auto' }}>USD · {range}</span></div>
          </div>
        </div>
        <div className="rv-card rv-card-pad">
          <SectionTitle title="What needs your attention" description="Signals from your virtual team" />
          <div>
            <div className="rv-insight"><i className="rv-insight-mark" /><div><strong>Decide on Q4 hiring pace</strong><span>People suggests moving the designer hire forward by 3 weeks.</span></div></div>
            <div className="rv-insight"><i className="rv-insight-mark green" /><div><strong>Enterprise pipeline is warming</strong><span>Sales sees $42k in qualified expansion potential.</span></div></div>
            <div className="rv-insight"><i className="rv-insight-mark green" /><div><strong>Margin is ahead of the plan</strong><span>Finance confirms 31.4% net margin for September.</span></div></div>
          </div>
          <button className="rv-button secondary rv-empty-action" onClick={() => showToast('Opening all signals')} data-testid="button-view-signals">View all signals <ArrowUpRight size={14} /></button>
        </div>
      </section>
      <section className="rv-grid rv-grid-two" style={{ marginTop: 17 }}>
        <div className="rv-card rv-card-pad">
          <SectionTitle title="Next best actions" description="Small moves with material upside" />
          <div className="rv-list">
            {[
              ['Lock Q4 hiring plan', 'People · due today', Target],
              ['Review enterprise pricing', 'Sales · due tomorrow', BriefcaseBusiness],
              ['Share September close', 'Finance · Friday', FileText],
            ].map(([title, sub, Icon], index) => (
              <div className="rv-list-row" key={String(title)}><div className="rv-list-left"><div className={`rv-list-icon ${index === 1 ? 'orange' : ''}`}><Icon size={15} /></div><div><strong>{title as string}</strong><small>{sub as string}</small></div></div><button className="rv-quiet-button" onClick={() => showToast(`${title} marked for review`)} data-testid={`button-action-${index}`} aria-label={`Open ${title}`}><ArrowUpRight size={14} /></button></div>
            ))}
          </div>
        </div>
        <div className="rv-card rv-card-pad">
          <SectionTitle title="Team pulse" description="Active across your workspace" />
          <div className="rv-list">
            {[
              ['Finance', 'Closed September books', '2m ago', 'green'],
              ['Growth', 'Updated channel forecast', '28m ago', 'green'],
              ['People', 'Added hiring recommendation', '1h ago', 'amber'],
            ].map(([team, message, time, tone], index) => <div className="rv-list-row" key={team}><div className="rv-list-left"><div className={`rv-list-icon ${tone === 'amber' ? 'orange' : ''}`}><Bot size={15} /></div><div><strong>{team}</strong><small>{message}</small></div></div><span data-testid={`text-team-time-${index}`}>{time}</span></div>)}
          </div>
        </div>
      </section>
    </>
  );
}

function Business() {
  const [period, setPeriod] = useState('September 2024');
  const [toast, setToast] = useState('');
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2400); };
  return (
    <>
      <PageHead eyebrow="Business intelligence" title="The model, made legible." description="A living financial model with the context to act on it.">
        <div className="rv-filter"><span>Period</span><select value={period} onChange={(event) => setPeriod(event.target.value)} data-testid="select-business-period"><option>September 2024</option><option>August 2024</option><option>Q3 2024</option></select></div>
        <button className="rv-button secondary" onClick={() => notify('Model synced with latest assumptions')} data-testid="button-sync-model"><RefreshCw size={14} />Sync model</button>
      </PageHead>
      <div className="rv-card rv-card-pad">
        <SectionTitle title={`Operating snapshot · ${period}`} description="Actuals compared to your current plan" action={<button className="rv-quiet-button" onClick={() => notify('Export started')} data-testid="button-export-snapshot"><Download size={14} /></button>} />
        <div className="rv-kpi-grid">
          <div className="rv-kpi"><label>Revenue</label><strong data-testid="text-business-revenue">$184,240</strong><small>+12.8% vs plan</small></div>
          <div className="rv-kpi"><label>Gross profit</label><strong>$119,520</strong><small>64.9% margin</small></div>
          <div className="rv-kpi"><label>Operating cost</label><strong>$61,840</strong><small>−3.2% vs plan</small></div>
          <div className="rv-kpi"><label>Cash balance</label><strong>$1.58m</strong><small>8.6 month runway</small></div>
        </div>
      </div>
      <section className="rv-grid rv-grid-two" style={{ marginTop: 17 }}>
        <div className="rv-card rv-card-pad">
          <SectionTitle title="P&L summary" description="Trailing 6 months" />
          <div className="rv-table-wrap"><table className="rv-table"><thead><tr><th>Line item</th><th>Actual</th><th>Plan</th><th>Variance</th></tr></thead><tbody>
            {[['Revenue', '$184,240', '$163,400', '+12.8%'], ['Cost of revenue', '$64,720', '$68,100', '−5.0%'], ['Operating expenses', '$61,840', '$63,900', '−3.2%'], ['Net income', '$57,680', '$31,400', '+83.7%']].map((row) => <tr key={row[0]}><td className="main-cell">{row[0]}</td><td>{row[1]}</td><td>{row[2]}</td><td><span className="rv-status">{row[3]}</span></td></tr>)}
          </tbody></table></div>
        </div>
        <div className="rv-card rv-card-pad">
          <SectionTitle title="Unit economics" description="Where each dollar is working" />
          <div className="rv-list">
            {[['Customer acquisition cost', '$412', '↓ 8.1% this quarter'], ['Lifetime value', '$14,820', '↑ 14.6% this quarter'], ['LTV : CAC', '36.0x', 'Healthy above 3.0x'], ['Payback period', '3.1 mo', '↓ 0.6 months']].map(([label, value, detail]) => <div className="rv-list-row" key={label}><div><strong>{label}</strong><small>{detail}</small></div><span style={{ fontSize: 14, color: 'hsl(var(--foreground))', fontWeight: 800 }}>{value}</span></div>)}
          </div>
        </div>
      </section>
      {toast && <div className="rv-toast" role="status" data-testid="status-business-toast">{toast}</div>}
    </>
  );
}

const agents = [
  { name: 'Mara', role: 'Finance lead', initials: 'MA', status: 'Online', color: 'green', detail: 'Protects cash, forecasts the next constraint.' },
  { name: 'Sage', role: 'Growth strategist', initials: 'SA', status: 'Online', color: 'orange', detail: 'Finds the channel with the cleanest path to demand.' },
  { name: 'Orion', role: 'Operations lead', initials: 'OR', status: 'Working', color: 'green', detail: 'Turns recurring friction into repeatable systems.' },
  { name: 'June', role: 'People partner', initials: 'JU', status: 'Reviewing', color: 'orange', detail: 'Keeps the team plan aligned with the actual work.' },
];

function Agency() {
  const [selected, setSelected] = useState('Mara');
  const [toast, setToast] = useState('');
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2400); };
  return (
    <>
      <PageHead eyebrow="Virtual leadership team" title="Meet your agency." description="Four focused perspectives. One decisive operating rhythm.">
        <button className="rv-button secondary" onClick={() => notify('Agent brief downloaded')} data-testid="button-download-agent-brief"><Download size={14} />Agent brief</button>
        <button className="rv-button" onClick={() => notify('New agent request noted')} data-testid="button-add-agent"><Plus size={14} />Add agent</button>
      </PageHead>
      <section className="rv-grid rv-grid-two">
        <div className="rv-card rv-card-pad">
          <SectionTitle title="Your agency" description="Specialists with a shared view of Northstar" />
          <div className="rv-list">
            {agents.map((agent) => <button key={agent.name} className="rv-list-row" onClick={() => setSelected(agent.name)} style={{ textAlign: 'left', background: selected === agent.name ? 'hsl(var(--secondary) / .55)' : 'transparent', border: 0, borderBottom: '1px solid hsl(var(--border))', width: '100%', borderRadius: 8 }} data-testid={`button-agent-${agent.name.toLowerCase()}`}><div className="rv-list-left"><div className={`rv-avatar ${agent.color === 'orange' ? 'orange-avatar' : ''}`} style={agent.color === 'orange' ? { background: 'hsl(var(--accent))' } : undefined}>{agent.initials}</div><div><strong>{agent.name} · {agent.role}</strong><small>{agent.detail}</small></div></div><span className={`rv-status ${agent.color === 'orange' ? 'amber' : ''}`}>{agent.status}</span></button>)}
          </div>
        </div>
        <div className="rv-card rv-card-pad">
          <SectionTitle title={`${selected}'s activity`} description="A focused readout from the last 24 hours" />
          <div className="rv-insight"><i className="rv-insight-mark green" /><div><strong>Flagged an opportunity in enterprise expansion</strong><span>“Three accounts have crossed the usage threshold for a higher plan.”</span></div></div>
          <div className="rv-insight"><i className="rv-insight-mark" /><div><strong>Asked for a decision</strong><span>Should the Q4 cash buffer stay at 6 months or move to 9?</span></div></div>
          <button className="rv-button" onClick={() => notify(`Opening ${selected}'s workspace`)} data-testid="button-open-agent-workspace">Open {selected}'s workspace <ArrowUpRight size={14} /></button>
        </div>
      </section>
      <div className="rv-card rv-card-pad" style={{ marginTop: 17 }}>
        <SectionTitle title="Activity feed" description="Decisions, updates and questions from the team" action={<div className="rv-pill good">Live</div>} />
        <div className="rv-table-wrap"><table className="rv-table"><thead><tr><th>Agent</th><th>Activity</th><th>Type</th><th>When</th></tr></thead><tbody>
          {[['Mara', 'Updated cash forecast through March', 'Model update', '2 min ago'], ['Sage', 'Recommended shifting 14% of paid spend', 'Recommendation', '28 min ago'], ['June', 'Added a hiring scenario to Q4 plan', 'Scenario', '1 hr ago'], ['Orion', 'Closed the weekly operations review', 'Completed', '3 hr ago']].map((row, index) => <tr key={row[0]}><td className="main-cell"><span className="rv-status">{row[0]}</span></td><td>{row[1]}</td><td><span className="rv-pill">{row[2]}</span></td><td data-testid={`text-agent-activity-${index}`}>{row[3]}</td></tr>)}
        </tbody></table></div>
      </div>
      {toast && <div className="rv-toast" role="status" data-testid="status-agency-toast">{toast}</div>}
    </>
  );
}

function Funding() {
  const [raise, setRaise] = useState(750);
  const [stage, setStage] = useState('Seed extension');
  const [toast, setToast] = useState('');
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2400); };
  const ownership = Math.round((raise / 750) * 8.5 * 10) / 10;
  return (
    <>
      <PageHead eyebrow="Capital planning" title="Fund the next chapter." description="Model the raise before it becomes a conversation.">
        <div className="rv-filter"><span>Stage</span><select value={stage} onChange={(event) => setStage(event.target.value)} data-testid="select-funding-stage"><option>Seed extension</option><option>Series A</option><option>Bridge round</option></select></div>
        <button className="rv-button" onClick={() => notify('Scenario saved to your funding plan')} data-testid="button-save-scenario"><Check size={14} />Save scenario</button>
      </PageHead>
      <section className="rv-grid rv-grid-two">
        <div className="rv-card rv-card-pad">
          <SectionTitle title="Raise planner" description="Move the levers, understand the trade-offs" />
          <div className="rv-scenario">
            <div className="rv-scenario-head"><div><h3>Target raise</h3><p>What you want to bring into the business</p></div><div className="rv-scenario-value">${raise}k</div></div>
            <input className="rv-range" type="range" min="250" max="1500" step="50" value={raise} onChange={(event) => setRaise(Number(event.target.value))} data-testid="input-target-raise" />
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'hsl(var(--muted-foreground))', font: '10px var(--app-font-mono)', marginTop: 8 }}><span>$250k</span><span>$1.5m</span></div>
          </div>
          <div className="rv-grid rv-grid-two" style={{ marginTop: 12 }}>
            <div className="rv-kpi"><label>Post-money valuation</label><strong>${(raise * 100 / 8.5 / 1000 + 1.9).toFixed(2)}m</strong><small>Based on current scenario</small></div>
            <div className="rv-kpi"><label>New ownership</label><strong>{ownership}%</strong><small>Founder-friendly range</small></div>
          </div>
        </div>
        <div className="rv-card rv-card-pad">
          <SectionTitle title="Runway outcomes" description={`If you raise $${raise}k today`} />
          <div className="rv-list">
            {[['Base case', '14.2 months', 'Reach $320k MRR', 'green'], ['Conservative', '11.8 months', 'Reach $270k MRR', 'amber'], ['High-growth', '9.4 months', 'Reach $410k MRR', 'green']].map(([name, months, result, tone]) => <div className="rv-list-row" key={name}><div className="rv-list-left"><div className={`rv-list-icon ${tone === 'amber' ? 'orange' : ''}`}><Landmark size={15} /></div><div><strong>{name}</strong><small>{result}</small></div></div><span style={{ fontSize: 13, color: 'hsl(var(--foreground))', fontWeight: 800 }}>{months}</span></div>)}
          </div>
          <div style={{ background: 'hsl(var(--primary) / .08)', borderRadius: 9, padding: 13, marginTop: 14, color: 'hsl(var(--primary))', fontSize: 11, lineHeight: 1.5 }}><strong>Mara says:</strong> This raise gives you enough room to hire deliberately, without paying for growth before the signal is there.</div>
        </div>
      </section>
      <div className="rv-card rv-card-pad" style={{ marginTop: 17 }}>
        <SectionTitle title="Dilution scenarios" description="How ownership changes at different valuations" action={<button className="rv-button secondary" onClick={() => notify('Dilution table exported')} data-testid="button-export-dilution"><Download size={14} />Export</button>} />
        <div className="rv-table-wrap"><table className="rv-table"><thead><tr><th>Scenario</th><th>Raise</th><th>Pre-money</th><th>Investor ownership</th><th>Founder ownership</th></tr></thead><tbody>
          {[['Current plan', '$750k', '$7.5m', '9.1%', '73.4%'], ['Efficient raise', '$500k', '$8.0m', '5.9%', '76.6%'], ['Growth round', '$1.25m', '$8.0m', '13.5%', '69.0%']].map((row) => <tr key={row[0]}><td className="main-cell">{row[0]}</td><td>{row[1]}</td><td>{row[2]}</td><td><span className="rv-status amber">{row[3]}</span></td><td>{row[4]}</td></tr>)}
        </tbody></table></div>
      </div>
      {toast && <div className="rv-toast" role="status" data-testid="status-funding-toast">{toast}</div>}
    </>
  );
}

function Reports() {
  const [tab, setTab] = useState('All reports');
  const [toast, setToast] = useState('');
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2400); };
  const reports = [
    ['September investor update', 'Investor', 'Updated 2 days ago', Presentation],
    ['Q3 financial close', 'Financial', 'Updated 8 days ago', FileBarChart],
    ['Northstar 2025 strategy', 'Strategy', 'Updated 12 days ago', Target],
    ['August investor update', 'Investor', 'Updated 1 month ago', Presentation],
    ['H1 operating review', 'Financial', 'Updated 2 months ago', FileBarChart],
  ].filter((report) => tab === 'All reports' || report[1] === tab);
  return (
    <>
      <PageHead eyebrow="Knowledge base" title="Reports that move the room." description="The latest version of every financial, strategic and investor story.">
        <button className="rv-button" onClick={() => notify('New report draft created')} data-testid="button-new-report"><Plus size={14} />New report</button>
      </PageHead>
      <div className="rv-card rv-card-pad">
        <div className="rv-section-title"><div><h2>Report library</h2><p>Shared with your team and kept in context</p></div><div className="rv-tabs">{['All reports', 'Financial', 'Strategy', 'Investor'].map((item) => <button key={item} className={`rv-tab ${tab === item ? 'active' : ''}`} onClick={() => setTab(item)} data-testid={`button-report-filter-${item.toLowerCase().replaceAll(' ', '-')}`}>{item}</button>)}</div></div>
        <div>
          {reports.map(([title, type, date, Icon], index) => <div className="rv-report" key={title as string}><div className="rv-report-main"><div className="rv-file-icon"><Icon size={16} /></div><div><h3>{title as string}</h3><p><span className="rv-pill">{type as string}</span> &nbsp;{date as string}</p></div></div><button className="rv-quiet-button" onClick={() => notify(`Opening ${title}`)} data-testid={`button-open-report-${index}`} aria-label={`Open ${title}`}><ArrowUpRight size={14} /></button></div>)}
          {reports.length === 0 && <div style={{ padding: 35, textAlign: 'center', color: 'hsl(var(--muted-foreground))', fontSize: 12 }} data-testid="empty-reports">No reports in this view.</div>}
        </div>
      </div>
      {toast && <div className="rv-toast" role="status" data-testid="status-reports-toast">{toast}</div>}
    </>
  );
}

function Projects() {
  const [projects, setProjects] = useState([
    { name: 'Q4 pricing refresh', owner: 'Sage', detail: 'Test enterprise packaging and pricing page', progress: 68, status: 'In progress', icon: Target },
    { name: 'Series A readiness', owner: 'Mara', detail: 'Close metrics, narrative and diligence room', progress: 42, status: 'In progress', icon: Landmark },
    { name: 'Hiring plan · Design', owner: 'June', detail: 'Define role scorecard and interview loop', progress: 24, status: 'Needs decision', icon: Users },
    { name: 'Weekly operating cadence', owner: 'Orion', detail: 'Make the Monday review a repeatable ritual', progress: 91, status: 'On track', icon: Activity },
  ]);
  const [toast, setToast] = useState('');
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2400); };
  const addProject = () => { setProjects((current) => [{ name: 'New operating initiative', owner: 'Mara', detail: 'Define the first milestone and a clear owner', progress: 8, status: 'Draft', icon: FolderKanban }, ...current]); notify('New project added'); };
  return (
    <>
      <PageHead eyebrow="Operating system" title="Projects with a point of view." description="Keep strategic work moving, with the right agent in the room.">
        <button className="rv-button" onClick={addProject} data-testid="button-new-project"><Plus size={14} />New project</button>
      </PageHead>
      <div className="rv-card rv-card-pad">
        <SectionTitle title="Active projects" description={`${projects.length} initiatives across Northstar`} action={<div className="rv-pill good">On plan · 76%</div>} />
        <div className="rv-list">
          {projects.map((project, index) => { const Icon = project.icon; return <div className="rv-list-row" key={`${project.name}-${index}`}><div className="rv-list-left" style={{ flex: 1 }}><div className={`rv-list-icon ${project.status === 'Needs decision' ? 'orange' : ''}`}><Icon size={15} /></div><div style={{ minWidth: 0, flex: 1 }}><strong>{project.name}</strong><small>{project.detail} · Led by {project.owner}</small><div className="rv-progress" style={{ marginTop: 10, maxWidth: 410 }}><span style={{ width: `${project.progress}%` }} /></div></div></div><div style={{ display: 'flex', alignItems: 'center', gap: 16 }}><span className={`rv-status ${project.status === 'Needs decision' ? 'amber' : project.status === 'Draft' ? 'muted' : ''}`}>{project.status}</span><button className="rv-quiet-button" onClick={() => notify(`${project.name} opened`)} data-testid={`button-open-project-${index}`} aria-label={`Open ${project.name}`}><ArrowUpRight size={14} /></button></div></div>; })}
        </div>
      </div>
      <section className="rv-grid rv-grid-two" style={{ marginTop: 17 }}>
        <div className="rv-card rv-card-pad"><SectionTitle title="Agent allocation" description="Who is carrying the work" /><div className="rv-list">{[['Mara', '2 projects', 'Finance & capital'], ['Sage', '1 project', 'Growth & pricing'], ['June', '1 project', 'People & hiring']].map((item) => <div className="rv-list-row" key={item[0]}><div className="rv-list-left"><div className="rv-avatar" style={{ background: 'hsl(var(--secondary))', color: 'hsl(var(--primary))' }}>{item[0].slice(0, 2).toUpperCase()}</div><div><strong>{item[0]}</strong><small>{item[2]}</small></div></div><span>{item[1]}</span></div>)}</div></div>
        <div className="rv-card rv-card-pad"><SectionTitle title="Project rhythm" description="The next moments that matter" /><div className="rv-insight"><i className="rv-insight-mark" /><div><strong>Decision review · Tomorrow, 10:00</strong><span>Q4 pricing refresh needs your call on enterprise packaging.</span></div></div><div className="rv-insight"><i className="rv-insight-mark green" /><div><strong>Weekly review · Friday, 09:30</strong><span>All agents will bring a one-page update.</span></div></div></div>
      </section>
      {toast && <div className="rv-toast" role="status" data-testid="status-projects-toast">{toast}</div>}
    </>
  );
}

function Settings() {
  const [digest, setDigest] = useState(true);
  const [autonomy, setAutonomy] = useState('Recommend');
  const [toast, setToast] = useState('');
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2400); };
  return (
    <>
      <PageHead eyebrow="Workspace preferences" title="Make Runvera yours." description="Tune how your leadership team thinks, writes and keeps you in the loop.">
        <button className="rv-button" onClick={() => notify('Preferences saved')} data-testid="button-save-settings"><Check size={14} />Save changes</button>
      </PageHead>
      <section className="rv-grid rv-grid-two">
        <div className="rv-card rv-card-pad"><SectionTitle title="Workspace" description="The basics your team shares" /><div className="rv-list"><label className="rv-list-row"><div><strong>Workspace name</strong><small>Shown in reports and briefs</small></div><input className="rv-input" defaultValue="Northstar Studio" data-testid="input-workspace-name" /></label><label className="rv-list-row"><div><strong>Fiscal year start</strong><small>Used for planning periods</small></div><select className="rv-input" defaultValue="January" data-testid="select-fiscal-year"><option>January</option><option>April</option><option>July</option></select></label><label className="rv-list-row"><div><strong>Base currency</strong><small>Financial model display currency</small></div><select className="rv-input" defaultValue="USD" data-testid="select-currency"><option>USD</option><option>EUR</option><option>GBP</option></select></label></div></div>
        <div className="rv-card rv-card-pad"><SectionTitle title="How your agency works" description="The level of signal you want" /><div className="rv-list"><div className="rv-list-row"><div><strong>Decision autonomy</strong><small>Agents recommend; you decide</small></div><select className="rv-input" value={autonomy} onChange={(event) => setAutonomy(event.target.value)} data-testid="select-autonomy"><option>Recommend</option><option>Ask first</option><option>Auto-organize</option></select></div><div className="rv-list-row"><div><strong>Weekly founder digest</strong><small>One short brief every Monday</small></div><button className={`rv-tab ${digest ? 'active' : ''}`} style={{ border: '1px solid hsl(var(--border))' }} onClick={() => setDigest(!digest)} data-testid="button-toggle-digest">{digest ? 'On' : 'Off'}</button></div><div className="rv-list-row"><div><strong>Writing style</strong><small>Clear, direct and without filler</small></div><span className="rv-pill good">Decisive</span></div></div></div>
      </section>
      <div className="rv-card rv-card-pad" style={{ marginTop: 17 }}><SectionTitle title="Data & access" description="Keep your workspace considered and secure" /><div className="rv-grid rv-grid-two"><div className="rv-list-row"><div className="rv-list-left"><div className="rv-list-icon"><ShieldCheck size={15} /></div><div><strong>Workspace privacy</strong><small>Your data is only visible to your team.</small></div></div><span className="rv-status">Protected</span></div><div className="rv-list-row"><div className="rv-list-left"><div className="rv-list-icon orange"><CircleHelp size={15} /></div><div><strong>Need a hand?</strong><small>Read the Runvera operating guide.</small></div></div><button className="rv-button secondary" onClick={() => notify('Guide opened')} data-testid="button-open-guide">Open guide</button></div></div></div>
      {toast && <div className="rv-toast" role="status" data-testid="status-settings-toast">{toast}</div>}
    </>
  );
}

function Router() {
  return (
    <Shell>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/business" component={Business} />
        <Route path="/agency" component={Agency} />
        <Route path="/funding" component={Funding} />
        <Route path="/reports" component={Reports} />
        <Route path="/projects" component={Projects} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Shell>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <ErrorBoundary>
            <Router />
          </ErrorBoundary>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;