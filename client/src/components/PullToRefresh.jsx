/**
 * Pull-to-Refresh Component for Mobile Apps
 * Implements native-feeling pull-to-refresh functionality
 */

import React, { useState, useRef, useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { getIsTauriApp } from '../utils/platformDetection';

const PullToRefresh = ({
    children,
    onRefresh,
    refreshing = false,
    pullDistance = 80,
    triggerDistance = 60,
    disabled = false
}) => {
    const theme = useTheme();
    const [pulling, setPulling] = useState(false);
    const [pullY, setPullY] = useState(0);
    const [startY, setStartY] = useState(0);
    const containerRef = useRef(null);
    const isMobile = getIsTauriApp();

    // Only enable on mobile Tauri apps
    const isEnabled = !disabled && isMobile;

    const handleTouchStart = (e) => {
        if (!isEnabled || refreshing) return;

        const container = containerRef.current;
        if (!container || container.scrollTop > 0) return;

        setStartY(e.touches[0].clientY);
        setPulling(true);
    };

    const handleTouchMove = (e) => {
        if (!isEnabled || !pulling || refreshing) return;

        const container = containerRef.current;
        if (!container || container.scrollTop > 0) {
            setPulling(false);
            setPullY(0);
            return;
        }

        const currentY = e.touches[0].clientY;
        const diff = currentY - startY;

        if (diff > 0) {
            e.preventDefault(); // Prevent default scroll
            const newPullY = Math.min(diff * 0.5, pullDistance); // Damping effect
            setPullY(newPullY);
        }
    };

    const handleTouchEnd = () => {
        if (!isEnabled || !pulling) return;

        if (pullY >= triggerDistance && !refreshing) {
            onRefresh && onRefresh();
        }

        setPulling(false);
        setPullY(0);
    };

    // Mouse events for desktop testing
    const handleMouseDown = (e) => {
        if (!isEnabled || refreshing) return;

        const container = containerRef.current;
        if (!container || container.scrollTop > 0) return;

        setStartY(e.clientY);
        setPulling(true);
    };

    const handleMouseMove = (e) => {
        if (!isEnabled || !pulling || refreshing) return;

        const container = containerRef.current;
        if (!container || container.scrollTop > 0) {
            setPulling(false);
            setPullY(0);
            return;
        }

        const currentY = e.clientY;
        const diff = currentY - startY;

        if (diff > 0) {
            e.preventDefault();
            const newPullY = Math.min(diff * 0.5, pullDistance);
            setPullY(newPullY);
        }
    };

    const handleMouseUp = () => {
        if (!isEnabled || !pulling) return;

        if (pullY >= triggerDistance && !refreshing) {
            onRefresh && onRefresh();
        }

        setPulling(false);
        setPullY(0);
    };

    // Add global mouse events when pulling
    useEffect(() => {
        if (pulling && !isMobile) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);

            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [pulling, startY, isMobile]);

    const getRefreshStatus = () => {
        if (refreshing) return 'refreshing';
        if (pullY >= triggerDistance) return 'release';
        if (pullY > 0) return 'pull';
        return 'idle';
    };

    const getStatusText = () => {
        const status = getRefreshStatus();
        switch (status) {
            case 'pull': return 'Pull to refresh';
            case 'release': return 'Release to refresh';
            case 'refreshing': return 'Refreshing...';
            default: return '';
        }
    };

    const getStatusOpacity = () => {
        if (refreshing) return 1;
        return Math.min(pullY / triggerDistance, 1);
    };

    return (
        <Box
            ref={containerRef}
            sx={{
                height: '100%',
                overflowY: 'auto',
                position: 'relative',
                transform: `translateY(${refreshing ? 60 : pullY}px)`,
                transition: pulling ? 'none' : 'transform 0.3s ease-out',
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={isMobile ? undefined : handleMouseDown}
        >
            {/* Pull indicator */}
            <Box
                sx={{
                    position: 'absolute',
                    top: -60,
                    left: 0,
                    right: 0,
                    height: 60,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: theme.palette.background.paper,
                    opacity: getStatusOpacity(),
                    transition: pulling ? 'none' : 'opacity 0.3s ease-out',
                    zIndex: 1000,
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                    }}
                >
                    <CircularProgress
                        size={20}
                        sx={{
                            opacity: refreshing ? 1 : 0,
                            transition: 'opacity 0.3s ease-out',
                            color: theme.palette.primary.main,
                        }}
                    />
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                            fontSize: '0.875rem',
                            fontWeight: 500,
                        }}
                    >
                        {getStatusText()}
                    </Typography>
                </Box>
            </Box>

            {/* Content */}
            {children}
        </Box>
    );
};

export default PullToRefresh;
