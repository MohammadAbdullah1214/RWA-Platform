"use client";

import { useState } from "react";
import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, LogOut, ChevronDown } from "lucide-react";

export function WalletConnectButton() {
  const {
    address,
    isConnected,
    isConnecting,
    connectKeplr,
    connectLeap,
    disconnect,
  } = useWallet();
  const [showModal, setShowModal] = useState(false);

  const handleConnect = async (walletType: "keplr" | "leap") => {
    if (walletType === "keplr") {
      await connectKeplr();
    } else {
      await connectLeap();
    }
    setShowModal(false);
  };

  const handleDisconnect = () => {
    disconnect();
    setShowModal(false);
  };

  if (isConnected && address) {
    return (
      <div className="relative">
        <Button
          onClick={() => setShowModal(!showModal)}
          className="bg-gradient-to-tr from-[#172E7F] to-[#2A5FA6] text-white rounded-[11px] px-6 h-10 font-medium flex items-center gap-2"
        >
          <Wallet className="h-4 w-4" />
          {address.slice(0, 6)}...{address.slice(-4)}
          <ChevronDown className="h-4 w-4" />
        </Button>

        <AnimatePresence>
          {showModal && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowModal(false)}
              />

              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden"
              >
                <div className="p-4 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    Connected Wallet
                  </p>
                  <p className="text-xs text-gray-500 mt-1 break-all">
                    {address}
                  </p>
                </div>

                <div className="p-2">
                  <Button
                    onClick={handleDisconnect}
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="relative">
      <Button
        onClick={() => setShowModal(!showModal)}
        disabled={isConnecting}
        className="bg-gradient-to-tr from-[#172E7F] to-[#2A5FA6] text-white rounded-[11px] px-6 h-10 font-medium"
      >
        {isConnecting ? "Connecting..." : "Connect Wallet"}
      </Button>

      <AnimatePresence>
        {showModal && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowModal(false)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">
                  Connect Wallet
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Choose your preferred wallet
                </p>
              </div>

              <div className="p-2 space-y-1">
                {/* Keplr Wallet */}
                <button
                  onClick={() => handleConnect("keplr")}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Keplr Wallet
                    </p>
                    <p className="text-xs text-gray-500">Connect with Keplr</p>
                  </div>
                </button>

                {/* Leap Wallet */}
                <button
                  onClick={() => handleConnect("leap")}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                    <Wallet className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Leap Wallet
                    </p>
                    <p className="text-xs text-gray-500">Connect with Leap</p>
                  </div>
                </button>
              </div>

              <div className="p-3 bg-gray-50 border-t border-gray-100">
                <p className="text-xs text-gray-500 text-center">
                  By connecting, you agree to our Terms of Service
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
