import React from 'react';
import { RestrictionsPanel, TitleText } from '../components';
import { useBlockConfig } from '../../context';
import { DEFAULT_SITE_LIST } from '../consts';

export const Restrictions = () => {
  const { blockConfig, setBlockConfig } = useBlockConfig();

  return (
    <div>
      <TitleText>Restrictions</TitleText>
      <RestrictionsPanel
        selectedApps={blockConfig.apps}
        setSelectedApps={(apps: string[]) =>
          setBlockConfig((prev) => ({ ...prev, apps: apps }))
        }
        selectedSites={blockConfig.sites}
        setSelectedSites={(sites: string[]) =>
          setBlockConfig((prev) => ({ ...prev, sites: sites }))
        }
        availableSites={blockConfig.availableSites ?? DEFAULT_SITE_LIST}
        setAvailableSites={(sites: string[]) =>
          setBlockConfig((prev) => ({ ...prev, availableSites: sites }))
        }
      />
    </div>
  );
};
