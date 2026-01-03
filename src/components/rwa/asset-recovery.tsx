'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAssets } from '@/hooks/use-asets';
import { useWallet } from '@/hooks/use-wallet';
import { toast } from 'sonner';

export function AssetRecovery() {
  const { address, trexClient } = useWallet();
  const { addAssetToCache } = useAssets({ trexClient, walletAddress: address });
  const [assetId, setAssetId] = useState('');

  const handleRecover = () => {
    const id = parseInt(assetId);
    if (isNaN(id) || id < 0) {
      toast.error('Please enter a valid asset ID');
      return;
    }
    addAssetToCache(id);
    setAssetId('');
  };

  if (!address) {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader>
        <CardTitle className="text-sm">🔧 Asset Recovery Tool</CardTitle>
        <CardDescription className="text-xs">
          If you created assets before but don't see them, add their ID here
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="asset-id" className="text-xs">Asset ID</Label>
          <div className="flex gap-2">
            <Input
              id="asset-id"
              type="number"
              placeholder="e.g., 0, 1, 2..."
              value={assetId}
              onChange={(e) => setAssetId(e.target.value)}
              className="text-sm"
            />
            <Button onClick={handleRecover} size="sm">
              Add
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          💡 Check your transaction history for the asset ID from your previous creation
        </p>
      </CardContent>
    </Card>
  );
}
