"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, Send, CheckCircle2 } from "lucide-react";
import { submitApplication, type KycApplication } from "@/lib/kyc-storage";
import { toast } from "sonner";

interface KycApplicationFormProps {
  walletAddress: string;
  existingApplication?: KycApplication | null;
}

export function KycApplicationForm({
  walletAddress,
  existingApplication,
}: KycApplicationFormProps) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    country: "",
    documentType: "passport" as const,
    documentNumber: "",
    dateOfBirth: "",
    address: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const application = submitApplication({
        wallet: walletAddress,
        ...formData,
      });

      toast.success("KYC Application Submitted!", {
        description:
          "Your application is now pending review by our KYC provider.",
      });

      // Reload page to show status
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      toast.error("Submission Failed", {
        description: error.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Show status if application exists
  if (existingApplication) {
    return (
      <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            KYC Application Status
          </CardTitle>
          <CardDescription>Your application has been submitted</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <span
                className={`text-sm font-medium ${
                  existingApplication.status === "approved"
                    ? "text-green-600"
                    : existingApplication.status === "rejected"
                    ? "text-red-600"
                    : "text-yellow-600"
                }`}
              >
                {existingApplication.status.toUpperCase()}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Submitted</span>
              <span className="text-sm">
                {new Date(existingApplication.submittedAt).toLocaleDateString()}
              </span>
            </div>

            {existingApplication.status === "approved" &&
              existingApplication.onchainIdAddress && (
                <>
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      Your KYC has been approved! Your OnchainID is now linked.
                      Waiting for platform admin actions (if any) before you can
                      trade.
                    </AlertDescription>
                  </Alert>

                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      OnchainID
                    </span>
                    <span className="text-xs font-mono">
                      {existingApplication.onchainIdAddress.slice(0, 20)}...
                    </span>
                  </div>
                </>
              )}

            {existingApplication.status === "rejected" && (
              <Alert variant="destructive">
                <AlertDescription>
                  <strong>Reason:</strong>{" "}
                  {existingApplication.rejectionReason || "Not specified"}
                </AlertDescription>
              </Alert>
            )}

            {existingApplication.status === "pending" && (
              <Alert>
                <AlertDescription>
                  Your application is being reviewed by our KYC provider. This
                  typically takes 1-3 business days.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show application form
  return (
    <Card className="bg-white rounded-2xl shadow-sm border border-gray-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <FileText className="h-6 w-6" />
          Submit KYC Application
        </CardTitle>
        <CardDescription>
          Complete verification to trade security tokens
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Legal Name *</Label>
              <Input
                id="fullName"
                required
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                placeholder="John Doe"
                className="bg-gray-50 border-gray-200 focus:bg-white transition-colors h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="john@example.com"
                className="bg-gray-50 border-gray-200 focus:bg-white transition-colors h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country of Residence *</Label>
              <Select
                value={formData.country}
                onValueChange={(value) =>
                  setFormData({ ...formData, country: value })
                }
                required
              >
                <SelectTrigger
                  id="country"
                  className="bg-gray-50 border-gray-200 focus:bg-white transition-colors h-11"
                >
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States</SelectItem>
                  <SelectItem value="GB">United Kingdom</SelectItem>
                  <SelectItem value="CA">Canada</SelectItem>
                  <SelectItem value="AU">Australia</SelectItem>
                  <SelectItem value="DE">Germany</SelectItem>
                  <SelectItem value="FR">France</SelectItem>
                  <SelectItem value="JP">Japan</SelectItem>
                  <SelectItem value="SG">Singapore</SelectItem>
                  <SelectItem value="AE">UAE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                required
                value={formData.dateOfBirth}
                onChange={(e) =>
                  setFormData({ ...formData, dateOfBirth: e.target.value })
                }
                className="bg-gray-50 border-gray-200 focus:bg-white transition-colors h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentType">ID Document Type *</Label>
              <Select
                value={formData.documentType}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, documentType: value })
                }
                required
              >
                <SelectTrigger
                  id="documentType"
                  className="bg-gray-50 border-gray-200 focus:bg-white transition-colors h-11"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="passport">Passport</SelectItem>
                  <SelectItem value="drivers_license">
                    Driver's License
                  </SelectItem>
                  <SelectItem value="national_id">National ID Card</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentNumber">Document Number *</Label>
              <Input
                id="documentNumber"
                required
                value={formData.documentNumber}
                onChange={(e) =>
                  setFormData({ ...formData, documentNumber: e.target.value })
                }
                placeholder="ABC123456"
                className="bg-gray-50 border-gray-200 focus:bg-white transition-colors h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Residential Address *</Label>
            <Textarea
              id="address"
              required
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              placeholder="123 Main St, Apt 4B, New York, NY 10001"
              rows={3}
              className="bg-gray-50 border-gray-200 focus:bg-white transition-colors resize-none"
            />
          </div>

          <Alert>
            <AlertDescription className="text-sm">
              <strong>Note:</strong> In a production environment, you would
              upload scanned copies of your identity documents. For this demo,
              we're collecting basic information only. Your data is stored
              locally.
            </AlertDescription>
          </Alert>

          <Button
            type="submit"
            className="w-full bg-gradient-to-tr from-[#172E7F] to-[#2A5FA6] hover:opacity-90 transition-opacity text-white h-11"
            disabled={submitting}
          >
            <Send className="h-4 w-4 mr-2" />
            {submitting ? "Submitting..." : "Submit KYC Application"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
