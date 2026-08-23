import { useState } from 'react';

export default function Funding({
  business,
  Header,
  Card,
  SectionTitle,
  Slider,
  notify,
}: any) {
  const [raise, setRaise] = useState(500);
  const [preMoney, setPreMoney] = useState(2500);
  const [optionPool, setOptionPool] = useState(10);
  const [scenario, setScenario] =
    useState('Pre-Seed SAFE');

  const revenue = Number(business?.revenue || 0);
  const expenses = Number(business?.expenses || 0);

  const postMoney = preMoney + raise;

  const investorOwnership =
    postMoney > 0
      ? (raise / postMoney) * 100
      : 0;

  const founderRetained =
    Math.max(
      0,
      100 -
        investorOwnership -
        optionPool
    );

  const runwayBuffer =
    expenses > revenue
      ? raise * 1000 /
        (expenses - revenue)
      : 0;

  return (
    <>
      <Header title="Funding Planner" />

      <div className="rv-content">

        <div className="rv-segment">
          {[
            'Pre-Seed SAFE',
            'Seed Lead',
            'Bridge',
          ].map((x) => (
            <button
              key={x}
              className={
                scenario === x
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setScenario(x)
              }
            >
              {x}
            </button>
          ))}
        </div>

        <div style={{ height: 14 }} />

        <Card>
          <SectionTitle
            title="Post-Round Cap Table"
            description="Ownership after this round"
            action={
              <span className="rv-pill">
                {founderRetained.toFixed(1)}% Founder
              </span>
            }
          />

          <div className="rv-capbar">
            <span />
            <span />
            <span />
          </div>

          <div className="rv-cap-legend">
            <span>
              <i />
              Founders: {founderRetained.toFixed(1)}%
            </span>

            <span>
              <i className="green" />
              Investors: {investorOwnership.toFixed(1)}%
            </span>

            <span>
              <i className="amber" />
              Pool: {optionPool}%
            </span>
          </div>
        </Card>

        <div style={{ height: 14 }} />

        <div className="rv-grid rv-grid-2">

          <div className="rv-card rv-stat">
            <span>Post-Money Valuation</span>

            <b>
              ${(postMoney / 1000).toFixed(1)}M
            </b>

            <small>
              Pre-money: $
              {(preMoney / 1000).toFixed(1)}M
            </small>
          </div>

          <div className="rv-card rv-stat">
            <span>Target Capital Raise</span>

            <b>${raise}k</b>

            <small>
              Dilution:
              {' '}
              {investorOwnership.toFixed(1)}%
            </small>
          </div>

          <div className="rv-card rv-stat">
            <span>Founder Retained</span>

            <b>
              {founderRetained.toFixed(1)}%
            </b>

            <small>
              Post-round ownership
            </small>
          </div>

          <div className="rv-card rv-stat">
            <span>New Runway Buffer</span>

            <b>
              +{runwayBuffer.toFixed(1)} Mo
            </b>

            <small>
              Based on current burn
            </small>
          </div>

        </div>

        <div style={{ height: 14 }} />

        <Card>
          <SectionTitle
            title="Tune Round Terms"
            description={scenario}
          />

          <Slider
            label="Target Raise"
            value={raise}
            min={100}
            max={1500}
            step={50}
            display={`$${raise},000`}
            onChange={setRaise}
          />

          <Slider
            label="Pre-Money Valuation"
            value={preMoney}
            min={1000}
            max={10000}
            step={100}
            display={`$${(
              preMoney / 1000
            ).toFixed(1)}M`}
            onChange={setPreMoney}
          />

          <Slider
            label="Option Pool (ESOP)"
            value={optionPool}
            min={0}
            max={20}
            step={1}
            display={`${optionPool}%`}
            onChange={setOptionPool}
          />

          <button
            className="rv-button"
            style={{
              width: '100%',
              marginTop: 12,
            }}
            onClick={() =>
              notify(
                `${scenario} scenario saved`
              )
            }
          >
            Save Scenario
          </button>
        </Card>

      </div>
    </>
  );
}
