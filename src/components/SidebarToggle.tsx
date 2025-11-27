'use client';

import { useEffect } from 'react';

export default function SidebarToggle() {
  useEffect(() => {
    const closeSidebar = () => {
      const toggleButton = document.querySelector('[data-lte-toggle="sidebar"]') as HTMLElement;
      if (toggleButton) {
        toggleButton.click();
      }
    };

    const handleMainContentClick = (event: Event) => {
      const target = event.target as HTMLElement;
      const appWrapper = document.querySelector('.app-wrapper');
      
      if (!appWrapper) return;

      const isMobile = window.innerWidth < 768;
      const isSidebarOpen = 
        appWrapper.classList.contains('sidebar-open') || 
        document.body.classList.contains('sidebar-open');

      // Only handle on mobile when sidebar is open
      if (!isMobile || !isSidebarOpen) return;

      // Don't close if clicking on interactive elements
      if (
        target.closest('button') ||
        target.closest('a') ||
        target.closest('input') ||
        target.closest('select') ||
        target.closest('textarea') ||
        target.closest('.dropdown-menu') ||
        target.closest('.modal') ||
        target.closest('.offcanvas')
      ) {
        return;
      }

      // Close sidebar
      closeSidebar();
    };

    const init = () => {
      // Ensure overlay is visible and clickable
      const checkOverlay = () => {
        const sidebarOverlay = document.querySelector('.sidebar-overlay');
        if (sidebarOverlay) {
          const overlayElement = sidebarOverlay as HTMLElement;
          overlayElement.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
          overlayElement.style.cursor = 'pointer';
          overlayElement.style.zIndex = '1037';
        } else {
          setTimeout(checkOverlay, 100);
        }
      };

      checkOverlay();

      // Add event listener to main content area
      const mainContent = document.querySelector('#main-content');
      if (mainContent) {
        mainContent.addEventListener('click', handleMainContentClick, true);
        mainContent.addEventListener('touchend', handleMainContentClick, true);
      }

      // Also add to document for overlay clicks
      document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('sidebar-overlay') || target.closest('.sidebar-overlay')) {
          // Overlay click is handled by AdminLTE, but ensure it works
          return;
        }
      }, true);
    };

    // Wait for AdminLTE scripts to load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(init, 500);
      });
    } else {
      setTimeout(init, 500);
    }

    return () => {
      const mainContent = document.querySelector('#main-content');
      if (mainContent) {
        mainContent.removeEventListener('click', handleMainContentClick, true);
        mainContent.removeEventListener('touchend', handleMainContentClick, true);
      }
    };
  }, []);

  return null;
}

