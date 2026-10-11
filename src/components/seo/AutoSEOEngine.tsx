import React, { useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  generateAppSeoData,
  generateTabSeoData,
  applySeoMetadataToDOM
} from '../../utils/autoSeoEngine';

export const AutoSEOEngine: React.FC = () => {
  const { currentTab, selectedApp, selectedDeveloper, searchQuery } = useStore();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const origin = window.location.origin || 'https://avanyxstore.org';

    if (currentTab === 'APP_DETAILS' && selectedApp) {
      // Auto SEO Engine: When an app is viewed/selected, generate title, desc, keywords, canonical, JSON-LD, og:image
      const appSeo = generateAppSeoData(selectedApp, origin);
      applySeoMetadataToDOM(appSeo);
    } else {
      // Auto SEO Engine: Update DOM metadata based on current store tab and search queries
      const tabSeo = generateTabSeoData(currentTab, {
        searchQuery,
        developer: selectedDeveloper,
        origin,
        path: window.location.pathname
      });
      applySeoMetadataToDOM(tabSeo);
    }
  }, [currentTab, selectedApp, selectedDeveloper, searchQuery]);

  return null;
};

export default AutoSEOEngine;
