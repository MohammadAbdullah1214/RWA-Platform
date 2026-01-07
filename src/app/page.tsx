"use client";

import { Sidebar } from "@/components/layout/siderbar";
import { StatsCard } from "@/components/ui/stats-card";
import { AssetAnalyticsChart } from "@/components/ui/asset-analytics-chart";
import { AssetAnalyticsPieChart } from "@/components/rwa/asset-analytics-piechart";
import { AssetsList } from "@/components/rwa/assets-list";
import { TopTransactions } from "@/components/rwa/top-transactions";
import { useWallet } from "@/hooks/use-wallet";
import { useAssets } from "@/hooks/use-asets";
import { formatCurrency } from "@/lib/utils";

export default function Page() {
  const { address, trexClient } = useWallet();
  const { assets, loading } = useAssets({ trexClient, walletAddress: address });

  return (
    <div className="flex bg-white">
      <Sidebar />
      {/* Main Content Area */}
      <main className="flex-1 glass-panel rounded-[22px]">
        {/* Placeholder for the Dashboard content which will be implemented next */}
        <div className="p-8">
          <h1 className="text-3xl font-semibold mb-6">Market Overview</h1>
          <div className="mb-6 rounded-2xl border border-slate-200/70 bg-white/70 p-4 text-sm text-slate-700 shadow-sm">
            Investors can browse markets and assets here. Admin and issuer
            actions live under Token Admin and Issuance.
          </div>
          <div className="flex flex-row items-center justify-between gap-2">
            <StatsCard
              heading="Distibuted Asset Value"
              value={formatCurrency(
                assets.reduce((sum, asset) => sum + asset.underlyingValue, 0)
              )}
              className="bg-linear-to-tr from-[#172E7F] to-[#2A5FA6] text-white"
            />
            <StatsCard heading="Total Asset Holders" value="500" />
            <StatsCard heading="Active Users" value="3,184" />
            <StatsCard
              heading="Total Assets"
              value={assets.length.toString()}
            />
            <StatsCard heading="Active Issuers" value="50" />
          </div>

          <div className="pt-2 flex flex-row items-center justify-between gap-2">
            <div className="glass-card rounded-2xl p-6 w-[60%] flex flex-col">
              <h1 className="text-2xl font-semibold mb-6">Asset Analytics</h1>
              <AssetAnalyticsChart />
            </div>
            <div className="glass-card rounded-2xl p-6 w-[40%] flex flex-col">
              <h1 className="text-2xl font-semibold mb-6">
                Holding Catagories
              </h1>
              <AssetAnalyticsPieChart />
            </div>
          </div>

          <div className="pt-2 flex flex-row items-stretch gap-2">
            <div className="w-[40%] glass-card rounded-[20px] p-6 flex flex-col">
              <h1 className="text-2xl font-semibold mb-6">Tokenized Assets</h1>
              <div className="flex-1 min-h-0 overflow-auto">
                <AssetsList assets={assets} loading={loading} limit={10} />
              </div>
            </div>
            <div className="w-[60%] glass-card rounded-[20px] p-6 flex flex-col">
              <h1 className="text-2xl font-semibold mb-6">Top Transactions</h1>
              <div className="flex-1 min-h-0 overflow-auto">
                <TopTransactions limit={10} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
