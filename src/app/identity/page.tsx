"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/hooks/use-wallet";
import { useIdentity } from "@/hooks/use-identity";
import { KycApplicationForm } from "@/components/identity/kyc-application-form";
import { ClaimsCard } from "@/components/identity/claims-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Shield,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  UserCheck,
} from "lucide-react";
import { getApplicationByWallet, type KycApplication } from "@/lib/kyc-storage";

export default function IdentityPage() {
  const { address, trexClient, connectKeplr, isConnected } = useWallet();
  const {
    identity,
    loading,
    error,
    loadIdentity,
    hasOnchainId,
    isVerified,
    claims,
  } = useIdentity({ trexClient, walletAddress: address });

  const [kycApplication, setKycApplication] = useState<KycApplication | null>(
    null
  );
  const [issuerTopics, setIssuerTopics] = useState<number[] | null>(null);
  const [checkingIssuer, setCheckingIssuer] = useState(false);

  // Load KYC application from localStorage
  useEffect(() => {
    if (address) {
      const app = getApplicationByWallet(address);
      setKycApplication(app);
    }
  }, [address]);

  // Check if user is a trusted issuer
  useEffect(() => {
    const checkIssuerStatus = async () => {
      if (trexClient && address) {
        setCheckingIssuer(true);
        try {
          const topics = await trexClient.getIssuerTopics(address);
          setIssuerTopics(topics);
        } catch (error) {
          console.error("Failed to check issuer status:", error);
        } finally {
          setCheckingIssuer(false);
        }
      }
    };
    checkIssuerStatus();
  }, [trexClient, address]);

  if (!isConnected) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Identity Management</h1>
          <p className="text-muted-foreground mb-6">
            Connect your wallet to manage your on-chain identity
          </p>
          <Button
            onClick={connectKeplr}
            size="lg"
            className="bg-gradient-to-tr from-[#172E7F] to-[#2A5FA6]"
          >
            Connect Wallet
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 glass-panel rounded-[22px]">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-tr from-[#172E7F] to-[#2A5FA6]">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Identity Management</h1>
              <p className="text-sm text-gray-600">
                Manage your on-chain identity for compliant security token
                trading
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={loadIdentity} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Verification Status Banner */}
      {kycApplication?.status === "approved" && !hasOnchainId && (
        <Alert className="mb-6 border-blue-200 bg-blue-50 rounded-xl">
          <UserCheck className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900">
            KYC Approved - Processing Complete
          </AlertTitle>
          <AlertDescription className="text-blue-700">
            Your KYC has been approved! OnchainID created, claims added, and
            identity registered. Click "Refresh" above to update your
            verification status.
          </AlertDescription>
        </Alert>
      )}

      {hasOnchainId && !isVerified && (
        <Alert className="mb-6 border-yellow-200 bg-yellow-50 rounded-xl">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-900">
            Identity Registered - Verifying Claims
          </AlertTitle>
          <AlertDescription className="text-yellow-700">
            Your identity is registered in the Identity Registry. System is
            verifying your claims from trusted issuers. If you have valid KYC &
            AML claims, you should be verified. Click "Refresh" to update
            status.
          </AlertDescription>
        </Alert>
      )}

      {isVerified && (
        <Alert className="mb-6 border-green-200 bg-green-50 rounded-xl">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-900">Fully Verified</AlertTitle>
          <AlertDescription className="text-green-700">
            Your identity is fully verified! You can now trade security tokens
            on this platform.
          </AlertDescription>
        </Alert>
      )}

      {/* Trusted Issuer Status Banner */}
      {issuerTopics && issuerTopics.length > 0 && (
        <Alert className="mb-6 border-purple-200 bg-purple-50 rounded-xl">
          <Shield className="h-4 w-4 text-purple-600" />
          <AlertTitle className="text-purple-900">Trusted Issuer</AlertTitle>
          <AlertDescription className="text-purple-700">
            You are registered as a Trusted Issuer and can add claims for
            topics:{" "}
            {issuerTopics
              .map((t) => {
                const topicNames: Record<number, string> = {
                  1: "KYC",
                  2: "AML",
                  3: "Accredited Investor",
                  4: "Residency",
                  5: "Age Verification",
                };
                return topicNames[t] || `Topic ${t}`;
              })
              .join(", ")}
            . Go to <strong>/manage → Identity tab</strong> to add claims to any
            OnchainID.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Left Column: KYC Application or Identity Status */}
        <div className="space-y-4">
          {/* KYC Application Form */}
          {address && (
            <KycApplicationForm
              walletAddress={address}
              existingApplication={kycApplication}
            />
          )}

          {/* Info Card - How it works */}
          <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <CardHeader>
              <CardTitle className="text-lg">How Verification Works</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p className="text-gray-600">
                To trade compliant security tokens, you need to complete a
                multi-step verification process following the T-REX standard.
              </p>
              <div className="pt-2 space-y-1">
                <p className="font-medium">Verification Steps:</p>
                <ol className="list-decimal list-inside space-y-1 text-gray-600">
                  <li>
                    <strong>Submit KYC:</strong> Provide your identity documents
                    and information
                  </li>
                  <li>
                    <strong>KYC Review:</strong> Licensed KYC provider reviews
                    and creates your OnchainID
                  </li>
                  <li>
                    <strong>Whitelist:</strong> Platform issuer adds you to the
                    Identity Registry
                  </li>
                  <li>
                    <strong>Claims Added:</strong> KYC provider adds
                    verification claims (KYC, AML)
                  </li>
                  <li>
                    <strong>Trade:</strong> You can now trade security tokens
                    compliantly
                  </li>
                </ol>
              </div>
              <Button
                variant="link"
                className="p-0 h-auto text-xs"
                onClick={() =>
                  window.open(
                    "https://github.com/TokenySolutions/T-REX",
                    "_blank"
                  )
                }
              >
                Learn more about T-REX Standard{" "}
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Claims (only show if has OnchainID) */}
        <div>
          {hasOnchainId && identity?.onchainIdAddress ? (
            <ClaimsCard
              claims={claims}
              loading={loading}
              onAddClaim={async (topic: number, data: string, uri: string) => {
                // Investors cannot add claims - return empty promise
                return Promise.resolve("");
              }}
              canAddClaims={false}
            />
          ) : (
            <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Verification Claims
                </CardTitle>
                <CardDescription>
                  Your verification status will appear here
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Shield className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">
                    Complete KYC verification to see your claims
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
