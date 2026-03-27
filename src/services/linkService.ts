import { Browser } from '@capacitor/browser';

/**
 * Service to handle external links and force them to open in the system browser
 * instead of the app's WebView or an integrated browser.
 */
export class LinkService {
  /**
   * Opens a URL in the system's default browser (e.g., Chrome on Android)
   * @param url The full URL to open (must start with http or https)
   */
  static async openExternal(url: string): Promise<void> {
    try {
      await Browser.open({ url });
    } catch (error) {
      console.error('Failed to open external browser:', error);
      // Fallback to window.open if the plugin fails
      window.open(url, '_blank');
    }
  }

  /**
   * Helper to open the official FinTrack configuration guide
   */
  static async openConfigGuide(): Promise<void> {
    const url = 'https://github.com/Someshwaran01/fintrack-pro#configuration-guide'; // Update with real guide link if available
    await this.openExternal(url);
  }
}
