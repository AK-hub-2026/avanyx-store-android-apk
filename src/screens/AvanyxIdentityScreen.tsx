import React from 'react';
import { AvanyxIdentityRouter } from './identity/AvanyxIdentityRouter';

export const AvanyxIdentityScreen: React.FC = () => {
  return <AvanyxIdentityRouter initialPath="/identity" />;
};
