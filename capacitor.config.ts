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
    },
    // Native Google Auth - fixes "Authentication failed" popup issue on Android
    GoogleAuth: {
      scopes: [
        'profile',
        'email',
        'https://www.googleapis.com/auth/gmail.readonly'
      ],
      serverClientId: '109932659345-h5jjqj85o6a2jtflqheduld0lifa2ns8.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    }
  }
};

export default config;
