import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.fintrack.pro',
    appName: 'FinTrack Pro',
    webDir: 'dist',
    server: {
        androidScheme: 'https'
    },
    android: {
        allowMixedContent: true,
        buildOptions: {
            keystorePath: undefined,
            keystoreAlias: undefined
        }
    }
};

export default config;
