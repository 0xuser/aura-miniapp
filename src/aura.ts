export interface PortfolioStrategiesResponse {
  address: string;
  portfolio: Array<{
    network: {
      name: string;
      chainId: string;
      platformId: string;
      explorerUrl: string;
      iconUrls: string[];
    };
    tokens: Array<{
      address: string;
      symbol: string;
      network: string;
      balance: number;
      balanceUSD: number;
    }>;
  }>;
  strategies: Array<{
    llm: {
      provider: string;
      model: string;
    };
    response: Array<{
      name: string;
      risk: string;
      actions: Array<{
        tokens: string;
        description: string;
        platforms: Array<{ name: string; url: string }>;
        networks: string[];
        operations: string[];
        apy: string;
      }>;
    }>;
    responseTime: number;
    error?: string;
  }>;
  cached: boolean;
  version: string;
}

export async function fetchPortfolioStrategies(params: {
  address: string;
  apiKey?: string;
  signal?: AbortSignal;
}): Promise<PortfolioStrategiesResponse> {
  const { address, apiKey, signal } = params;
  const url = new URL("https://aura.adex.network/api/portfolio/strategies");
  url.searchParams.set("address", address);
  if (apiKey) url.searchParams.set("apiKey", apiKey);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AURA API error ${res.status}: ${text || res.statusText}`);
  }

  return (await res.json()) as PortfolioStrategiesResponse;
}


