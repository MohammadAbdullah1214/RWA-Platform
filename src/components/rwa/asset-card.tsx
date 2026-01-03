"use client";

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Building2, TrendingUp, Shield, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { RWAAsset } from "@/types/rwa";

interface AssetCardProps {
  asset: RWAAsset;
  className?: string;
}

export function AssetCard({ asset, className }: AssetCardProps) {
  const router = useRouter();
  const statusColors = {
    compliant: "bg-green-100 text-green-700 border-green-200",
    pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
    "non-compliant": "bg-red-100 text-red-700 border-red-200",
    "under-review": "bg-blue-100 text-blue-700 border-blue-200",
  };

  const typeIcons = {
    "real-estate": Building2,
    commodity: TrendingUp,
    equity: Users,
    debt: Shield,
    art: Building2,
    "intellectual-property": Building2,
  } as const;

  const Icon = typeIcons[asset.assetType] || Building2;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -1 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          "overflow-hidden group bg-white rounded-2xl border-gray-200",
          className
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <motion.div
                whileHover={{ rotate: 10 }}
                className="p-2 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100"
              >
                <Icon className="h-5 w-5 text-blue-600" />
              </motion.div>
              <div>
                <h3 className="font-semibold text-lg">{asset.name}</h3>
                <p className="text-sm text-gray-500">{asset.location}</p>
              </div>
            </div>
            <Badge
              className={cn("border", statusColors[asset.complianceStatus])}
            >
              {asset.complianceStatus}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Stat
                label="Value"
                value={`$${asset.underlyingValue.toLocaleString()}`}
              />
              <Stat label="Symbol" value={asset.symbol} />
            </div>

            {/* Token Contract Badge */}
            <div className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 border border-gray-200">
              <Shield className="h-4 w-4 text-blue-600" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500">Token Contract</p>
                <p
                  className="font-mono text-xs truncate text-gray-700"
                  title={asset.tokenContractAddress}
                >
                  {asset.tokenContractAddress.slice(0, 12)}...
                  {asset.tokenContractAddress.slice(-8)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-4">
          <div className="flex w-full gap-2">
            <motion.button
              whileHover={{ scale: 1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push(`/assets/${asset.id}`)}
              className="flex-1 py-2 px-4 rounded-lg bg-gradient-to-tr from-[#172E7F] to-[#2A5FA6] text-white text-sm font-medium"
            >
              View Details
            </motion.button>
            <motion.button
              whileHover={{ scale: 1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const url = `/manage?asset=${encodeURIComponent(
                  asset.id
                )}&symbol=${encodeURIComponent(asset.symbol)}`;
                console.log("Navigating to:", url);
                console.log("Asset ID:", asset.id, "Symbol:", asset.symbol);
                router.push(url);
              }}
              className="flex-1 py-2 px-4 rounded-lg bg-[#cba135] text-white text-sm font-medium"
            >
              Trade
            </motion.button>
          </div>
        </CardFooter>

        {/* Hover effect overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 pointer-events-none rounded-[20px]"
          initial={false}
          transition={{ duration: 0.3 }}
        />
      </Card>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-semibold text-gray-900">{value}</p>
    </div>
  );
}
