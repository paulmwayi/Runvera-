import { useState } from 'react';

export default function CashFlow({
  business,
  Header,
  Card,
  SectionTitle,
}: any) {
  const [period, setPeriod] = useState('Monthly');

  const revenue = Number(business?.revenue || 0);
  const expenses = Number(business?.expenses || 0);
  const cash = Number(business?.cash || 0);

  const netFlow = revenue - expenses;

  const futureCash = (months: number) =>
    cash + netFlow * months;

  const money = (value: number) =>
    `$${Math.round(value).toLocaleString()}`;

  return (
    <>
      <Header title="Cash Flow" back />

      <div className="rv-content">

        <div className="rv-page-head">
          <div className="rv-eyebrow">
            Forecast detail
          </div>

          <h1>Follow the cash.</h1>

          <p>
            Know what your operating rhythm makes possible.
          </p>
        </div>

        <div className="rv-tabs">
          {['Monthly', 'Quarterly'].map((x) => (
            <button
              key={x}
              className={`rv-tab ${
                period === x ? 'active' : ''
              }`}
              onClick={() => setPeriod(x)}
            >
              {x}
            </button>
          ))}
        </div>

        <div style={{ height: 14 }} />

        <Card>
          <SectionTitle
            title={`${period} net cash flow`}
            description="Based on current business model"
          />

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(6, 1fr)',
              alignItems: 'end',
              height: 165,
              gap: 9,
              borderBottom:
                '1px solid hsl(var(--border))',
            }}
          >
            {[1, 2, 3, 4, 5, 6].map((month) => {
              const magnitude = Math.min(
                100,
                Math.max(
                  8,
                  Math.abs(netFlow) /
                    Math.max(expenses, 1) *
                    100
                )
              );

              return (
                <div
                  key={month}
                  style={{
                    height: '100%',
                    display: 'flex',
                    alignItems: 'end',
                    flexDirection: 'column',
                    justifyContent: 'end',
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: `${magnitude}%`,
                      background:
                        netFlow < 0
                          ? 'hsl(var(--destructive) / .55)'
                          : 'hsl(var(--accent) / .8)',
                      borderRadius:
                        '6px 6px 2px 2px',
                    }}
                  />

                  <span
                    style={{
                      fontSize: 9,
                      color:
                        'hsl(var(--muted-foreground))',
                    }}
                  >
                    M{month}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        <div style={{ height: 14 }} />

        <div className="rv-grid rv-grid-2">

          <div className="rv-card rv-stat">
            <span>Opening cash</span>
            <b>{money(cash)}</b>
            <small>Current balance</small>
          </div>

          <div className="rv-card rv-stat">
            <span>Closing cash</span>
            <b>{money(futureCash(6))}</b>
            <small>After six periods</small>
          </div>

          <div className="rv-card rv-stat">
            <span>Cash in</span>
            <b
              style={{
                color:
                  'hsl(var(--accent))',
              }}
            >
              +{money(revenue * 6)}
            </b>
            <small>Revenue collected</small>
          </div>

          <div className="rv-card rv-stat">
            <span>Cash out</span>
            <b
              style={{
                color:
                  'hsl(var(--destructive))',
              }}
            >
              -{money(expenses * 6)}
            </b>
            <small>Operating spend</small>
          </div>

        </div>

        <div style={{ height: 14 }} />

        <Card>
          <SectionTitle
            title="Transaction summary"
            description="What is moving the balance"
          />

          <div className="rv-list">

            <div className="rv-list-row">
              <strong>Customer receipts</strong>

              <b
                style={{
                  color:
                    'hsl(var(--accent))',
                }}
              >
                +{money(revenue)}
              </b>
            </div>

            <div className="rv-list-row">
              <strong>Operating expenses</strong>

              <b
                style={{
                  color:
                    'hsl(var(--destructive))',
                }}
              >
                -{money(expenses)}
              </b>
            </div>

            <div className="rv-list-row">
              <strong>Net monthly flow</strong>

              <b
                style={{
                  color:
                    netFlow >= 0
                      ? 'hsl(var(--accent))'
                      : 'hsl(var(--destructive))',
                }}
              >
                {netFlow >= 0 ? '+' : '-'}
                {money(Math.abs(netFlow))}
              </b>
            </div>

          </div>
        </Card>

      </div>
    </>
  );
}
