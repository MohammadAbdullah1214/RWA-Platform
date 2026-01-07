"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  FileText,
  Shield,
  TrendingUp,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { IssuanceForm } from "@/components/rwa/issuance-form";
import { ConnectWalletCard } from "@/components/wallet/connect-wallet-card";
import { useAssets } from "@/hooks/use-asets";
import { useWallet } from "@/hooks/use-wallet";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";

export default function IssuancePage() {
  const { address, trexClient, connectKeplr, isConnecting } = useWallet();
  const { canSeeIssuance, loading: permissionsLoading } = usePermissions({
    trexClient,
    walletAddress: address,
  });
  const { assets, loading } = useAssets({ trexClient, walletAddress: address });
  const [activeTab, setActiveTab] = useState("new");

  const recentIssuances = assets.slice(0, 3);
  const pendingIssuances = assets.filter(
    (asset) => asset.complianceStatus === "pending"
  );

  const stats = {
    totalIssued: assets.length,
    totalValue: assets.reduce((sum, asset) => sum + asset.underlyingValue, 0),
    pendingReview: pendingIssuances.length,
    avgTokenization:
      assets.length > 0
        ? assets.reduce((sum, asset) => {
            const supply = Number(asset.totalSupply) || 0;
            const tokenized = Number(asset.tokenizedAmount) || 0;
            return sum + (supply > 0 ? (tokenized / supply) * 100 : 0);
          }, 0) / assets.length
        : 0,
  };

  const handleQuickIssue = () => {
    toast.info("Quick issuance coming soon!");
  };

  // Show connect wallet prompt if not connected
  if (!address) {
    return (
      <ConnectWalletCard onConnect={connectKeplr} isConnecting={isConnecting} />
    );
  }

  if (!permissionsLoading && !canSeeIssuance) {
    return (
      <div className="space-y-6 p-8 glass-panel rounded-[22px]">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold text-red-800">
              Access Restricted
            </h2>
            <p className="text-sm text-red-700 mt-1">
              Only the factory admin wallet can create new tokenized assets.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8 glass-panel rounded-[22px]">
      {/* Factory Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">
                  Create Dedicated Token Contract
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  When you create a new asset, the Factory will instantiate a
                  dedicated CW3643 token contract for it. Each asset gets its
                  own independent token with unique symbol, supply, and
                  balances.
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3" />
                  <span>
                    CW-3643 compliant • Shared compliance infrastructure •
                    Individual token contracts
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Asset Issuance
            </h1>
            <p className="text-muted-foreground">
              Tokenize real-world assets on ZigChain with full compliance
            </p>
          </div>
          <Button
            onClick={handleQuickIssue}
            className="gap-2 bg-gradient-to-tr from-[#172E7F] to-[#2A5FA6]"
          >
            <Building2 className="h-4 w-4" />
            Quick Issue
          </Button>
        </div>

        <Alert>
          <AlertDescription>
            Factory admin creates new asset tokens here. Issuers mint and
            distribute tokens from the Token Admin page after issuance.
          </AlertDescription>
        </Alert>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white rounded-2xl">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Issued
                  </p>
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <p className="text-2xl font-bold">{stats.totalIssued}</p>
                <p className="text-xs text-muted-foreground">Assets</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-2xl">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Value
                  </p>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-2xl font-bold">
                  {formatCurrency(stats.totalValue)}
                </p>
                <p className="text-xs text-muted-foreground">Tokenized</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-2xl">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    Pending Review
                  </p>
                  <FileText className="h-4 w-4 text-yellow-500" />
                </div>
                <p className="text-2xl font-bold">{stats.pendingReview}</p>
                <p className="text-xs text-muted-foreground">
                  Awaiting approval
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-2xl">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    Avg Tokenization
                  </p>
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                </div>
                <p className="text-2xl font-bold">
                  {stats.avgTokenization.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">Of total supply</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Main Content */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="rounded-xl p-1">
          <TabsTrigger
            value="new"
            className="data-[state=active]:bg-gradient-to-tr data-[state=active]:from-[#172E7F] data-[state=active]:to-[#2A5FA6] data-[state=active]:text-white"
          >
            New Issuance
          </TabsTrigger>
          <TabsTrigger
            value="recent"
            className="data-[state=active]:bg-gradient-to-tr data-[state=active]:from-[#172E7F] data-[state=active]:to-[#2A5FA6] data-[state=active]:text-white"
          >
            Recent
          </TabsTrigger>
          <TabsTrigger
            value="pending"
            className="data-[state=active]:bg-gradient-to-tr data-[state=active]:from-[#172E7F] data-[state=active]:to-[#2A5FA6] data-[state=active]:text-white"
          >
            Pending Review
          </TabsTrigger>
          <TabsTrigger
            value="templates"
            className="data-[state=active]:bg-gradient-to-tr data-[state=active]:from-[#172E7F] data-[state=active]:to-[#2A5FA6] data-[state=active]:text-white"
          >
            Templates
          </TabsTrigger>
        </TabsList>

        {/* New Issuance Tab */}
        <TabsContent value="new" className="space-y-6">
          <Card className="bg-white rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Issue New Asset
              </CardTitle>
              <CardDescription>
                Complete the form below to tokenize a new real-world asset on
                ZigChain
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IssuanceForm />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Issuances Tab */}
        <TabsContent value="recent" className="space-y-6">
          <Card className="bg-white rounded-2xl">
            <CardHeader>
              <CardTitle>Recent Issuances</CardTitle>
              <CardDescription>
                Assets issued in the last 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading...</div>
              ) : recentIssuances.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No recent issuances found
                </div>
              ) : (
                <div className="space-y-4">
                  {recentIssuances.map((asset, index) => (
                    <motion.div
                      key={asset.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-md bg-primary/10">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{asset.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{asset.assetType}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatCurrency(asset.underlyingValue)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {asset.tokenizedAmount.toLocaleString()} tokens
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(asset.issuanceDate).toLocaleDateString()}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Review Tab */}
        <TabsContent value="pending" className="space-y-6">
          <Card className="bg-white rounded-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Pending Compliance Review
              </CardTitle>
              <CardDescription>
                Assets awaiting compliance approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingIssuances.length === 0 ? (
                <div className="text-center py-8">
                  <div className="h-12 w-12 mx-auto rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  </div>
                  <p className="text-muted-foreground">
                    All assets are compliant!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingIssuances.map((asset, index) => (
                    <motion.div
                      key={asset.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 rounded-lg border border-yellow-500/20 bg-yellow-500/5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-md bg-yellow-500/10">
                            <Shield className="h-5 w-5 text-yellow-500" />
                          </div>
                          <div>
                            <p className="font-medium">{asset.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Submitted{" "}
                              {new Date(
                                asset.issuanceDate
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Review Now
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card className="bg-white rounded-2xl">
            <CardHeader>
              <CardTitle>Issuance Templates</CardTitle>
              <CardDescription>
                Pre-configured templates for common asset types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    title: "Commercial Real Estate",
                    description: "Office buildings, shopping malls, hotels",
                    icon: Building2,
                    color: "bg-blue-500/10 text-blue-500",
                  },
                  {
                    title: "Commodities",
                    description: "Gold, oil, agricultural products",
                    icon: TrendingUp,
                    color: "bg-green-500/10 text-green-500",
                  },
                  {
                    title: "Corporate Bonds",
                    description: "Debt instruments, corporate loans",
                    icon: FileText,
                    color: "bg-purple-500/10 text-purple-500",
                  },
                ].map((template, index) => (
                  <motion.div
                    key={template.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -4 }}
                    className="p-4 rounded-lg border cursor-pointer hover:bg-accent/50"
                    onClick={() =>
                      toast.info(`Loading ${template.title} template`)
                    }
                  >
                    <div
                      className={`p-2 rounded-md ${template.color} w-fit mb-3`}
                    >
                      <template.icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-medium mb-2">{template.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {template.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Help Section */}
      <Card className="bg-white rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Need Help?</CardTitle>
          <CardDescription>Get assistance with asset issuance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="font-medium">Documentation</p>
              <p className="text-sm text-muted-foreground">
                Read our comprehensive issuance guide
              </p>
              <Button variant="link" className="p-0 h-auto">
                View Docs →
              </Button>
            </div>
            <div className="space-y-2">
              <p className="font-medium">Compliance Support</p>
              <p className="text-sm text-muted-foreground">
                Get help with regulatory requirements
              </p>
              <Button variant="link" className="p-0 h-auto">
                Contact Support →
              </Button>
            </div>
            <div className="space-y-2">
              <p className="font-medium">Legal Templates</p>
              <p className="text-sm text-muted-foreground">
                Download legal document templates
              </p>
              <Button variant="link" className="p-0 h-auto">
                Download →
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
