import sdk from "@farcaster/miniapp-sdk";
import { useEffect, useMemo, useState } from "react";
import { useAccount, useConnect } from "wagmi";
import { fetchPortfolioStrategies, type PortfolioStrategiesResponse } from "./aura";

function App() {
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  return (
    <>
      <div>Mini App + Vite + TS + React + Wagmi xd</div>
      <ConnectMenu />
    </>
  );
}

function ConnectMenu() {
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
      <button type="button" onClick={() => connect({ connector: connectors[0] })}>
        Connect
      </button>
    );
  }

  return (
    <>
      <div>Connected account:</div>
      <div>{address}</div>
      <button type="button" onClick={handleFetch} disabled={isLoading}>
        {isLoading ? "Fetching..." : "Get portfolio strategies"}
      </button>
      {error && (
        <div style={{ color: "#ff6b6b" }}>
          Error: {error}
        </div>
      )}
      {data && <StrategiesView data={data} />}
    </>
  );
}

function StrategiesView({ data }: { data: PortfolioStrategiesResponse }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div>Address: {data.address}</div>
      <div style={{ marginTop: 8 }}>Portfolio balances</div>
      {data.portfolio.map((p) => (
        <div key={p.network.chainId} style={{ padding: 8, border: "1px solid #444", marginTop: 6 }}>
          <div>
            Network: {p.network.name} (chainId: {p.network.chainId})
          </div>
          {p.tokens.length === 0 ? (
            <div>No tokens</div>
          ) : (
            <ul>
              {p.tokens.map((t) => (
                <li key={`${t.network}:${t.address}`}>
                  {t.symbol}: {t.balance} (${t.balanceUSD})
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}

      <div style={{ marginTop: 12 }}>Strategies</div>
      {data.strategies.length === 0 ? (
        <div>No strategies</div>
      ) : (
        data.strategies.map((s, idx) => (
          <div key={idx} style={{ padding: 8, border: "1px solid #444", marginTop: 6 }}>
            <div>
              LLM: {s.llm.provider} / {s.llm.model} (responseTime: {s.responseTime}ms)
            </div>
            {s.error && <div style={{ color: "#ff6b6b" }}>Worker error: {s.error}</div>}
            {s.response.map((r, rIdx) => (
              <div key={rIdx} style={{ marginTop: 6 }}>
                <div>
                  Name: {r.name} | Risk: {r.risk}
                </div>
                <ul>
                  {r.actions.map((a, aIdx) => (
                    <li key={aIdx}>
                      <div>Tokens: {a.tokens}</div>
                      <div>Description: {a.description}</div>
                      <div>APY: {a.apy}</div>
                      <div>
                        Platforms: {a.platforms.map((p) => p.name).join(", ")}
                      </div>
                      <div>Networks: {a.networks.join(", ")}</div>
                      <div>Operations: {a.operations.join(", ")}</div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}

export default App;
