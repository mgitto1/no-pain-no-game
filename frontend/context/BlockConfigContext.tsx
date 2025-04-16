import React, { createContext, useContext, useEffect, useState } from 'react';
import { DEFAULT_SITE_LIST } from '../src/consts';

type BlockConfig = {
  apps: string[];
  sites: string[]; // selected/checked
  availableSites: string[]; // all visible in list
};

type BlockConfigContextType = {
  blockConfig: BlockConfig;
  setBlockConfig: React.Dispatch<React.SetStateAction<BlockConfig>>;
};

const BlockConfigContext = createContext<BlockConfigContextType | undefined>(
  undefined
);

export const BlockConfigProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [blockConfig, setBlockConfig] = useState<BlockConfig>({
    apps: [],
    sites: [],
    availableSites: [...DEFAULT_SITE_LIST],
  });

  useEffect(() => {
    const config = window?.electron?.readBlockConfig?.();
    if (config) {
      setBlockConfig(config);
    }
  }, []);

  useEffect(() => {
    const config = window?.electron?.readBlockConfig?.();
    if (config) {
      setBlockConfig({
        apps: Array.isArray(config.apps) ? config.apps : [],
        sites: Array.isArray(config.sites) ? config.sites : [],
        availableSites: config?.availableSites ?? [],
      });
    }
  }, []);

  useEffect(() => {
    window?.electron?.writeBlockConfig(blockConfig);
  }, [blockConfig]);

  return (
    <BlockConfigContext.Provider value={{ blockConfig, setBlockConfig }}>
      {children}
    </BlockConfigContext.Provider>
  );
};

export const useBlockConfig = () => {
  const ctx = useContext(BlockConfigContext);
  if (!ctx)
    throw new Error('useBlockConfig must be used within BlockConfigProvider');
  return ctx;
};
