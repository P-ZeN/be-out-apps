/**
 * Mobile Safe Area Handler
 * Provides JavaScript-based safe area handling for mobile apps
 */

let safeAreaInsets = {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
};

/**
 * Get safe area insets using JavaScript detection
 */
export const getSafeAreaInsets = () => {
    if (typeof window === 'undefined') return safeAreaInsets;
    
    // Try to get values from CSS env() function
    const testElement = document.createElement('div');
    testElement.style.position = 'fixed';
    testElement.style.top = 'env(safe-area-inset-top, 0px)';
    testElement.style.left = 'env(safe-area-inset-left, 0px)';
    testElement.style.right = 'env(safe-area-inset-right, 0px)';
    testElement.style.bottom = 'env(safe-area-inset-bottom, 0px)';
    testElement.style.visibility = 'hidden';
    testElement.style.pointerEvents = 'none';
    
    document.body.appendChild(testElement);
    
    const computedStyle = getComputedStyle(testElement);
    const rect = testElement.getBoundingClientRect();
    
    // Parse CSS values
    const parseValue = (value) => {
        const num = parseFloat(value);
        return isNaN(num) ? 0 : num;
    };
    
    safeAreaInsets = {
        top: parseValue(computedStyle.top),
        left: parseValue(computedStyle.left),
        right: parseValue(computedStyle.right),
        bottom: parseValue(computedStyle.bottom)
    };
    
    document.body.removeChild(testElement);
    
    // Fallback detection for specific mobile environments
    if (safeAreaInsets.top === 0) {
        // Basic status bar detection
        const isAndroid = /Android/i.test(navigator.userAgent);
        const isIOS = /iPad|iPhone|iPod/i.test(navigator.userAgent);
        
        if (isAndroid) {
            // Android status bar is typically 24-48px
            safeAreaInsets.top = 24;
        } else if (isIOS) {
            // iOS safe area varies by device
            const screenHeight = window.screen.height;
            if (screenHeight >= 896) { // iPhone X and newer
                safeAreaInsets.top = 44;
                safeAreaInsets.bottom = 34;
            } else if (screenHeight >= 812) { // iPhone X
                safeAreaInsets.top = 44;
                safeAreaInsets.bottom = 34;
            } else { // Older iPhones
                safeAreaInsets.top = 20;
            }
        }
    }
    
    console.log('📱 Detected Safe Area Insets:', safeAreaInsets);
    return safeAreaInsets;
};

/**
 * Apply safe area insets to an element using JavaScript
 */
export const applySafeAreaInsets = (element, options = {}) => {
    const insets = getSafeAreaInsets();
    const { 
        includeTop = true, 
        includeLeft = true, 
        includeRight = true, 
        includeBottom = true,
        addToPadding = true 
    } = options;
    
    if (!element) return;
    
    const currentStyle = getComputedStyle(element);
    
    if (addToPadding) {
        const currentPaddingTop = parseFloat(currentStyle.paddingTop) || 0;
        const currentPaddingLeft = parseFloat(currentStyle.paddingLeft) || 0;
        const currentPaddingRight = parseFloat(currentStyle.paddingRight) || 0;
        const currentPaddingBottom = parseFloat(currentStyle.paddingBottom) || 0;
        
        if (includeTop) element.style.paddingTop = `${currentPaddingTop + insets.top}px`;
        if (includeLeft) element.style.paddingLeft = `${currentPaddingLeft + insets.left}px`;
        if (includeRight) element.style.paddingRight = `${currentPaddingRight + insets.right}px`;
        if (includeBottom) element.style.paddingBottom = `${currentPaddingBottom + insets.bottom}px`;
    } else {
        if (includeTop) element.style.marginTop = `${insets.top}px`;
        if (includeLeft) element.style.marginLeft = `${insets.left}px`;
        if (includeRight) element.style.marginRight = `${insets.right}px`;
        if (includeBottom) element.style.marginBottom = `${insets.bottom}px`;
    }
    
    console.log('✅ Applied safe area insets to element:', { insets, options });
};

/**
 * React hook for safe area insets
 */
export const useSafeAreaInsets = () => {
    const [insets, setInsets] = React.useState(safeAreaInsets);
    
    React.useEffect(() => {
        const detectedInsets = getSafeAreaInsets();
        setInsets(detectedInsets);
        
        // Listen for orientation changes
        const handleOrientationChange = () => {
            setTimeout(() => {
                const newInsets = getSafeAreaInsets();
                setInsets(newInsets);
            }, 100);
        };
        
        window.addEventListener('orientationchange', handleOrientationChange);
        window.addEventListener('resize', handleOrientationChange);
        
        return () => {
            window.removeEventListener('orientationchange', handleOrientationChange);
            window.removeEventListener('resize', handleOrientationChange);
        };
    }, []);
    
    return insets;
};
