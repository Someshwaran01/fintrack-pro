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
      // TODO: Replace with your Web Client ID from:
      // Firebase Console -> Project Settings -> Web App -> OAuth 2.0 Client ID
      serverClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    }
  }
};

export default config;
