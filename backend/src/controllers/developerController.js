const { createSuccessResponse, createErrorResponse } = require('../models/responseModels');

// Sample known developer profiles
const DEVELOPER_PROFILES = {
  'google': {
    id: 'google',
    name: 'Google LLC',
    description: 'Apps from Google to help you get the most out of your day, across all your devices.',
    website: 'https://about.google',
    email: 'apps-support@google.com',
    banner: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?auto=format&fit=crop&w=1200&q=80',
    logo: 'https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?auto=format&fit=crop&w=200&q=80',
    country: 'United States',
    joinedDate: 'Sep 2008',
    followers: '120M',
    downloads: '10B+',
    rating: 4.6,
    verified: true,
    totalApps: 48
  },
  'avanyx': {
    id: 'avanyx',
    name: 'AVANYX Studios',
    description: 'Next-generation modern mobile utilities, productivity engines, and immersive gaming experiences.',
    website: 'https://avanyx.store',
    email: 'developer@avanyx.store',
    banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80',
    country: 'United States',
    joinedDate: 'Jan 2024',
    followers: '2.4M',
    downloads: '50M+',
    rating: 4.8,
    verified: true,
    totalApps: 12
  }
};

const getDeveloperProfile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const key = (id || '').toLowerCase().trim();
    
    let profile = DEVELOPER_PROFILES[key];
    if (!profile) {
      // Dynamic fallback for any developer name/ID
      const formattedName = id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      profile = {
        id: id,
        name: formattedName,
        description: `Official application catalog and services published by ${formattedName}.`,
        website: `https://${id.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        email: `support@${id.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        banner: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
        logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80',
        country: 'Global',
        joinedDate: 'Jan 2023',
        followers: '150K',
        downloads: '1M+',
        rating: 4.5,
        verified: true,
        totalApps: 6
      };
    }

    return res.json(createSuccessResponse(profile, `Developer profile retrieved for ${profile.name}`));
  } catch (error) {
    next(error);
  }
};

const getDeveloperApps = async (req, res, next) => {
  try {
    const { id } = req.params;
    const key = (id || '').toLowerCase().trim();

    // Return active apps list format
    return res.json(createSuccessResponse({
      developerId: id,
      status: 'ACTIVE',
      count: 0,
      apps: []
    }, `Active apps retrieved for developer ${id}`));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDeveloperProfile,
  getDeveloperApps
};
