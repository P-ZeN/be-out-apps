// Platform detection utilities

/**
 * Determines if the app is running in a Tauri environment
 * @returns {boolean} true if running in Tauri
 */
export const isTauri = () => {
  return window.__TAURI__ !== undefined;
};

/**
 * Determines if the app is running on a mobile device
 * @returns {boolean} true if running on a mobile device
 */
export const isMobile = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  return /android|iPad|iPhone|iPod/i.test(userAgent) && !window.MSStream;
};

/**
 * Determines if the app is running on Android
 * @returns {boolean} true if running on Android
 */
export const isAndroid = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  return /android/i.test(userAgent);
};

/**
 * Determines if the app is running on iOS
 * @returns {boolean} true if running on iOS
 */
export const isIOS = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  return /iPad|iPhone|iPod/i.test(userAgent) && !window.MSStream;
};

/**
 * Determines if the app is running as a PWA
 * @returns {boolean} true if running as a PWA
 */
export const isPWA = () => {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
};

/**
 * Gets a friendly platform name for logging/debugging
 * @returns {string} Platform name
 */
export const getPlatformInfo = () => {
  let platform = 'Web';

  if (isTauri()) {
    platform = 'Tauri';
  } else if (isPWA()) {
    platform = 'PWA';
  }

  if (isAndroid()) {
    platform += ' Android';
  } else if (isIOS()) {
    platform += ' iOS';
  } else if (isMobile()) {
    platform += ' Mobile';
  } else {
    platform += ' Desktop';
  }

  return platform;
};
