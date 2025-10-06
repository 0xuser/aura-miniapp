import sdk from "@farcaster/miniapp-sdk";
import { useEffect, useMemo, useState } from "react";
import { useAccount, useConnect } from "wagmi";
import { fetchPortfolioStrategies, type PortfolioStrategiesResponse } from "./aura";

function App() {
  const usd = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    [],
  );
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  return (
    <div className="app stack-12">
      <div className="heading">Aura Mini App</div>
      <div className="muted">The AI agent framework for Web3</div>
      <ConnectMenu usd={usd} />
    </div>
  );
}

function ConnectMenu({ usd }: { usd: Intl.NumberFormat }) {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PortfolioStrategiesResponse | null>(null);
  const controller = useMemo(() => new AbortController(), []);

  async function handleFetch() {
    if (!address) return;
    setIsLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetchPortfolioStrategies({ address, signal: controller.signal });
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  }

  if (!isConnected) {
    return (
      <div className="card stack-12">
        <div className="heading">Connect your wallet</div>
        <button className="btn btn-primary" type="button" onClick={() => connect({ connector: connectors[0] })}>
          Connect
        </button>
      </div>
    );
  }

  return (
    <div className="stack-12">
      <div className="card">
        <div className="row">
          <div className="kpi">Connected</div>
          <div className="muted mono ellipsis" title={address} style={{ maxWidth: 360 }}>
            {address}
          </div>
        </div>
        <div className="divider" style={{ margin: "10px 0" }} />
        <button className="btn btn-primary" type="button" onClick={handleFetch} disabled={isLoading}>
          {isLoading ? "Fetching..." : "Get portfolio strategies"}
        </button>
        {error && <div style={{ color: "var(--negative)", marginTop: 8 }}>Error: {error}</div>}
      </div>
      {data && <StrategiesView data={data} usd={usd} />}
    </div>
  );
}

function StrategiesView({ data, usd }: { data: PortfolioStrategiesResponse; usd: Intl.NumberFormat }) {
  return (
    <div className="stack-12">
      <div className="card stack-8">
        <div className="heading">Portfolio</div>
        <div className="muted mono ellipsis" title={data.address} style={{ maxWidth: 520 }}>
          Address: {data.address}
        </div>
        <div className="grid">
          {data.portfolio.map((p) => (
            <div key={p.network.chainId} className="card stack-8">
              <div className="row">
                <div className="heading">{p.network.name}</div>
                <div className="muted">chainId {p.network.chainId}</div>
              </div>
              {p.tokens.length === 0 ? (
                <div className="muted">No tokens</div>
              ) : (
                <ul>
                  {p.tokens.map((t) => (
                    <li key={`${t.network}:${t.address}`}>
                      {t.symbol}: {t.balance} ({usd.format(t.balanceUSD || 0)})
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card stack-8">
        <div className="heading">Strategies</div>
        {data.strategies.length === 0 ? (
          <div className="muted">No strategies</div>
        ) : (
          <div className="grid">
            {data.strategies.map((s, idx) => (
              <div key={idx} className="card stack-8">
                <div className="muted">
                  LLM: {s.llm.provider} / {s.llm.model} (responseTime: {s.responseTime}ms)
                </div>
                {s.error && <div style={{ color: "var(--negative)" }}>Worker error: {s.error}</div>}
                {s.response.map((r, rIdx) => (
                  <div key={rIdx} className="stack-8">
                    <div>
                      Name: {r.name} | Risk: {r.risk}
                    </div>
                    <ul>
                      {r.actions.map((a, aIdx) => (
                        <li key={aIdx}>
                          <div>Tokens: {a.tokens}</div>
                          <div>Description: {a.description}</div>
                          <div>APY: {a.apy}</div>
                          <div>Platforms: {a.platforms.map((p) => p.name).join(", ")}</div>
                          <div>Networks: {a.networks.join(", ")}</div>
                          <div>Operations: {a.operations.join(", ")}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
