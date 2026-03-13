import { Capacitor } from "@capacitor/core";

/**
 * Native AdMob integration for Capacitor (Android/iOS).
 * Falls back silently on web — AdSense handles web ads.
 */

const ADMOB_APP_ID = "ca-app-pub-6721494458632843~6454663758";
const BANNER_AD_UNIT = "ca-app-pub-6721494458632843/6977766720";
// Add more ad unit IDs as needed:
// const INTERSTITIAL_AD_UNIT = "ca-app-pub-6721494458632843/XXXXXXXXXX";

let admobInitialized = false;
let AdMob: any = null;

export const isNativePlatform = () => Capacitor.isNativePlatform();

export const initializeAdMob = async () => {
  if (!isNativePlatform() || admobInitialized) return;

  try {
    const admobModule = await import("@capacitor-community/admob");
    AdMob = admobModule.AdMob;

    await AdMob.initialize({
      requestTrackingAuthorization: true,
      testingDevices: [], // Add test device IDs during development
      initializeForTesting: false,
    });

    admobInitialized = true;
    console.log("AdMob initialized successfully");
  } catch (error) {
    console.error("AdMob initialization failed:", error);
  }
};

export const showBannerAd = async (position: "TOP" | "BOTTOM" = "BOTTOM") => {
  if (!isNativePlatform() || !admobInitialized || !AdMob) return;

  try {
    const { BannerAdSize, BannerAdPosition } = await import("@capacitor-community/admob");

    await AdMob.showBanner({
      adId: BANNER_AD_UNIT,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: position === "TOP" ? BannerAdPosition.TOP_CENTER : BannerAdPosition.BOTTOM_CENTER,
      isTesting: false,
    });
  } catch (error) {
    console.error("Banner ad error:", error);
  }
};

export const hideBannerAd = async () => {
  if (!isNativePlatform() || !AdMob) return;
  try {
    await AdMob.removeBanner();
  } catch (error) {
    console.error("Hide banner error:", error);
  }
};

export const showInterstitialAd = async (adUnitId?: string) => {
  if (!isNativePlatform() || !admobInitialized || !AdMob) return;

  try {
    await AdMob.prepareInterstitial({
      adId: adUnitId || BANNER_AD_UNIT,
      isTesting: false,
    });
    await AdMob.showInterstitial();
  } catch (error) {
    console.error("Interstitial ad error:", error);
  }
};
