"use client";

import React, { ReactNode } from "react";
import { config, isWeb3Enabled, projectId } from "@/config";
import { createWeb3Modal } from "@web3modal/wagmi/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { State, WagmiProvider } from "wagmi";

const queryClient = new QueryClient();

if (isWeb3Enabled && config && projectId) {
  createWeb3Modal({
    wagmiConfig: config,
    projectId,
    enableAnalytics: true,
    enableOnramp: true,
    themeMode: "light",
    themeVariables: {
      "--w3m-color-mix": "#f97316",
      "--w3m-accent": "#f97316",
      "--w3m-color-mix-strength": 20,
    },
  });
}

export default function Web3ModalProvider({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState?: State;
}) {
  if (!isWeb3Enabled || !config) {
    return <>{children}</>;
  }

  return (
    <WagmiProvider config={config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
