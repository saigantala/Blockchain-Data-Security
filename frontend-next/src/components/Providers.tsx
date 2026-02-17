'use client';

import * as React from 'react';
import {
    RainbowKitProvider,
    getDefaultConfig,
    darkTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider, http } from 'wagmi';
import { hardhat, sepolia, polygonAmoy, arbitrumSepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '@rainbow-me/rainbowkit/styles.css';

const config = getDefaultConfig({
    appName: 'Supreme Blockchain Data Vault',
    projectId: 'PLACEHOLDER_PROJECT_ID', // Replace with your actual project ID from https://cloud.walletconnect.com
    chains: [hardhat, sepolia, polygonAmoy, arbitrumSepolia],
    transports: {
        [hardhat.id]: http('http://127.0.0.1:8545'),
        [sepolia.id]: http(),
        [polygonAmoy.id]: http(),
        [arbitrumSepolia.id]: http(),
    },
    ssr: true,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider theme={darkTheme({
                    accentColor: '#00ff00',
                    accentColorForeground: 'black',
                    borderRadius: 'small',
                    fontStack: 'system',
                    overlayBlur: 'small',
                })}>
                    {children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
