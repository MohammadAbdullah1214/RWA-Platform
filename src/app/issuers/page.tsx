"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useWallet } from "@/hooks/use-wallet";
import { useFactoryAssets } from "@/hooks/use-factory-assets";
import { ROLE_WALLETS } from "@/lib/zigchain-config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

type InvestorEntry = {
  address: string;
  label?: string;
};

type IssuerOption = {
  address: string;
  label: string;
};

const INVESTOR_STORAGE_KEY = "issuer_investor_watchlist";

export default function IssuersPage() {
  const { trexClient, address: walletAddress } = useWallet();
  const { assets, isLoading, error, refresh } = useFactoryAssets(trexClient);
  const [issuerRoles, setIssuerRoles] = useState<Record<string, string>>({});
  const [selectedIssuer, setSelectedIssuer] = useState<string>("");
  const [investors, setInvestors] = useState<InvestorEntry[]>([]);
  const [investorInput, setInvestorInput] = useState("");
  const [balances, setBalances] = useState<Record<string, Record<string, string>>>({});
  const [loadingBalances, setLoadingBalances] = useState(false);

  const issuerOptions = useMemo<IssuerOption[]>(() => {
    const options: IssuerOption[] = [];
    const seen = new Set<string>();

    const addOption = (address?: string | null, label?: string) => {
      if (!address) return;
      const normalized = address.toLowerCase();
      if (seen.has(normalized)) return;
      seen.add(normalized);
      options.push({
        address,
        label: label || address,
      });
    };

    addOption(ROLE_WALLETS.fundRealEstate, "Fund Real Estate");
    addOption(ROLE_WALLETS.fundStocks, "Fund Stocks");
    addOption(walletAddress, "Connected Wallet");

    assets.forEach((asset) => {
      const issuer = issuerRoles[asset.contract_address];
      if (issuer) {
        addOption(issuer, `Issuer ${issuer.slice(0, 10)}...`);
      }
    });

    return options;
  }, [assets, issuerRoles, walletAddress]);

  const filteredAssets = useMemo(() => {
    if (!selectedIssuer) return [];
    const target = selectedIssuer.toLowerCase();
    return assets.filter((asset) => {
      const issuer = issuerRoles[asset.contract_address];
      return issuer?.toLowerCase() === target;
    });
  }, [assets, issuerRoles, selectedIssuer]);

  useEffect(() => {
    if (!trexClient || assets.length === 0) {
      setIssuerRoles({});
      return;
    }

    let cancelled = false;
    const loadRoles = async () => {
      const entries = await Promise.all(
        assets.map(async (asset) => {
          try {
            const roles = await trexClient.getRoles(asset.contract_address);
            return [asset.contract_address, roles.issuer] as const;
          } catch {
            return [asset.contract_address, ""] as const;
          }
        })
      );

      if (!cancelled) {
        const next: Record<string, string> = {};
        entries.forEach(([contract, issuer]) => {
          if (issuer) next[contract] = issuer;
        });
        setIssuerRoles(next);
      }
    };

    loadRoles();
    return () => {
      cancelled = true;
    };
  }, [trexClient, assets]);

  useEffect(() => {
    const stored = localStorage.getItem(INVESTOR_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as InvestorEntry[];
        setInvestors(parsed);
        return;
      } catch {
        localStorage.removeItem(INVESTOR_STORAGE_KEY);
      }
    }

    if (walletAddress) {
      setInvestors([{ address: walletAddress, label: "Connected Wallet" }]);
    }
  }, [walletAddress]);

  useEffect(() => {
    if (investors.length === 0) {
      localStorage.removeItem(INVESTOR_STORAGE_KEY);
      return;
    }

    localStorage.setItem(INVESTOR_STORAGE_KEY, JSON.stringify(investors));
  }, [investors]);

  useEffect(() => {
    if (!trexClient || filteredAssets.length === 0 || investors.length === 0) {
      setBalances({});
      return;
    }

    let cancelled = false;
    const loadBalances = async () => {
      setLoadingBalances(true);
      try {
        const results = await Promise.all(
          filteredAssets.map(async (asset) => {
            const tokenBalances: Record<string, string> = {};
            await Promise.all(
              investors.map(async (investor) => {
                try {
                  const balance = await trexClient.getBalanceForToken(
                    asset.contract_address,
                    investor.address
                  );
                  tokenBalances[investor.address] = balance;
                } catch {
                  tokenBalances[investor.address] = "0";
                }
              })
            );
            return [asset.contract_address, tokenBalances] as const;
          })
        );

        if (!cancelled) {
          const next: Record<string, Record<string, string>> = {};
          results.forEach(([contract, tokenBalances]) => {
            next[contract] = tokenBalances;
          });
          setBalances(next);
        }
      } finally {
        if (!cancelled) {
          setLoadingBalances(false);
        }
      }
    };

    loadBalances();
    return () => {
      cancelled = true;
    };
  }, [trexClient, filteredAssets, investors]);

  useEffect(() => {
    if (!selectedIssuer && issuerOptions.length > 0) {
      setSelectedIssuer(issuerOptions[0].address);
    }
  }, [issuerOptions, selectedIssuer]);

  const handleAddInvestor = () => {
    const trimmed = investorInput.trim();
    if (!trimmed) return;
    if (investors.some((investor) => investor.address === trimmed)) {
      toast.info("Investor already added");
      setInvestorInput("");
      return;
    }

    setInvestors((prev) => [...prev, { address: trimmed }]);
    setInvestorInput("");
  };

  const handleRemoveInvestor = (address: string) => {
    setInvestors((prev) => prev.filter((entry) => entry.address !== address));
  };

  return (
    <div className="space-y-6">
      <Card className="border border-slate-200/70 bg-white/80 shadow-sm">
        <CardHeader>
          <CardTitle>Issuer Portfolio</CardTitle>
          <CardDescription>
            View assets issued by a specific issuer and see which investors hold their
            tokens. Ownership is derived from the watchlist addresses below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_2fr]">
            <div className="space-y-3">
              <div className="text-sm font-medium text-slate-700">
                Select Issuer
              </div>
              <Select value={selectedIssuer} onValueChange={setSelectedIssuer}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose issuer" />
                </SelectTrigger>
                <SelectContent>
                  {issuerOptions.map((issuer) => (
                    <SelectItem key={issuer.address} value={issuer.address}>
                      {issuer.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-xs text-slate-500">
                Issuers are derived from token roles. If you do not see an issuer,
                refresh assets or add their wallet manually.
              </div>
              <Button variant="outline" size="sm" onClick={() => refresh()}>
                Refresh assets
              </Button>
            </div>
            <div className="space-y-3">
              <div className="text-sm font-medium text-slate-700">
                Investor Watchlist
              </div>
              <div className="flex gap-2">
                <Input
                  value={investorInput}
                  onChange={(event) => setInvestorInput(event.target.value)}
                  placeholder="Add investor wallet address"
                />
                <Button onClick={handleAddInvestor}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {investors.length === 0 ? (
                  <span className="text-xs text-slate-500">
                    Add investor wallets to see who holds each asset.
                  </span>
                ) : (
                  investors.map((investor) => (
                    <Badge
                      key={investor.address}
                      variant="secondary"
                      className="flex items-center gap-2"
                    >
                      <span className="truncate max-w-[140px]">
                        {investor.label || investor.address}
                      </span>
                      <button
                        onClick={() => handleRemoveInvestor(investor.address)}
                        className="text-xs text-slate-500 hover:text-slate-700"
                        aria-label={`Remove ${investor.address}`}
                      >
                        x
                      </button>
                    </Badge>
                  ))
                )}
              </div>
              <div className="text-xs text-slate-500">
                The contracts do not expose a global holders list, so balances are
                checked against this list only.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-200/70 bg-white/80 shadow-sm">
        <CardHeader>
          <CardTitle>Issued Assets</CardTitle>
          <CardDescription>
            Assets linked to the selected issuer. Click an asset to review details.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-sm text-slate-500">Loading assets...</div>
          ) : error ? (
            <div className="text-sm text-red-600">Failed to load assets: {error}</div>
          ) : filteredAssets.length === 0 ? (
            <div className="text-sm text-slate-500">
              No assets found for this issuer.
            </div>
          ) : (
            <div className="space-y-6">
              {filteredAssets.map((asset) => {
                const tokenBalances = balances[asset.contract_address] || {};
                return (
                  <Card key={asset.contract_address} className="border border-slate-200/70">
                    <CardHeader className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">{asset.name}</CardTitle>
                          <CardDescription>
                            {asset.symbol} - Asset ID {asset.asset_id}
                          </CardDescription>
                        </div>
                        <Link
                          href={`/assets/${asset.asset_id}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View Asset
                        </Link>
                      </div>
                      <div className="text-xs text-slate-500">
                        Token Contract: {asset.contract_address}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Investor</TableHead>
                            <TableHead>Wallet</TableHead>
                            <TableHead className="text-right">Balance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {investors.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} className="text-sm text-slate-500">
                                Add investors to display balances.
                              </TableCell>
                            </TableRow>
                          ) : (
                            investors.map((investor) => {
                              const rawBalance = tokenBalances[investor.address] || "0";
                              return (
                                <TableRow key={investor.address}>
                                  <TableCell>
                                    {investor.label || "Investor"}
                                  </TableCell>
                                  <TableCell className="font-mono text-xs">
                                    {investor.address}
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {loadingBalances ? "..." : rawBalance}
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
