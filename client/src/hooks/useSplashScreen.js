import { useEffect } from 'react';

/**
 * Hook to manage splash screen visibility
 * Hides the splash screen when the app is ready
 */
export const useSplashScreen = () => {
    const hideSplashScreen = () => {
        const splashScreen = document.getElementById('splash-screen');
        if (splashScreen) {
            // Remove splash active class from body to re-enable scrolling
            document.body.classList.remove('splash-active');
            
            splashScreen.classList.add('hide');
            // Remove splash screen from DOM after transition
            setTimeout(() => {
                if (splashScreen.parentNode) {
                    splashScreen.remove();
                }
            }, 500);
        }
    };

    const showSplashScreen = () => {
        const splashScreen = document.getElementById('splash-screen');
        if (splashScreen) {
            document.body.classList.add('splash-active');
            splashScreen.classList.remove('hide');
        }
    };

    return { hideSplashScreen, showSplashScreen };
};

/**
 * Hook to automatically hide splash screen when component mounts
 * Use this in your main App component
 */
export const useAutoHideSplashScreen = (delay = 1000) => {
    const { hideSplashScreen } = useSplashScreen();

    useEffect(() => {
        // Wait a bit to ensure the app has properly rendered
        const timer = setTimeout(() => {
            hideSplashScreen();
        }, delay);

        return () => clearTimeout(timer);
    }, [hideSplashScreen, delay]);

    return { hideSplashScreen };
};
