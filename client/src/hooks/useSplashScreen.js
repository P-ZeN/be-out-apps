import { useEffect } from 'react';

/**
 * Hook to manage splash screen visibility
 * Hides the splash screen when the app is ready
 */
export const useSplashScreen = () => {
    const hideSplashScreen = () => {
        try {
            const splashScreen = document.getElementById('splash-screen');
            if (splashScreen) {
                // Remove splash active class from body to re-enable scrolling
                if (document.body) {
                    document.body.classList.remove('splash-active');
                }
                
                splashScreen.classList.add('hide');
                // Remove splash screen from DOM after transition
                setTimeout(() => {
                    try {
                        if (splashScreen.parentNode) {
                            splashScreen.remove();
                        }
                    } catch (error) {
                        console.warn('Error removing splash screen:', error);
                    }
                }, 500);
            }
        } catch (error) {
            console.warn('Error hiding splash screen:', error);
        }
    };

    const showSplashScreen = () => {
        try {
            const splashScreen = document.getElementById('splash-screen');
            if (splashScreen) {
                if (document.body) {
                    document.body.classList.add('splash-active');
                }
                splashScreen.classList.remove('hide');
            }
        } catch (error) {
            console.warn('Error showing splash screen:', error);
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
