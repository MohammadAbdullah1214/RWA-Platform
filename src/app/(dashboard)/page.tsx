"use client";

import { motion } from "motion/react";
import {
  TrendingUp,
  Users,
  Building2,
  Shield,
  RefreshCw,
  Wallet,
  UserCheck,
} from "lucide-react";
import { AssetCard } from "@/components/rwa/asset-card";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/use-wallet";
import { useAssets } from "@/hooks/use-asets";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMemo, useEffect } from "react";
import Link from "next/link";
import { ROLE_WALLETS } from "@/lib/zigchain-config";
import { usePermissions } from "@/hooks/use-permissions";

export default function DashboardPage() {
  const { isConnected, connectKeplr, address, trexClient } = useWallet();
  const {
    canSeeAdminIdentities,
    canSeeCompliance,
    canSeeIssuance,
    canSeeKycProvider,
  } = usePermissions({ trexClient, walletAddress: address });
  const { assets, loading, error, loadAssets } = useAssets({
    trexClient,
    walletAddress: address,
  });

  // Load assets on mount (works without wallet connection)
  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  // Calculate portfolio stats
  const portfolioStats = useMemo(() => {
    const totalAssets = assets.length;
    const totalValue = assets.reduce(
      (sum, asset) => sum + asset.underlyingValue,
      0
    );
    const compliantAssets = assets.filter(
      (a) => a.complianceStatus === "compliant"
    ).length;

    return {
      totalAssets,
      totalValue,
      compliantAssets,
      complianceRate:
        totalAssets > 0 ? (compliantAssets / totalAssets) * 100 : 0,
    };
  }, [assets]);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          TREX Security Token on{" "}
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            ZigChain
          </span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          CW-3643 compatible multi-token architecture with full identity
          registry and compliance modules
        </p>

        {/* Factory Info */}
        {isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto"
          >
            <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
              <Shield className="h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">
                  Factory Deployed:
                </span>{" "}
                Each asset gets its own CW3643 token contract
              </p>
            </div>
          </motion.div>
        )}

        {!isConnected && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              size="lg"
              onClick={connectKeplr}
              className="px-8 py-6 text-lg"
            >
              Connect Keplr Wallet
            </Button>
          </motion.div>
        )}

        {isConnected && (
          <div className="flex items-center justify-center gap-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Connected: {address?.slice(0, 10)}...{address?.slice(-6)}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={loadAssets}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        )}
      </motion.div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Role-Based Flow */}
      <section className="space-y-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Choose Your Role</h2>
          <p className="text-muted-foreground">
            Connect the correct wallet for each role and follow the steps below
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RoleCard
            title="Platform Owner"
            icon={Shield}
            wallet={ROLE_WALLETS.platformOwner}
            steps={[
              "Set required claim topics (KYC/AML)",
              "Whitelist trusted issuers in TIR",
              "Approve identities and manage compliance",
            ]}
            actions={[
              {
                label: "Admin Identities",
                href: "/admin/identities",
                visible: canSeeAdminIdentities,
              },
              {
                label: "Compliance",
                href: "/compliance",
                visible: canSeeCompliance,
              },
            ]}
          />
          <RoleCard
            title="KYC Issuer"
            icon={UserCheck}
            wallet={ROLE_WALLETS.kycIssuer}
            steps={[
              "Review investor applications",
              "Create OnchainID and add claims",
              "Register identity in IR",
            ]}
            actions={[
              {
                label: "KYC Provider",
                href: "/kyc-provider",
                visible: canSeeKycProvider,
              },
              { label: "Identity", href: "/identity", visible: true },
            ]}
          />
          <RoleCard
            title="Fund Issuer"
            icon={Building2}
            wallet={[ROLE_WALLETS.fundRealEstate, ROLE_WALLETS.fundStocks]}
            steps={[
              "Create a token via Factory (Issuance)",
              "Select your token in Manage",
              "Mint tokens to verified investors",
            ]}
            actions={[
              { label: "Issuance", href: "/issuance", visible: canSeeIssuance },
              { label: "Manage Tokens", href: "/manage" },
            ]}
          />
          <RoleCard
            title="Investor"
            icon={Users}
            wallet="Your wallet"
            steps={[
              "Submit KYC application",
              "Wait for issuer claims and IR registration",
              "Trade or transfer tokens",
            ]}
            actions={[
              { label: "Identity", href: "/identity" },
              { label: "Assets", href: "/assets" },
            ]}
          />
        </div>
      </section>

      {/* Stats Overview */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Building2}
            title="Total Assets"
            value={portfolioStats.totalAssets.toString()}
            description="Tokenized assets available"
            delay={0}
          />
          <StatCard
            icon={TrendingUp}
            title="Portfolio Value"
            value={`$${portfolioStats.totalValue.toLocaleString()}`}
            description="Total underlying value"
            delay={0.1}
          />
          <StatCard
            icon={Shield}
            title="Compliance Rate"
            value={`${portfolioStats.complianceRate.toFixed(0)}%`}
            description={`${portfolioStats.compliantAssets} of ${portfolioStats.totalAssets} compliant`}
            delay={0.2}
          />
          <StatCard
            icon={Wallet}
            title="Multi-Token"
            value="Active"
            description="ERC-3643 architecture"
            delay={0.3}
          />
        </div>
      )}

      {/* Assets Display */}
      {assets.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              {isConnected ? "Your Assets" : "Available Assets"}
            </h2>
            <div className="flex items-center gap-4">
              <Link href="/assets">
                <Button variant="outline">View All Assets</Button>
              </Link>
              {isConnected && (
                <Link href="/manage">
                  <Button>Manage Tokens</Button>
                </Link>
              )}
            </div>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assets.slice(0, 6).map((asset) => (
                <AssetCard key={asset.id} asset={asset} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Empty State */}
      {!loading && assets.length === 0 && (
        <section>
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">No Assets Yet</h3>
            <p className="text-muted-foreground mb-6">
              {isConnected
                ? "Start by creating your first tokenized asset"
                : "Connect your wallet to create tokenized assets"}
            </p>
            {isConnected ? (
              <Link href="/issuance">
                <Button size="lg">Create Asset</Button>
              </Link>
            ) : (
              <Button size="lg" onClick={connectKeplr}>
                Connect Wallet
              </Button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function RoleCard({
  title,
  icon: Icon,
  wallet,
  steps,
  actions,
}: {
  title: string;
  icon: any;
  wallet: string | string[];
  steps: string[];
  actions: Array<{ label: string; href: string; visible?: boolean }>;
}) {
  const walletLines = Array.isArray(wallet) ? wallet : [wallet];
  const formattedWallets = walletLines.map((entry) =>
    entry && entry.length > 20
      ? `${entry.slice(0, 12)}...${entry.slice(-8)}`
      : entry
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <span className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-4 w-4 text-primary" />
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs text-muted-foreground">
          <div>Connect wallet:</div>
          {formattedWallets.map((entry) => (
            <div key={entry} className="font-mono text-foreground">
              {entry}
            </div>
          ))}
        </div>
        <ul className="text-sm text-muted-foreground space-y-1">
          {steps.map((step) => (
            <li key={step}>- {step}</li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2 pt-2">
          {actions
            .filter((action) => action.visible !== false)
            .map((action) => (
              <Link key={action.href} href={action.href}>
                <Button size="sm" variant="outline">
                  {action.label}
                </Button>
              </Link>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
  description,
  delay,
}: {
  icon: any;
  title: string;
  value: string;
  description: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <div className="p-6 rounded-xl border bg-card hover:bg-accent/50 transition-colors">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
