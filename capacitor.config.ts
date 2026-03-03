import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.fintrack.pro',
    appName: 'Fin - Tracker',
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
    },
    plugins: {
        StatusBar: {
            overlaysWebView: false,
            style: 'DARK',
            backgroundColor: '#ffffff'
        }
    }
};

export default config;
