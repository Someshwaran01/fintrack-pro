import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.fintrack.pro',
    appName: 'Somu Fin - Tracker',
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
