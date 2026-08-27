import { type ReactNode, useContext, useEffect, useState } from "react";
import { Link, Redirect, Route, Switch, useLocation, Router as WouterRouter } from "wouter";
import {
  ArrowLeft, ArrowRight, BriefcaseBusiness, Check, ChevronRight, CircleDollarSign,
  FileText, Landmark, LayoutGrid, LineChart, Minus, Plus, Settings as SettingsIcon,
  SlidersHorizontal, Sparkles, Target, TrendingUp, Users, WalletCards, Zap,
} from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { useBusiness } from "@/hooks/use-business";
import type { BusinessState } from "@/hooks/use-business";
import { supabase } from "@workspace/supabase/client";
import { DevAuthContext } from "@/main";

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

/**
 * Works like Clerk's Show but uses the Supabase-backed DevAuthContext.
 * When Supabase is configured and the user is signed-in, children render.
 * When Supabase is not configured, always treats the user as signed-in
 * so the dashboard is still accessible during development.
 */
function AuthGate({ when, children }: { when: "signed-in" | "signed-out"; children: ReactNode }) {
  const { isSignedIn } = useContext(DevAuthContext);
  if (when === "signed-in") return isSignedIn ? <>{children}</> : null;
  return isSignedIn ? null : <>{children}</>;
}

function useSignOut() {
  const ctx = useContext(DevAuthContext);
  return ctx.signOut;
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

const notify = (message: string) =>
  window.dispatchEvent(new CustomEvent("rv-toast", { detail: message }));

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

function ProtectedApp({ children }: { children: ReactNode }) {
  const { isSignedIn } = useContext(DevAuthContext);
  if (!isSignedIn) {
    window.location.href = "/";
    return null;
  }
  return <Shell>{children}</Shell>;
}

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function Logo() {
  return (
    <a href="/" className="rv-brand" style={{ textDecoration: 'none' }}>
      <span className="rv-mark" />
      <span className="rv-brand-name">
        run<span>vera</span>
      </span>
    </a>
  );
}

function Header({ title, back = false, children }: { title: string; back?: boolean; children?: ReactNode }) {
  return (
    <header className="rv-topbar">
      <div>
        {back ? (
          <button className="rv-back" onClick={() => { window.location.href = "/"; }}>
            <ArrowLeft size={16} /> Back
          </button>
        ) : (
          <Logo />
        )}
      </div>
      <div className="rv-top-title">{title}</div>
      <div className="rv-top-note">
        {children ?? (
          <>
            <span className="rv-dot" />
            Default Alive
          </>
        )}
      </div>
    </header>
  );
}

const bottomItems = [
  { href: "/command", label: "Command", icon: LayoutGrid },
  { href: "/forecasts", label: "Forecasts", icon: LineChart },
  { href: "/funding", label: "Funding", icon: CircleDollarSign },
  { href: "/agency", label: "Agency", icon: Users },
];

function BottomNav() {
  const [location] = useLocation();
  const active = location.startsWith("/agency")
    ? "/agency"
    : location.startsWith("/funding") || location === "/dilution"
      ? "/funding"
      : location.startsWith("/forecasts") || location === "/cash-flow"
        ? "/forecasts"
        : "/command";
  return (
    <nav className="rv-bottom">
      {bottomItems.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} className={active === href ? "active" : ""}>
          <Icon />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState("");
  useEffect(() => {
    const listener = (event: Event) => setToast((event as CustomEvent<string>).detail);
    window.addEventListener("rv-toast", listener);
    return () => window.removeEventListener("rv-toast", listener);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(timeout);
  }, [toast]);
  return (
    <div className="rv-app">
      <div className="rv-shell">
        <main className="rv-main">{children}</main>
      </div>
      <BottomNav />
      {toast && <div className="rv-toast" role="status">{toast}</div>}
    </div>
  );
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rv-card rv-card-pad ${className}`}>{children}</section>;
}

function SectionTitle({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="rv-section-title">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Charts
// ---------------------------------------------------------------------------

function Chart({ detailed = false }: { detailed?: boolean }) {
  const points = detailed
    ? "0,145 30,133 60,125 90,117 120,110 150,101 180,93 210,84 240,75 270,67 300,58 330,46"
    : "0,127 15,118 30,125 45,115 60,121 75,111 90,116 105,102 120,109 135,95 150,100 165,89 180,94 195,80 210,85 225,69 240,76 255,59 270,67 285,47 300,56 315,34 330,48";
  const exp = detailed
    ? "0,112 40,110 80,108 120,102 160,98 200,94 240,87 280,83 330,77"
    : "0,122 45,120 90,119 135,115 180,110 225,107 270,103 330,98";
  return (
    <svg className="rv-chart" viewBox="0 0 340 185" preserveAspectRatio="none" aria-label="Revenue and expense trajectory">
      <defs>
        <linearGradient id="revFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="hsl(158 65% 48% / .22)" />
          <stop offset="1" stopColor="hsl(158 65% 48% / 0)" />
        </linearGradient>
      </defs>
      {[35, 75, 115, 155].map((y) => (
        <line key={y} x1="0" x2="340" y1={y} y2={y} stroke="hsl(220 18% 90%)" strokeDasharray="2 4" />
      ))}
      <polyline points={`${points} 330,165 0,165`} fill="url(#revFill)" stroke="none" />
      <polyline points={points} fill="none" stroke="hsl(158 65% 48%)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={exp} fill="none" stroke="hsl(351 65% 54%)" strokeWidth="2" strokeDasharray="4 4" />
      {["$0", "$0", "$0", "$0", "$0"].map((label, i) => (
        <text key={`${label}-${i}`} x="2" y={28 + i * 34} fontSize="9" fill="hsl(225 9% 45%)">{label}</text>
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------

function Slider({
  label, value, min, max, step, display, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number; display: string; onChange: (value: number) => void;
}) {
  return (
    <div className="rv-control" style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <label>{label}</label>
        <strong style={{ fontSize: 13, color: "hsl(var(--primary))" }}>{display}</strong>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ width: "100%" }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

function Dashboard() {
  const { business } = useBusiness();
  const { revenue = 0, expenses = 0, cash = 0, customers = 0, growth = 0, seats = 0 } = business ?? {};
  const netFlow = revenue - expenses;
  const grossMargin = revenue > 0 ? Math.max(0, ((revenue - expenses) / revenue) * 100) : 0;
  const breakEvenGap = Math.max(0, expenses - revenue);
  const runway = expenses > revenue && expenses > 0 ? cash / (expenses - revenue) : cash > 0 ? Infinity : 0;
  const money = (value: number) => `$${Math.round(value).toLocaleString()}`;

  return (
    <>
      <Header title="Command Center" />
      <div className="rv-content">
        <div className="rv-card rv-runway">
          <div className="rv-eyebrow">Business runway</div>
          <strong>{Number.isFinite(runway) ? runway.toFixed(1) : "∞"}</strong>
          <span className="unit">Months</span>
          <Link href="/model" className="rv-button ghost" style={{ float: "right", textDecoration: "none" }}>
            <SlidersHorizontal size={14} /> Tune
          </Link>
          <div className="rv-runway-meta">
            <div><span>Cash Reserve</span><b>{money(cash)}</b></div>
            <div><span>Net Monthly Flow</span><b style={{ color: netFlow < 0 ? "hsl(var(--destructive))" : "hsl(var(--accent))" }}>{netFlow < 0 ? "-" : "+"}{money(Math.abs(netFlow))}/mo</b></div>
            <div><span>Break-Even Goal</span><b>{money(expenses)}/mo</b></div>
          </div>
        </div>

        <div style={{ height: 14 }} />
        <div className="rv-grid rv-grid-2">
          <div className="rv-card rv-metric"><TrendingUp className="rv-metric-icon" size={18} /><label>Monthly Revenue</label><strong>{money(revenue)}</strong><small>{growth > 0 ? `↗ ${growth.toFixed(1)}% MoM` : "No growth entered"}</small></div>
          <div className="rv-card rv-metric"><WalletCards className="rv-metric-icon" size={18} /><label>Total Expenses</label><strong>{money(expenses)}</strong><small>{seats} Team Seats</small></div>
          <div className="rv-card rv-metric"><span className="rv-metric-icon">%</span><label>Gross Margin</label><strong>{grossMargin.toFixed(1)}%</strong><small>{revenue > 0 ? "Based on current model" : "Enter revenue to calculate"}</small></div>
          <div className="rv-card rv-metric"><Users className="rv-metric-icon" size={18} /><label>Active Customers</label><strong>{customers.toLocaleString()}</strong><small className={breakEvenGap > 0 ? "negative" : ""}>{breakEvenGap > 0 ? `${money(breakEvenGap)} revenue gap` : "Break-even reached"}</small></div>
        </div>

        <div style={{ height: 14 }} />
        <Card className="rv-chart-card">
          <SectionTitle title="12-Month Trajectory" description={revenue > 0 ? "Forecast based on active growth rate" : "Enter your business numbers to activate the forecast"} action={<div className="rv-legend"><span><i className="rv-dot" />Rev</span><span><i className="rv-dot red" />Exp</span></div>} />
          <Chart detailed />
        </Card>

        <div style={{ height: 14 }} />
        <Card className="rv-alert-card">
          <div className="rv-eyebrow">Decisions & alerts</div>
          <div className="rv-alert" style={{ paddingInline: 0 }}>
            {revenue === 0 && expenses === 0 && cash === 0 ? (
              <><span className="tag">Setup required</span><h3>Your business model is ready.</h3><p>Enter your revenue, expenses, cash and operating assumptions to activate Runvera's business intelligence.</p><Link href="/model" className="rv-link" style={{ textDecoration: "none" }}>Set Up Business Model <ArrowRight size={14} /></Link></>
            ) : netFlow < 0 ? (
              <><span className="tag">Runway priority</span><h3>Business is currently burning cash.</h3><p>Your current monthly expenses exceed revenue by {money(breakEvenGap)}.</p><Link href="/model" className="rv-link" style={{ textDecoration: "none" }}>Explore Cost & Price Scenarios <ArrowRight size={14} /></Link></>
            ) : (
              <><span className="tag">Business health</span><h3>Positive monthly cash flow.</h3><p>Revenue currently exceeds operating expenses by {money(netFlow)} per month.</p></>
            )}
          </div>
        </Card>

        <div style={{ height: 14 }} />
        <Card className="rv-agency-card">
          <SectionTitle title="AI Specialist Agency" description="Live perspectives from your operating model" action={<span className="rv-pill">6 Active</span>} />
          <div className="rv-specialists">
            <Link href="/agency/finance" className="rv-card rv-specialist" style={{ textDecoration: "none" }}><div className="rv-agent-icon"><WalletCards size={16} /></div><h3>Finance</h3><p>Runway, burn analysis & break-even forecasting</p></Link>
            <Link href="/agency/strategy" className="rv-card rv-specialist" style={{ textDecoration: "none" }}><div className="rv-agent-icon purple"><Target size={16} /></div><h3>Strategy</h3><p>Competitive positioning & resource allocation</p></Link>
          </div>
        </Card>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Model
// ---------------------------------------------------------------------------

function Model() {
  const { business, updateBusiness, resetBusiness } = useBusiness();
  const [revenue, setRevenue] = useState(business.revenue);
  const [growth, setGrowth] = useState(business.growth);
  const [expenses, setExpenses] = useState(business.expenses);
  const [cash, setCash] = useState(business.cash);
  const [seats, setSeats] = useState(business.seats);
  const [customers, setCustomers] = useState(business.customers);

  const saveModel = () => { updateBusiness({ revenue, growth, expenses, cash, seats, customers }); notify("Model saved — forecasts updated"); };
  const reset = () => { resetBusiness(); setRevenue(0); setGrowth(0); setExpenses(0); setCash(0); setSeats(0); setCustomers(0); notify("Business model reset"); };

  return (
    <>
      <Header title="Adjust Model" back />
      <div className="rv-content">
        <div className="rv-page-head"><div className="rv-eyebrow">Active assumptions</div><h1>Shape the model.</h1><p>Enter your real business numbers. Runvera will use them across your dashboard, forecasts and financial intelligence.</p></div>
        <h2 style={{ fontSize: 17, margin: "20px 0 10px" }}>Revenue & Growth</h2>
        <Card>
          <Slider label="Monthly Revenue" value={revenue} min={0} max={100000} step={500} display={`$${revenue.toLocaleString()}`} onChange={setRevenue} />
          <Slider label="Monthly Growth Rate" value={growth} min={0} max={50} step={0.5} display={`${growth.toFixed(1)}%`} onChange={setGrowth} />
          <Slider label="Active Customers" value={customers} min={0} max={10000} step={1} display={customers.toLocaleString()} onChange={setCustomers} />
        </Card>
        <h2 style={{ fontSize: 17, margin: "20px 0 10px" }}>Costs & Headcount</h2>
        <Card>
          <Slider label="Fixed Monthly Expenses" value={expenses} min={0} max={50000} step={500} display={`$${expenses.toLocaleString()}`} onChange={setExpenses} />
          <div className="rv-control"><label>Team Headcount: {seats}</label><div className="rv-stepper"><button onClick={() => setSeats(Math.max(0, seats - 1))}><Minus size={14} /></button><span>{seats}</span><button onClick={() => setSeats(seats + 1)}><Plus size={14} /></button></div></div>
        </Card>
        <h2 style={{ fontSize: 17, margin: "20px 0 10px" }}>Cash Reserve</h2>
        <Card>
          <Slider label="Cash in Bank" value={cash} min={0} max={500000} step={5000} display={`$${cash.toLocaleString()}`} onChange={setCash} />
        </Card>
        <button className="rv-button" style={{ width: "100%", marginTop: 20 }} onClick={saveModel}><Check size={15} /> Save Model</button>
        <button className="rv-button secondary" style={{ width: "100%", marginTop: 10 }} onClick={reset}>Reset Business Data</button>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Forecasts
// ---------------------------------------------------------------------------

function Forecasts() {
  const { business } = useBusiness();
  const [months, setMonths] = useState("12 Months");
  const [metric, setMetric] = useState("Rev vs Exp");
  const money = (value: number) => `$${Math.round(value).toLocaleString()}`;
  const periods = months === "6 Months" ? 6 : months === "24 Months" ? 24 : 12;
  const forecastRevenue = business.revenue * Math.pow(1 + business.growth / 100, periods);
  const breakEvenGap = Math.max(0, business.expenses - business.revenue);
  const breakEvenUsers = business.customers > 0 && business.revenue > 0 ? Math.ceil(business.expenses / (business.revenue / business.customers)) : 0;

  return (
    <>
      <Header title="Forecast Studio" />
      <div className="rv-content">
        <div className="rv-tabs" style={{ width: "100%", justifyContent: "space-between" }}>
          {["6 Months", "12 Months", "24 Months"].map((item) => <button key={item} className={`rv-tab ${months === item ? "active" : ""}`} onClick={() => setMonths(item)}>{item}</button>)}
        </div>
        <div style={{ height: 10 }} />
        <div className="rv-segment">
          {["Rev vs Exp", "Cash Reserve", "Net Cash Flow", "Customers"].map((item) => <button key={item} className={metric === item ? "active" : ""} onClick={() => setMetric(item)}>{item}</button>)}
        </div>
        <div style={{ height: 14 }} />
        <Card>
          <SectionTitle title={metric} description="Forecast based on current model parameters" action={<div style={{ textAlign: "right" }}><span style={{ fontSize: 10, color: "hsl(var(--muted-foreground))" }}>Month {periods} Goal</span><b style={{ display: "block", color: "hsl(var(--accent))" }}>{money(forecastRevenue)}/mo</b></div>} />
          <Chart detailed={periods > 6} />
        </Card>
        <div style={{ height: 14 }} />
        <Card>
          <SectionTitle title="Break-Even & Runway Velocity" action={<span className="rv-pill amber">{breakEvenGap > 0 ? "Closing Gap" : "Break-Even"}</span>} />
          <div className="rv-stat-grid">
            <div className="rv-stat"><span>Break-Even Target</span><b>{money(business.expenses)}/mo</b></div>
            <div className="rv-stat"><span>Break-Even Users</span><b>{breakEvenUsers.toLocaleString()} Accounts</b></div>
            <div className="rv-stat"><span>Revenue Gap</span><b style={{ color: breakEvenGap > 0 ? "hsl(var(--destructive))" : "hsl(var(--accent))" }}>{money(breakEvenGap)}</b></div>
            <div className="rv-stat"><span>Accounts Needed</span><b>{Math.max(0, breakEvenUsers - business.customers)} Users</b></div>
          </div>
        </Card>
        <div style={{ height: 14 }} />
        <Card>
          <SectionTitle title="Model Levers & Assumptions" />
          <div className="rv-list">
            <Link href="/model" className="rv-list-row" style={{ textDecoration: "none" }}><div><strong>Monthly Growth Rate</strong><small>Current active assumption</small></div><span className="rv-pill">{business.growth.toFixed(1)}%</span><ChevronRight size={15} /></Link>
            <Link href="/cash-flow" className="rv-list-row" style={{ textDecoration: "none" }}><div><strong>Cash flow detail</strong><small>See monthly inflows and outflows</small></div><ChevronRight size={15} /></Link>
          </div>
        </Card>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Cash Flow
// ---------------------------------------------------------------------------

function CashFlow() {
  const { business } = useBusiness();
  const [period, setPeriod] = useState("Monthly");
  const netFlow = business.revenue - business.expenses;
  const periods = period === "Monthly" ? 6 : 4;
  const money = (value: number) => `$${Math.round(value).toLocaleString()}`;

  return (
    <>
      <Header title="Cash Flow" back />
      <div className="rv-content">
        <div className="rv-page-head"><div className="rv-eyebrow">Forecast detail</div><h1>Follow the cash.</h1><p>Know what your operating rhythm makes possible.</p></div>
        <div className="rv-tabs">{["Monthly", "Quarterly"].map((x) => <button className={`rv-tab ${period === x ? "active" : ""}`} onClick={() => setPeriod(x)} key={x}>{x}</button>)}</div>
        <div style={{ height: 14 }} />
        <Card>
          <SectionTitle title={`${period} net cash flow`} description={`Next ${periods} periods`} />
          <div style={{ display: "flex", alignItems: "end", height: 165, gap: 9, borderBottom: "1px solid hsl(var(--border))" }}>
            {Array.from({ length: periods }).map((_, i) => {
              const value = netFlow * (period === "Monthly" ? 1 : 3);
              const height = Math.min(92, Math.max(12, Math.abs(value) / Math.max(1, Math.abs(netFlow)) * 70));
              return (
                <div key={i} style={{ flex: 1, height: "100%", display: "flex", alignItems: "end", flexDirection: "column", justifyContent: "end", gap: 6 }}>
                  <div style={{ width: "100%", height: `${height}%`, background: value < 0 ? "hsl(var(--destructive) / .55)" : "hsl(var(--accent) / .8)", borderRadius: "6px 6px 2px 2px" }} />
                  <span style={{ fontSize: 9, color: "hsl(var(--muted-foreground))" }}>{period === "Monthly" ? `M${i + 1}` : `Q${i + 1}`}</span>
                </div>
              );
            })}
          </div>
        </Card>
        <div style={{ height: 14 }} />
        <div className="rv-grid rv-grid-2">
          <div className="rv-card rv-stat"><span>Opening cash</span><b>{money(business.cash)}</b><small>Current balance</small></div>
          <div className="rv-card rv-stat"><span>Closing cash</span><b>{money(business.cash + netFlow * periods)}</b><small>After {periods} periods</small></div>
          <div className="rv-card rv-stat"><span>Cash in</span><b style={{ color: "hsl(var(--accent))" }}>+{money(business.revenue * periods)}</b><small>Revenue collected</small></div>
          <div className="rv-card rv-stat"><span>Cash out</span><b style={{ color: "hsl(var(--destructive))" }}>-{money(business.expenses * periods)}</b><small>Operating spend</small></div>
        </div>
        <div style={{ height: 14 }} />
        <Card>
          <SectionTitle title="Transaction summary" description="What is moving the balance" />
          <div className="rv-list">
            {[{ label: "Customer receipts", value: business.revenue, Icon: TrendingUp }, { label: "Team & contractors", value: -business.expenses * 0.6, Icon: Users }, { label: "Tools & infrastructure", value: -business.expenses * 0.4, Icon: Zap }, { label: "Tax reserve", value: 0, Icon: Landmark }].map(({ label, value, Icon }) => (
              <div className="rv-list-row" key={String(label)}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}><div className="rv-agent-icon green"><Icon size={15} /></div><strong>{String(label)}</strong></div>
                <b style={{ color: Number(value) >= 0 ? "hsl(var(--accent))" : "hsl(var(--destructive))" }}>{Number(value) >= 0 ? "+" : "-"}{money(Math.abs(Number(value)))}</b>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Funding
// ---------------------------------------------------------------------------

function Funding() {
  const [raise, setRaise] = useState(500);
  const [scenario, setScenario] = useState("Pre-Seed SAFE");
  const [preMoney, setPreMoney] = useState(2000);
  const postMoney = raise + preMoney;
  const dilution = postMoney > 0 ? (raise / postMoney) * 100 : 0;
  const founderOwnership = Math.max(0, 100 - dilution);

  return (
    <>
      <Header title="Funding Planner"><button className="rv-button ghost" onClick={() => notify("New scenario started")}><Plus size={14} /> Scenario</button></Header>
      <div className="rv-content">
        <div className="rv-segment">{["Pre-Seed SAFE", "Seed Lead", "Bridge"].map((x) => <button className={scenario === x ? "active" : ""} onClick={() => setScenario(x)} key={x}>{x}</button>)}</div>
        <div style={{ height: 14 }} />
        <Card>
          <SectionTitle title="Post-Round Cap Table" description="Ownership after this round" action={<span className="rv-pill">{founderOwnership.toFixed(1)}% Founder</span>} />
          <div className="rv-capbar"><span style={{ width: `${founderOwnership}%` }} /><span style={{ width: `${dilution}%` }} /><span style={{ width: "0%" }} /></div>
          <div className="rv-cap-legend"><span><i />Founders: {founderOwnership.toFixed(1)}%</span><span><i className="green" />Investors: {dilution.toFixed(1)}%</span><span><i className="amber" />Pool: 0%</span></div>
        </Card>
        <div style={{ height: 14 }} />
        <div className="rv-grid rv-grid-2">
          <div className="rv-card rv-stat"><span>Post-Money Valuation</span><b>${(postMoney / 1000).toFixed(2)}M</b><small>Pre-money: ${(preMoney / 1000).toFixed(2)}M</small></div>
          <div className="rv-card rv-stat"><span>Target Capital Raise</span><b>${raise}k</b><small>Dilution: {dilution.toFixed(1)}%</small></div>
          <div className="rv-card rv-stat"><span>Founder Retained</span><b>{founderOwnership.toFixed(1)}%</b><small>Post-round ownership</small></div>
          <div className="rv-card rv-stat"><span>New Runway Buffer</span><b>+{raise > 0 ? "Capital" : "0.0 Mo"}</b><small>Based on target raise</small></div>
        </div>
        <div style={{ height: 14 }} />
        <Card>
          <SectionTitle title="Tune Round Terms" description={scenario} />
          <Slider label="Target Raise" value={raise} min={100} max={1500} step={50} display={`$${raise},000`} onChange={setRaise} />
          <Slider label="Pre-Money Valuation" value={preMoney} min={1000} max={10000} step={100} display={`$${(preMoney / 1000).toFixed(1)}M`} onChange={setPreMoney} />
          <button className="rv-button" style={{ width: "100%", marginTop: 12 }} onClick={() => notify(`${scenario} scenario saved`)}><Check size={14} /> Save Scenario</button>
        </Card>
        <div style={{ height: 14 }} />
        <Link href="/dilution" className="rv-card rv-list-row" style={{ padding: 16, textDecoration: "none" }}>
          <div><strong>Open dilution calculator</strong><small>Compare ownership at different valuations</small></div>
          <ArrowRight size={16} color="hsl(var(--primary))" />
        </Link>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Dilution
// ---------------------------------------------------------------------------

function Dilution() {
  const [raise, setRaise] = useState(500);
  const [pre, setPre] = useState(2000);
  const [pool, setPool] = useState(10);
  const post = raise + pre;
  const investor = post > 0 ? (raise / post) * 100 : 0;
  const founder = Math.max(0, 100 - investor - pool);

  return (
    <>
      <Header title="New Scenario" back />
      <div className="rv-content">
        <div className="rv-page-head"><div className="rv-eyebrow">Funding calculator</div><h1>Model the round.</h1><p>Understand the trade before it becomes a term sheet.</p></div>
        <label className="rv-label" htmlFor="scenario">Scenario title</label>
        <input id="scenario" className="rv-input" defaultValue="New Funding Scenario" />
        <h2 style={{ fontSize: 17, margin: "22px 0 10px" }}>Round Economics</h2>
        <Card>
          <Slider label="Target Raise" value={raise} min={100} max={2000} step={50} display={`$${raise},000`} onChange={setRaise} />
          <Slider label="Pre-Money Valuation" value={pre} min={1000} max={15000} step={100} display={`$${(pre / 1000).toFixed(1)}M`} onChange={setPre} />
          <Slider label="Option Pool (ESOP)" value={pool} min={0} max={25} step={1} display={`${pool}%`} onChange={setPool} />
        </Card>
        <div style={{ height: 14 }} />
        <Card>
          <SectionTitle title="Ownership outcome" description="Post-money cap table" />
          <div className="rv-stat-grid">
            <div className="rv-stat"><span>Investor ownership</span><b>{investor.toFixed(1)}%</b></div>
            <div className="rv-stat"><span>Founder ownership</span><b>{founder.toFixed(1)}%</b></div>
            <div className="rv-stat"><span>Post-money</span><b>${(post / 1000).toFixed(2)}M</b></div>
            <div className="rv-stat"><span>Option pool</span><b>{pool}%</b></div>
          </div>
        </Card>
        <button className="rv-button" style={{ width: "100%", marginTop: 18 }} onClick={() => notify("Scenario saved to Funding Planner")}><Check size={14} /> Save</button>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Agency & Agent Detail
// ---------------------------------------------------------------------------

const agentData = [
  { name: "Finance", icon: WalletCards, tone: "", detail: "Runway: 0 Months Remaining", result: "$0/mo net cash flow", href: "/agency/finance" },
  { name: "Strategy", icon: Target, tone: "purple", detail: "Default Alive Path Optimization", result: "Waiting for business data", href: "/agency/strategy" },
  { name: "Marketing", icon: Sparkles, tone: "pink", detail: "Acquisition Payback & Channel Economics", result: "Estimated payback period: 3.1 mo", href: "#" },
  { name: "Sales", icon: TrendingUp, tone: "green", detail: "Deal Velocity & Average Contract Value", result: "Waiting for sales data", href: "#" },
  { name: "Product", icon: BriefcaseBusiness, tone: "green", detail: "Feature Stickiness & Churn Defenses", result: "Waiting for customer data", href: "#" },
  { name: "Operations", icon: SettingsIcon, tone: "orange", detail: "SaaS Infrastructure & Fixed Cost Leverage", result: "Waiting for expense data", href: "#" },
];

function Agency() {
  const [tab, setTab] = useState("6 AI Agents");
  return (
    <>
      <Header title="AI Agency & Reports" />
      <div className="rv-content">
        <div className="rv-tabs" style={{ width: "100%", justifyContent: "space-around" }}>{["6 AI Agents", "Reports", "Projects"].map((x) => <button className={`rv-tab ${tab === x ? "active" : ""}`} key={x} onClick={() => setTab(x)}>{x}</button>)}</div>
        <div style={{ height: 18 }} />
        {tab === "6 AI Agents" && (
          <>
            <div className="rv-page-head"><h1>Specialist Business Team</h1><p>Sample analysis generated from your model</p></div>
            <div className="rv-grid rv-grid-2">
              {agentData.map(({ name, icon: Icon, tone, detail, result, href }) => (
                <Link key={name} href={href} onClick={(e) => href === "#" && (e.preventDefault(), notify(`${name} agent is coming into focus`))} className="rv-card rv-specialist" style={{ textDecoration: "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><div className={`rv-agent-icon ${tone}`}><Icon size={16} /></div><ChevronRight size={17} color="hsl(var(--muted-foreground))" /></div>
                  <h3>{name}</h3><p>{detail}</p><p style={{ color: "hsl(var(--primary))", marginTop: 10 }}>{result}</p>
                </Link>
              ))}
            </div>
            <div style={{ marginTop: 14 }}><Card><div style={{ display: "flex", gap: 10, alignItems: "center" }}><Zap size={18} color="hsl(var(--primary))" /><strong>Agent Intelligence Pipeline</strong></div><p style={{ color: "hsl(var(--muted-foreground))", fontSize: 12, lineHeight: 1.4 }}>All 6 agents read your live Financial Model parameters synchronously. Any change instantly regenerates strategic advice.</p></Card></div>
          </>
        )}
        {tab === "Reports" && <Reports compact />}
        {tab === "Projects" && <Projects compact />}
      </div>
    </>
  );
}

function AgentDetail({ type }: { type: "finance" | "strategy" }) {
  const finance = type === "finance";
  const title = finance ? "Finance Brief" : "Strategy Brief";
  const specialist = finance ? "Finance Specialist" : "Strategy Specialist";
  const assessment = finance ? "SaaS Infrastructure & Fixed Cost Leverage" : "Default Alive Path Optimization";
  const body = finance ? "Add your business data to generate runway, burn and operating leverage analysis." : "Add your revenue and growth assumptions to generate strategic forecasts.";
  const decisions = finance ? ["Audit recurring subscriptions and eliminate unused SaaS tool seats ($300+/mo savings)", "Document standard operating procedures for contractor onboarding", "Consolidate cloud hosting and utilize annual reserved capacity discounts"] : ["Focus 80% of leadership bandwidth on single primary distribution channel", "Position against legacy enterprise tools by emphasizing rapid 5-minute setup", "Lock in 12-month customer commitments via discounted annual billing"];
  return (
    <>
      <Header title={title} back><button className="rv-button secondary" onClick={() => notify("Brief closed")}>Close</button></Header>
      <div className="rv-content">
        <div className="rv-detail-hero"><div className={`rv-agent-icon ${finance ? "orange" : "purple"}`}>{finance ? <SettingsIcon size={18} /> : <Target size={18} />}</div><div><h2>{specialist}</h2><p>Sample analysis generated from your model</p></div></div>
        <Card><div className="rv-eyebrow">Current assessment</div><h2 style={{ fontSize: 24, letterSpacing: "-.06em", margin: "10px 0 7px" }}>{assessment}</h2><p style={{ color: "hsl(var(--muted-foreground))", fontSize: 14, lineHeight: 1.4, margin: 0 }}>{body}</p></Card>
        <div style={{ height: 14 }} />
        <Card><h2 style={{ fontSize: 17, margin: 0 }}>Recommended Decisions</h2><div className="rv-numbered" style={{ marginTop: 15 }}>{decisions.map((decision, i) => <div className="rv-numbered-row" key={decision}><span className="rv-number">{i + 1}</span><span>{decision}</span></div>)}</div></Card>
        <div className="rv-risk"><h3><Zap size={15} style={{ verticalAlign: "middle", marginRight: 6 }} />Risk Factor</h3><p>{finance ? "Ensure single-point-of-failure risks in infrastructure and key code modules are mitigated." : "Channel concentration risk: Ensure acquisition is not reliant on a single ad platform."}</p></div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

const reportData = [
  ["September investor update", "Investor", "Updated 2 days ago"],
  ["Q3 financial close", "Financial", "Updated 8 days ago"],
  ["Northstar 2025 strategy", "Strategy", "Updated 12 days ago"],
  ["August investor update", "Investor", "Updated 1 month ago"],
];

function Reports({ compact = false }: { compact?: boolean }) {
  const [filter, setFilter] = useState("All");
  const [reports] = useState(reportData);
  const visible = reports.filter((item) => filter === "All" || item[1] === filter);
  return (
    <>
      <div className={compact ? "" : "rv-page-head"}>
        {!compact && <><div className="rv-eyebrow">Knowledge base</div><h1>Reports hub</h1><p>The latest financial, strategic and investor story.</p></>}
      </div>
      <Card>
        <SectionTitle title="Report library" description={`${visible.length} documents in context`} action={!compact && <button className="rv-button" onClick={() => notify("New report draft created")}><Plus size={14} /> New</button>} />
        <div className="rv-segment">{["All", "Financial", "Strategy", "Investor"].map((x) => <button className={filter === x ? "active" : ""} key={x} onClick={() => setFilter(x)}>{x}</button>)}</div>
        <div>{visible.map(([title, type, date], i) => <div className="rv-report" key={`${title}-${i}`}><div className="rv-report-main"><div className="rv-file"><FileText size={16} /></div><div><h3>{title}</h3><p><span className="rv-pill">{type}</span> {date}</p></div></div><button className="rv-back" onClick={() => notify(`Opening ${title}`)} aria-label={`Open ${title}`}><ChevronRight size={16} /></button></div>)}</div>
      </Card>
    </>
  );
}

function FinancialReport() {
  return (
    <>
      <Header title="Financial Report" back><button className="rv-button secondary" onClick={() => notify("Report exported as PDF")}>Export</button></Header>
      <div className="rv-content">
        <div className="rv-page-head"><div className="rv-eyebrow">Q3 2024 · Prepared by Runvera</div><h1>Financial close</h1><p>A clean view of performance, liquidity, and what comes next.</p></div>
        <Card><SectionTitle title="Executive summary" /><p style={{ fontSize: 14, lineHeight: 1.5, margin: 0 }}>Revenue reached <b>$184,240</b>, 12.8% ahead of plan. Gross margin held at 64.9% while operating costs finished 3.2% below plan.</p></Card>
        <div style={{ height: 14 }} />
        <div className="rv-grid rv-grid-2">
          <div className="rv-card rv-stat"><span>Revenue</span><b>$184.2k</b><small>+12.8% vs plan</small></div>
          <div className="rv-card rv-stat"><span>Gross profit</span><b>$119.5k</b><small>64.9% margin</small></div>
          <div className="rv-card rv-stat"><span>Operating cost</span><b>$61.8k</b><small>−3.2% vs plan</small></div>
          <div className="rv-card rv-stat"><span>Net income</span><b>$57.7k</b><small>+83.7% vs plan</small></div>
        </div>
        <div style={{ height: 14 }} />
        <Card>
          <SectionTitle title="P&L summary" description="September actuals compared with plan" />
          <div className="rv-list">
            {[["Revenue", "$184,240", "$163,400"], ["Cost of revenue", "$64,720", "$68,100"], ["Operating expenses", "$61,840", "$63,900"], ["Net income", "$57,680", "$31,400"]].map(([label, actual, plan]) => <div className="rv-list-row" key={label}><div><strong>{label}</strong><small>Plan {plan}</small></div><b>{actual}</b></div>)}
          </div>
        </Card>
        <div style={{ height: 14 }} />
        <Link href="/reports" className="rv-button secondary" style={{ textDecoration: "none" }}>Back to Reports</Link>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

function Projects({ compact = false }: { compact?: boolean }) {
  const [projects] = useState([
    { title: "Enterprise Annual Tier Launch", text: "Introduce $490/mo annual plan targeting mid-tier agencies to increase upfront cash collections.", target: "+$8,500/mo ARR uplift", progress: 65, status: "In Progress" },
    { title: "Cloud Infrastructure Cost Trim", text: "Migrate vector cache and optimize serverless cold starts to reduce monthly variable expense ratio.", target: "-$1,800/mo operating burn", progress: 40, status: "In Progress" },
    { title: "Organic Inbound Lead Loop", text: "Publish 8 programmatic financial comparison tools to generate inbound high-intent founder trials.", target: "+120 monthly trial starts", progress: 20, status: "Planning" },
  ]);
  return (
    <>
      <div className={compact ? "" : "rv-page-head"}>
        {!compact && <><div className="rv-eyebrow">Operating system</div><h1>Cross-Agent Initiatives</h1><p>Coordinated work with the right specialist in the room.</p></>}
      </div>
      {!compact && <button className="rv-button" style={{ marginBottom: 14 }} onClick={() => notify("New project added")}><Plus size={14} /> New Project</button>}
      <div className="rv-grid">
        {projects.map((project) => (
          <Card className="rv-project" key={project.title}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><h3>{project.title}</h3><span className="rv-pill">{project.status}</span></div>
            <p>{project.text}</p>
            <div className="rv-project-meta">Assigned: <span className="rv-pill">Finance</span><span className="rv-pill">Strategy</span></div>
            <div className="rv-project-foot"><span>Target: {project.target}</span><span style={{ color: "hsl(var(--muted-foreground))" }}>{project.progress}%</span></div>
            <div className="rv-progress"><span style={{ width: `${project.progress}%` }} /></div>
          </Card>
        ))}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

function Settings() {
  const [updates, setUpdates] = useState(true);
  const [sync, setSync] = useState(true);
  const [, setLocation] = useLocation();
  const signOut = useSignOut();
  const handleSignOut = () => {
    signOut();
    setLocation("/");
  };
  return (
    <>
      <Header title="Settings" back />
      <div className="rv-content">
        <div className="rv-page-head"><div className="rv-eyebrow">Workspace</div><h1>Make it yours.</h1><p>Quiet controls for the way Runvera works with you.</p></div>
        <Card>
          <SectionTitle title="Workspace profile" />
          <label className="rv-label" htmlFor="workspace">Workspace name</label>
          <input className="rv-input" id="workspace" defaultValue="Northstar Studio" />
          <div style={{ height: 12 }} />
          <label className="rv-label" htmlFor="owner">Your name</label>
          <input className="rv-input" id="owner" defaultValue="Alex Morgan" />
          <button className="rv-button" style={{ width: "100%", marginTop: 14 }} onClick={() => notify("Workspace profile saved")}><Check size={14} /> Save changes</button>
        </Card>
        <div style={{ height: 14 }} />
        <Card>
          <SectionTitle title="Preferences" />
          <div className="rv-setting"><div><strong>Decision alerts</strong><small>Get notified when a model signal changes</small></div><button className={`rv-switch ${updates ? "on" : ""}`} onClick={() => setUpdates(!updates)} aria-label="Toggle decision alerts"><span /></button></div>
          <div className="rv-setting"><div><strong>Live model sync</strong><small>Keep specialists aligned with your assumptions</small></div><button className={`rv-switch ${sync ? "on" : ""}`} onClick={() => setSync(!sync)} aria-label="Toggle live model sync"><span /></button></div>
          <div className="rv-setting"><div><strong>Default forecast</strong><small>12-month trajectory</small></div><ChevronRight size={16} color="hsl(var(--muted-foreground))" /></div>
        </Card>
        <div style={{ height: 14 }} />
        <Card>
          <SectionTitle title="Account" />
          <div className="rv-setting"><div><strong>Alex Morgan</strong><small>Founder · Northstar Studio</small></div><span className="rv-pill green">Active</span></div>
          <button className="rv-button secondary" style={{ width: "100%" }} onClick={handleSignOut}>Sign out</button>
        </Card>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Auth Pages (Supabase)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// OAuth
// ---------------------------------------------------------------------------

function signInWithOAuth(provider: 'google' | 'github') {
  if (!supabase) return;
  const origin = window.location.origin;
  supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });
}

const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
);

const GitHubIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
);

function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (!supabase) { setError("Authentication is not configured. Please contact support."); setLoading(false); return; }
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) {
      setError(authError.message);
    } else {
      window.location.href = "/command";
    }
  };

  return (
    <div className="rv-auth-page">
      <div className="rv-auth-card">
        <Logo />
        <h1 style={{ marginTop: 24 }}>Welcome back</h1>
        <p className="rv-auth-card-sub">
          Don't have an account?{' '}
          <button onClick={() => { window.location.href = '/sign-up'; }}>Sign up</button>
        </p>

        {error && <div className="rv-auth-error">{error}</div>}

        <form onSubmit={handleSignIn}>
          <div className="rv-auth-field">
            <div className="rv-auth-field-label"><label htmlFor="si-email">Email Address</label></div>
            <input id="si-email" className="rv-input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
          </div>

          <div className="rv-auth-field">
            <div className="rv-auth-field-label">
              <label htmlFor="si-password">Password</label>
              <a href="#" onClick={(e) => e.preventDefault()}>Forgot password?</a>
            </div>
            <div className="rv-auth-pw-wrap">
              <input id="si-password" className="rv-input" type={showPw ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
              <button type="button" className="rv-auth-pw-toggle" onClick={() => setShowPw(!showPw)} tabIndex={-1} aria-label="Toggle password visibility">
                {showPw ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                )}
              </button>
            </div>
          </div>

          <div className="rv-auth-check">
            <input type="checkbox" id="si-remember" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            <label htmlFor="si-remember">Remember this device</label>
          </div>

          <button className="rv-auth-submit" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign In'}</button>
        </form>

        <div className="rv-auth-divider">or continue with</div>
        <div className="rv-auth-oauth">
          <button className="rv-auth-oauth-btn" type="button" onClick={() => signInWithOAuth('google')}><GoogleIcon /> Continue with Google</button>
          <button className="rv-auth-oauth-btn" type="button" onClick={() => signInWithOAuth('github')}><GitHubIcon /> Continue with GitHub</button>
        </div>
      </div>
    </div>
  );
}

function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (!supabase) { setError("Authentication is not configured. Please contact support."); setLoading(false); return; }
    const { error: authError } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (authError) {
      setError(authError.message);
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div className="rv-auth-page">
        <div className="rv-auth-card rv-auth-success">
          <Logo />
          <div style={{ marginTop: 16 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="hsl(158 65% 48%)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
          </div>
          <h2>Check your email</h2>
          <p>We sent a confirmation link to<br /><b>{email}</b></p>
          <button className="rv-auth-submit" onClick={() => { window.location.href = '/sign-in'; }}>Go to sign in</button>
        </div>
      </div>
    );
  }

  return (
    <div className="rv-auth-page">
      <div className="rv-auth-card">
        <Logo />
        <h1 style={{ marginTop: 24 }}>Create your workspace</h1>
        <p className="rv-auth-card-sub">
          Already have an account?{' '}
          <button onClick={() => { window.location.href = '/sign-in'; }}>Sign in</button>
        </p>

        {error && <div className="rv-auth-error">{error}</div>}

        <form onSubmit={handleSignUp}>
          <div className="rv-auth-field">
            <div className="rv-auth-field-label"><label htmlFor="su-email">Email Address</label></div>
            <input id="su-email" className="rv-input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
          </div>

          <div className="rv-auth-field">
            <div className="rv-auth-field-label"><label htmlFor="su-password">Password</label></div>
            <div className="rv-auth-pw-wrap">
              <input id="su-password" className="rv-input" type={showPw ? 'text' : 'password'} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" autoComplete="new-password" />
              <button type="button" className="rv-auth-pw-toggle" onClick={() => setShowPw(!showPw)} tabIndex={-1} aria-label="Toggle password visibility">
                {showPw ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                )}
              </button>
            </div>
          </div>

          <button className="rv-auth-submit" type="submit" disabled={loading} style={{ marginTop: 8 }}>{loading ? 'Creating account…' : 'Create account'}</button>
        </form>

        <div className="rv-auth-divider">or continue with</div>
        <div className="rv-auth-oauth">
          <button className="rv-auth-oauth-btn" type="button" onClick={() => signInWithOAuth('google')}><GoogleIcon /> Continue with Google</button>
          <button className="rv-auth-oauth-btn" type="button" onClick={() => signInWithOAuth('github')}><GitHubIcon /> Continue with GitHub</button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Auth callback (handles OAuth redirect from Supabase)
// ---------------------------------------------------------------------------

function AuthCallback() {
  useEffect(() => {
    // Supabase stores the session from the URL fragment automatically
    window.location.href = '/command';
  }, []);

  return (
    <div className="rv-auth-page">
      <div className="rv-auth-card" style={{ textAlign: 'center' }}>
        <Logo />
        <p style={{ marginTop: 20, color: 'hsl(var(--muted-foreground))', fontSize: 14 }}>Signing you in...</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Public home & redirects
// ---------------------------------------------------------------------------

function PublicHome() {
  return (
    <main className="rv-auth-home">
      <div className="rv-auth-glow" />
      <Logo />
      <div className="rv-auth-home-copy">
        <div className="rv-eyebrow">AI business intelligence for founders</div>
        <h1>Understand your business.<br /><em>Model the future.</em></h1>
        <p>Runvera turns complex business numbers into clear decisions, with a virtual team of finance, strategy, marketing, sales, product and operations specialists beside you.</p>
        <div className="rv-auth-home-actions">
          <button className="rv-button" onClick={() => { window.location.href = '/sign-up'; }}>Create your workspace <ArrowRight size={15} /></button>
          <button className="rv-button secondary" onClick={() => { window.location.href = '/sign-in'; }}>Sign in</button>
        </div>
      </div>
      <div className="rv-auth-home-proof"><span><span className="rv-dot" /> Live business intelligence</span><span>Financial model · AI agency · funding plans</span></div>
    </main>
  );
}

function HomeRedirect() {
  const { isSignedIn } = useContext(DevAuthContext);
  if (isSignedIn) {
    window.location.href = "/command";
    return null;
  }
  return <PublicHome />;
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

function AppRoutes() {
  return (
    <Switch>
      <Route path="/sign-in/*"><SignInPage /></Route>
      <Route path="/sign-up/*"><SignUpPage /></Route>
      <Route path="/auth/callback"><AuthCallback /></Route>
      <Route path="/"><HomeRedirect /></Route>
      <Route path="/command"><ProtectedApp><Dashboard /></ProtectedApp></Route>
      <Route path="/model"><ProtectedApp><Model /></ProtectedApp></Route>
      <Route path="/forecasts"><ProtectedApp><Forecasts /></ProtectedApp></Route>
      <Route path="/cash-flow"><ProtectedApp><CashFlow /></ProtectedApp></Route>
      <Route path="/funding"><ProtectedApp><Funding /></ProtectedApp></Route>
      <Route path="/dilution"><ProtectedApp><Dilution /></ProtectedApp></Route>
      <Route path="/agency/finance"><ProtectedApp><AgentDetail type="finance" /></ProtectedApp></Route>
      <Route path="/agency/strategy"><ProtectedApp><AgentDetail type="strategy" /></ProtectedApp></Route>
      <Route path="/agency"><ProtectedApp><Agency /></ProtectedApp></Route>
      <Route path="/reports/financial"><ProtectedApp><FinancialReport /></ProtectedApp></Route>
      <Route path="/reports"><ProtectedApp><Reports /></ProtectedApp></Route>
      <Route path="/projects"><ProtectedApp><Projects /></ProtectedApp></Route>
      <Route path="/settings"><ProtectedApp><Settings /></ProtectedApp></Route>
      <Route><Redirect to="/" /></Route>
    </Switch>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <AppRoutes />
      <Toaster />
    </WouterRouter>
  );
}

export default App;
