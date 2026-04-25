import { defaultWagmiConfig } from "@web3modal/wagmi/react/config";
import { cookieStorage, createStorage } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";

export const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
export const isWeb3Enabled = Boolean(projectId);

const metadata = {
  name: "Pidtrymka strimera",
  description: "Web3 storinka pidtrymky strimera",
  url: "",
  icons: [],
};

const chains = [mainnet, sepolia] as const;

export const config = isWeb3Enabled
  ? defaultWagmiConfig({
      chains,
      projectId: projectId!,
      metadata,
      ssr: true,
      storage: createStorage({
        storage: cookieStorage,
      }),
    })
  : undefined;
