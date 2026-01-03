"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useWallet } from "@/hooks/use-wallet";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ArrowDownCircle,
  ArrowUpCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import type { RedemptionRequest } from "@/lib/trex-client";
import type { PermissionsState } from "@/hooks/use-permissions";

interface IssuanceRedemptionManagerProps {
  tokenContract: string;
  permissions?: PermissionsState;
  onUpdate?: () => void;
}

/**
 * Issuance and Redemption Manager
 *
 * Provides two-step workflow for:
 * - Investors requesting redemption of tokens
 * - Issuers approving redemption requests
 * - Issuers issuing new tokens for assets
 */
export function IssuanceRedemptionManager({
  tokenContract,
  permissions,
  onUpdate,
}: IssuanceRedemptionManagerProps) {
  const { trexClient, address } = useWallet();
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<RedemptionRequest[]>([]);
  const [roles, setRoles] = useState<{
    owner: string;
    issuer: string;
    controller: string;
  } | null>(null);

  // Request redemption form
  const [assetId, setAssetId] = useState("1");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  // Issue asset form
  const [issueAssetId, setIssueAssetId] = useState("1");
  const [issueRecipient, setIssueRecipient] = useState("");
  const [issueAmount, setIssueAmount] = useState("");

  useEffect(() => {
    loadData();
  }, [trexClient, tokenContract]);

  const loadData = async () => {
    if (!trexClient || !tokenContract) return;

    try {
      setLoading(true);

      // Load redemption requests
      const reqs = await trexClient.getRedemptionRequests(
        undefined,
        undefined,
        tokenContract
      );
      setRequests(reqs);

      // Load roles to check permissions
      const rolesData = await trexClient.getRoles(tokenContract);
      setRoles(rolesData);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestRedemption = async () => {
    if (!trexClient || !tokenContract || !amount) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      setLoading(true);
      toast.loading("Submitting redemption request...");

      const txHash = await trexClient.requestRedemption(
        parseInt(assetId),
        amount,
        reason || undefined,
        tokenContract
      );

      toast.dismiss();
      toast.success(`Redemption request submitted`, {
        description: `Request #${
          txHash.requestId
        } - Tx: ${txHash.txHash.substring(0, 8)}...`,
      });

      // Reset form
      setAmount("");
      setReason("");

      // Reload data
      await loadData();
      onUpdate?.();
    } catch (error: any) {
      toast.dismiss();
      console.error("Request redemption failed:", error);

      if (error.message?.includes("Unauthorized")) {
        toast.error("Unauthorized", {
          description: "Only token holders can request redemption",
        });
      } else if (error.message?.includes("Insufficient balance")) {
        toast.error("Insufficient balance", {
          description: "You do not have enough tokens to redeem",
        });
      } else {
        toast.error("Request failed", {
          description: error.message || "Unknown error occurred",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRedemption = async (requestId: number) => {
    if (!trexClient || !tokenContract) return;

    try {
      setLoading(true);
      toast.loading("Approving redemption...");

      const txHash = await trexClient.approveRedemption(
        requestId,
        tokenContract
      );

      toast.dismiss();
      toast.success(`Redemption approved`, {
        description: `Request #${requestId} processed. Tx: ${txHash.substring(
          0,
          8
        )}...`,
      });

      await loadData();
      onUpdate?.();
    } catch (error: any) {
      toast.dismiss();
      console.error("Approve redemption failed:", error);

      if (error.message?.includes("Unauthorized")) {
        toast.error("Unauthorized", {
          description: "Only the issuer can approve redemptions",
        });
      } else {
        toast.error("Approval failed", {
          description: error.message || "Unknown error occurred",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleIssueAsset = async () => {
    if (!trexClient || !tokenContract || !issueRecipient || !issueAmount) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!issueRecipient.startsWith("zig1")) {
      toast.error("Invalid recipient address", {
        description: "Address must start with zig1",
      });
      return;
    }

    try {
      setLoading(true);
      toast.loading("Issuing tokens...");

      const txHash = await trexClient.issueAsset(
        parseInt(issueAssetId),
        issueRecipient,
        issueAmount,
        tokenContract
      );

      toast.dismiss();
      toast.success(`Tokens issued`, {
        description: `${issueAmount} tokens to ${issueRecipient.substring(
          0,
          12
        )}... Request #${txHash.requestId} - Tx: ${txHash.txHash.substring(
          0,
          8
        )}...`,
      });

      // Reset form
      setIssueRecipient("");
      setIssueAmount("");

      await loadData();
      onUpdate?.();
    } catch (error: any) {
      toast.dismiss();
      console.error("Issue asset failed:", error);

      if (error.message?.includes("Unauthorized")) {
        toast.error("Unauthorized", {
          description: "Only the issuer can issue new tokens",
        });
      } else if (error.message?.includes("Not verified")) {
        toast.error("Recipient not verified", {
          description:
            "Recipient must have verified identity to receive tokens",
        });
      } else {
        toast.error("Issuance failed", {
          description: error.message || "Unknown error occurred",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const isIssuer =
    permissions?.isTokenIssuer ??
    (roles && address && roles.issuer.toLowerCase() === address.toLowerCase());
  const isController =
    permissions?.isTokenController ??
    (roles &&
      address &&
      roles.controller.toLowerCase() === address.toLowerCase());
  const canApprove = !!isController;

  const pendingRequests = requests.filter((r) => !r.approved);
  const approvedRequests = requests.filter((r) => r.approved);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <ArrowDownCircle className="h-6 w-6 text-orange-500" />
            Issuance & Redemption
          </CardTitle>
          <CardDescription>
            Two-step workflow for issuing new tokens and redeeming existing
            tokens
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="redemption" className="w-full">
            <TabsList className="w-full grid grid-cols-3 p-1 bg-[#F1F2F4] rounded-xl h-auto">
              <TabsTrigger
                value="redemption"
                className="rounded-lg data-[state=active]:bg-linear-to-tr data-[state=active]:from-[#172E7F] data-[state=active]:to-[#2A5FA6] data-[state=active]:text-white transition-all py-2.5"
              >
                Request Redemption
              </TabsTrigger>
              <TabsTrigger
                value="pending"
                className="rounded-lg data-[state=active]:bg-linear-to-tr data-[state=active]:from-[#172E7F] data-[state=active]:to-[#2A5FA6] data-[state=active]:text-white transition-all py-2.5"
              >
                Pending Requests{" "}
                {pendingRequests.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 bg-white/20 text-current hover:bg-white/30"
                  >
                    {pendingRequests.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="issue"
                className="rounded-lg data-[state=active]:bg-linear-to-tr data-[state=active]:from-[#172E7F] data-[state=active]:to-[#2A5FA6] data-[state=active]:text-white transition-all py-2.5"
              >
                Issue Tokens
              </TabsTrigger>
            </TabsList>

            {/* Request Redemption Tab */}
            <TabsContent value="redemption" className="space-y-4">
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Submit a redemption request to convert your tokens back to the
                  underlying asset. The issuer must approve your request before
                  tokens are burned.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="assetId">Asset ID</Label>
                    <Input
                      id="assetId"
                      type="number"
                      value={assetId}
                      onChange={(e) => setAssetId(e.target.value)}
                      placeholder="1"
                      disabled={loading}
                      className="bg-gray-50 border-gray-200 focus:bg-white transition-colors h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="1000000"
                      disabled={loading}
                      className="bg-gray-50 border-gray-200 focus:bg-white transition-colors h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Reason (Optional)</Label>
                  <Textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Explain why you need to redeem tokens..."
                    disabled={loading}
                    rows={3}
                    className="bg-gray-50 border-gray-200 focus:bg-white transition-colors resize-none"
                  />
                </div>

                <Button
                  onClick={handleRequestRedemption}
                  disabled={loading || !amount}
                  className="w-full bg-linear-to-tr from-[#172E7F] to-[#2A5FA6] hover:opacity-90 transition-opacity"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <ArrowDownCircle className="mr-2 h-4 w-4" />
                      Request Redemption
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            {/* Pending Requests Tab */}
            <TabsContent value="pending" className="space-y-4">
              {!canApprove && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Only the controller can approve redemption requests.
                  </AlertDescription>
                </Alert>
              )}

              {pendingRequests.length === 0 ? (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    No pending redemption requests at this time.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Requester</TableHead>
                        <TableHead>Asset ID</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-mono">
                            #{request.id}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {request.requester.substring(0, 12)}...
                          </TableCell>
                          <TableCell>{request.assetId}</TableCell>
                          <TableCell className="font-mono">
                            {request.amount}
                          </TableCell>
                          <TableCell className="max-w-50 truncate">
                            {request.reason || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              <Clock className="mr-1 h-3 w-3" />
                              Pending
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {canApprove && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button size="sm" disabled={loading}>
                                    <CheckCircle2 className="mr-1 h-3 w-3" />
                                    Approve
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>
                                      Approve Redemption Request
                                    </DialogTitle>
                                    <DialogDescription>
                                      This will burn {request.amount} tokens
                                      from {request.requester}
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-2 py-4">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                      <span className="text-muted-foreground">
                                        Request ID:
                                      </span>
                                      <span className="font-mono">
                                        #{request.id}
                                      </span>
                                      <span className="text-muted-foreground">
                                        Asset ID:
                                      </span>
                                      <span>{request.assetId}</span>
                                      <span className="text-muted-foreground">
                                        Amount:
                                      </span>
                                      <span className="font-mono">
                                        {request.amount}
                                      </span>
                                      {request.reason && (
                                        <>
                                          <span className="text-muted-foreground">
                                            Reason:
                                          </span>
                                          <span className="col-span-1">
                                            {request.reason}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                    <Alert
                                      variant="destructive"
                                      className="mt-4"
                                    >
                                      <AlertTriangle className="h-4 w-4" />
                                      <AlertDescription>
                                        This action will permanently burn
                                        tokens. Make sure you've verified the
                                        underlying asset transfer before
                                        approving.
                                      </AlertDescription>
                                    </Alert>
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      onClick={() =>
                                        handleApproveRedemption(request.id)
                                      }
                                      disabled={loading}
                                    >
                                      {loading ? (
                                        <>
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                          Processing...
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle2 className="mr-2 h-4 w-4" />
                                          Approve Redemption
                                        </>
                                      )}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {approvedRequests.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Recently Approved</h3>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Requester</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {approvedRequests.slice(0, 5).map((request) => (
                          <TableRow key={request.id}>
                            <TableCell className="font-mono">
                              #{request.id}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {request.requester.substring(0, 12)}...
                            </TableCell>
                            <TableCell className="font-mono">
                              {request.amount}
                            </TableCell>
                            <TableCell>
                              <Badge variant="default" className="bg-green-600">
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Approved
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Issue Tokens Tab */}
            <TabsContent value="issue" className="space-y-4">
              {!isIssuer && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Only the issuer can issue new tokens. Current issuer:{" "}
                    {roles?.issuer.substring(0, 300)}...
                  </AlertDescription>
                </Alert>
              )}

              <Alert>
                <ArrowUpCircle className="h-4 w-4" />
                <AlertDescription>
                  Issue new tokens for a tokenized asset. The recipient must
                  have a verified identity and meet compliance requirements.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="issueAssetId">Asset ID</Label>
                  <Input
                    id="issueAssetId"
                    type="number"
                    value={issueAssetId}
                    onChange={(e) => setIssueAssetId(e.target.value)}
                    placeholder="1"
                    disabled={loading || !isIssuer}
                    className="bg-gray-50 border-gray-200 focus:bg-white transition-colors h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="issueRecipient">Recipient Address</Label>
                  <Input
                    id="issueRecipient"
                    value={issueRecipient}
                    onChange={(e) => setIssueRecipient(e.target.value)}
                    placeholder="zig1..."
                    disabled={loading || !isIssuer}
                    className="bg-gray-50 border-gray-200 focus:bg-white transition-colors h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="issueAmount">Amount</Label>
                  <Input
                    id="issueAmount"
                    type="number"
                    value={issueAmount}
                    onChange={(e) => setIssueAmount(e.target.value)}
                    placeholder="1000000"
                    disabled={loading || !isIssuer}
                    className="bg-gray-50 border-gray-200 focus:bg-white transition-colors h-11"
                  />
                </div>

                <Button
                  onClick={handleIssueAsset}
                  disabled={
                    loading || !isIssuer || !issueRecipient || !issueAmount
                  }
                  className="w-full bg-linear-to-tr from-[#172E7F] to-[#2A5FA6] hover:opacity-90 transition-opacity"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Issuing...
                    </>
                  ) : (
                    <>
                      <ArrowUpCircle className="mr-2 h-4 w-4" />
                      Issue Tokens
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}
