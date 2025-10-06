import sdk from "@farcaster/miniapp-sdk";
import { useEffect, useMemo, useState } from "react";
import { useAccount, useConnect } from "wagmi";
import { fetchPortfolioStrategies, type PortfolioStrategiesResponse } from "./aura";

function buildCastTextFromData(data: PortfolioStrategiesResponse) {
  const parts: string[] = [];
  parts.push("Aura insights for my wallet:");
  const flat = data.strategies.flatMap((s) => s.response || []);
  for (const r of flat.slice(0, 3)) {
    const first = r.actions?.[0];
    const tokens = first?.tokens || "";
    const apy = first?.apy ? ` | APY ${first.apy}` : "";
    const name = r.name || "Strategy";
    const risk = r.risk || "unknown";
    parts.push(`- ${name} (${risk}) ${tokens}${apy}`);
  }
  const appLink = "https://farcaster.xyz/miniapps/ZjU08KEPiEny/adex-aura-insights";
  const cta = `Try ${appLink} to get AI-generated earning strategies.`;
  let text = [...parts, cta].join("\n");
  if (text.length > 350) {
    const head = parts[0];
    const body = parts.slice(1).join("\n");
    const reserve = `\n${cta}`;
    const maxBody = Math.max(0, 350 - head.length - reserve.length - 6);
    const trimmedBody = body.length > maxBody ? body.slice(0, maxBody) + "..." : body;
    text = [head, trimmedBody, cta].join("\n");
  }
  return text;
}

function openCastComposer(data: PortfolioStrategiesResponse) {
  const text = buildCastTextFromData(data);
  const url = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (sdk as any)?.actions?.openUrl?.(url) ?? window.open(url, "_blank");
  } catch {
    window.open(url, "_blank");
  }
}

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
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const actions = (sdk as any)?.actions;
        if (actions?.addMiniApp) {
          await actions.addMiniApp();
        }
      } catch {
        // user may reject or domain may not match manifest; ignore silently
      }
    })();
  }, []);

  return (
    <div className="app stack-12">
      <img className="banner" src="/banner.png" alt="AdEx AURA banner" />
      <div className="card">
        AURA’s AI agent framework simplifies the Web3 experience by combining AI, onchain data, and real-time insights to deliver smart, personalized, and automated strategies. It monitors activity across Ethereum and Layer 2 networks — analyzing transactions, app usage, risk profiles, and fund movements — to suggest the most profitable next steps.
      </div>
      <ConnectMenu usd={usd} />
      <div className="divider" style={{ margin: "24px 0 8px" }} />
      <div className="footnote">
        Created by <a href="https://farcaster.xyz/onchainuser" target="_blank" rel="noreferrer">@onchainuser</a>, with no affiliation to <a href="https://www.adex.network/" target="_blank" rel="noreferrer">AdEx</a>.
      </div>
    </div>
  );
}

function ConnectMenu({ usd }: { usd: Intl.NumberFormat }) {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PortfolioStrategiesResponse | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const controller = useMemo(() => new AbortController(), []);

  // Re-enable fetching when address changes
  useEffect(() => {
    setHasFetched(false);
    setData(null);
    setError(null);
  }, [address]);

  async function handleFetch() {
    if (!address) return;
    setIsLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetchPortfolioStrategies({ address, signal: controller.signal });
      setData(res);
      setHasFetched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  }

  if (!isConnected) {
    return (
      <div className="card stack-12">
        <div className="heading">Connect your wallet to view Aura insights</div>
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
        <div className="row">
          <button
            className="btn btn-primary"
            type="button"
            onClick={handleFetch}
            disabled={isLoading || hasFetched}
            title={hasFetched ? "Already fetched" : undefined}
          >
            {isLoading ? "Fetching..." : "Get portfolio insights"}
          </button>
          <button
            className="btn"
            type="button"
            onClick={() => data && openCastComposer(data)}
            disabled={!data || data.strategies.length === 0}
            title={!data ? "Fetch strategies first" : undefined}
          >
            Share insights on Farcaster
          </button>
        </div>
        {error && <div style={{ color: "var(--negative)", marginTop: 8 }}>Error: {error}</div>}
      </div>
      {data && <StrategiesView data={data} usd={usd} />}
    </div>
  );
}

function StrategiesView({ data, usd }: { data: PortfolioStrategiesResponse; usd: Intl.NumberFormat }) {
  const [portfolioOpen, setPortfolioOpen] = useState(false);
  const [strategiesOpen, setStrategiesOpen] = useState(true);
  return (
    <div className="stack-12">
      <div className="card stack-8">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div className="heading">Portfolio</div>
          <button className="btn btn-ghost" type="button" onClick={() => setPortfolioOpen((v) => !v)}>
            {portfolioOpen ? "Hide" : "Show"}
          </button>
        </div>
        <div className="muted mono ellipsis" title={data.address} style={{ maxWidth: 520 }}>
          Address: {data.address}
        </div>
        {portfolioOpen && (
          <div className="grid">
            {(data.portfolio || []).map((p) => (
              <div key={p.network?.chainId || 'unknown'} className="card stack-8">
                <div className="row">
                  <div className="heading">{p.network?.name || 'Unknown Network'}</div>
                  <div className="muted">chainId {p.network?.chainId || 'N/A'}</div>
                </div>
                {(!p.tokens || p.tokens.length === 0) ? (
                  <div className="muted">No tokens</div>
                ) : (
                  <ul>
                    {p.tokens.map((t, idx) => (
                      <li key={`${p.network?.chainId || 'unknown'}:${t.address || idx}`}>
                        {t.symbol || 'Unknown'}: {t.balance || 0} ({usd.format(t.balanceUSD || 0)})
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card stack-8">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div className="heading">Strategies</div>
          <button className="btn btn-ghost" type="button" onClick={() => setStrategiesOpen((v) => !v)}>
            {strategiesOpen ? "Hide" : "Show"}
          </button>
        </div>
        {(!data.strategies || data.strategies.length === 0) ? (
          <div className="muted">No strategies</div>
        ) : (
          strategiesOpen && (
            <div className="stack-12">
              <div className="grid">
                {data.strategies.map((s, idx) => (
                  <div key={idx} className="card stack-8">
                    <div className="muted">LLM: {s.llm?.provider || 'Unknown'} / {s.llm?.model || 'Unknown'}</div>
                    {s.error && <div style={{ color: "var(--negative)" }}>Worker error: {s.error}</div>}
                    {(s.response || []).map((r, rIdx) => (
                      <div key={rIdx} className="stack-8">
                        <div>
                          Name: {r.name || 'Unknown Strategy'} | Risk: {r.risk || 'unknown'}
                        </div>
                        <ul>
                          {(r.actions || []).map((a, aIdx) => (
                            <li key={aIdx}>
                              <div>Tokens: {a.tokens || 'N/A'}</div>
                              <div>Description: {a.description || 'No description available'}</div>
                              <div>APY: {a.apy || 'N/A'}</div>
                              <div>Platforms: {(a.platforms || []).map((p) => p?.name || 'Unknown').join(", ")}</div>
                              <div>Networks: {(a.networks || []).join(", ")}</div>
                              <div>Operations: {(a.operations || []).join(", ")}</div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default App;
