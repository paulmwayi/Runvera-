import { useState } from 'react';
import { Link } from 'wouter';
import { ChevronRight } from 'lucide-react';

export default function Forecasts({
  business,
  Header,
  Card,
  SectionTitle,
  Chart,
}: any) {
  const [months, setMonths] = useState('12 Months');
  const [metric, setMetric] = useState('Rev vs Exp');

  const revenue = Number(business?.revenue || 0);
  const expenses = Number(business?.expenses || 0);
  const cash = Number(business?.cash || 0);
  const customers = Number(business?.customers || 0);
  const growth = Number(business?.growth || 0);

  const forecastRevenue = (month: number) =>
    revenue * Math.pow(1 + growth / 100, month);

  const forecastExpenses = (month: number) =>
    expenses * Math.pow(1.02, month);

  const month12Revenue = forecastRevenue(12);
  const month12Expenses = forecastExpenses(12);
  const month12NetFlow = month12Revenue - month12Expenses;

  const revenueGap = Math.max(0, expenses - revenue);

  const revenuePerCustomer =
    customers > 0 ? revenue / customers : 0;

  const breakEvenCustomers =
    revenuePerCustomer > 0
      ? Math.ceil(expenses / revenuePerCustomer)
      : 0;

  const accountsNeeded =
    Math.max(0, breakEvenCustomers - customers);

  const money = (value: number) =>
    `$${Math.round(value).toLocaleString()}`;

  const monthGoal =
    metric === 'Customers'
      ? Math.round(
          customers * Math.pow(1 + growth / 100, 12)
        ).toLocaleString()
      : metric === 'Cash Reserve'
        ? money(
            cash +
              Array.from({ length: 12 }, (_, i) =>
                forecastRevenue(i + 1) -
                forecastExpenses(i + 1)
              ).reduce((sum, value) => sum + value, 0)
          )
        : money(
            metric === 'Net Cash Flow'
              ? month12NetFlow
              : month12Revenue
          );

  return (
    <>
      <Header title="Forecast Studio" />

      <div className="rv-content">

        <div
          className="rv-tabs"
          style={{
            width: '100%',
            justifyContent: 'space-between',
          }}
        >
          {['6 Months', '12 Months', '24 Months'].map((item) => (
            <button
              key={item}
              className={`rv-tab ${
                months === item ? 'active' : ''
              }`}
              onClick={() => setMonths(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div style={{ height: 10 }} />

        <div className="rv-segment">
          {[
            'Rev vs Exp',
            'Cash Reserve',
            'Net Cash Flow',
            'Customers',
          ].map((item) => (
            <button
              key={item}
              className={metric === item ? 'active' : ''}
              onClick={() => setMetric(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div style={{ height: 14 }} />

        <Card>
          <SectionTitle
            title={metric}
            description="Forecast based on current business model"
            action={
              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    fontSize: 10,
                    color:
                      'hsl(var(--muted-foreground))',
                  }}
                >
                  Month 12 Goal
                </span>

                <b
                  style={{
                    display: 'block',
                    color: 'hsl(var(--accent))',
                  }}
                >
                  {monthGoal}
                </b>
              </div>
            }
          />

          <Chart detailed />
        </Card>

        <div style={{ height: 14 }} />

        <Card>
          <SectionTitle
            title="Break-Even & Runway Velocity"
            action={
              <span
                className={`rv-pill ${
                  revenue >= expenses
                    ? 'green'
                    : 'amber'
                }`}
              >
                {revenue >= expenses
                  ? 'Break-Even Reached'
                  : 'Closing Gap'}
              </span>
            }
          />

          <div className="rv-stat-grid">

            <div className="rv-stat">
              <span>Break-Even Target</span>
              <b>{money(expenses)}/mo</b>
            </div>

            <div className="rv-stat">
              <span>Break-Even Users</span>
              <b>
                {breakEvenCustomers.toLocaleString()}
              </b>
            </div>

            <div className="rv-stat">
              <span>Revenue Gap</span>
              <b
                style={{
                  color:
                    revenueGap > 0
                      ? 'hsl(var(--destructive))'
                      : 'hsl(var(--accent))',
                }}
              >
                {money(revenueGap)}
              </b>
            </div>

            <div className="rv-stat">
              <span>Accounts Needed</span>
              <b
                style={{
                  color:
                    accountsNeeded > 0
                      ? '#c38a15'
                      : 'hsl(var(--accent))',
                }}
              >
                {accountsNeeded.toLocaleString()}
              </b>
            </div>

          </div>
        </Card>

        <div style={{ height: 14 }} />

        <Card>
          <SectionTitle title="Model Levers & Assumptions" />

          <div className="rv-list">

            <Link
              href="/model"
              className="rv-list-row"
              style={{ textDecoration: 'none' }}
            >
              <div>
                <strong>Monthly Growth Rate</strong>
                <small>Current active assumption</small>
              </div>

              <span className="rv-pill">
                {growth.toFixed(1)}%
              </span>

              <ChevronRight size={15} />
            </Link>

            <Link
              href="/model"
              className="rv-list-row"
              style={{ textDecoration: 'none' }}
            >
              <div>
                <strong>Monthly Revenue</strong>
                <small>Current model revenue</small>
              </div>

              <b>{money(revenue)}</b>

              <ChevronRight size={15} />
            </Link>

            <Link
              href="/model"
              className="rv-list-row"
              style={{ textDecoration: 'none' }}
            >
              <div>
                <strong>Monthly Expenses</strong>
                <small>Current operating cost</small>
              </div>

              <b>{money(expenses)}</b>

              <ChevronRight size={15} />
            </Link>

          </div>
        </Card>

      </div>
    </>
  );
}
