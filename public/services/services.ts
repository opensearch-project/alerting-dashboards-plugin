/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createContext } from 'react';
import { BrowserServices } from '../models/interfaces';
import { createGetterSetter } from '../../../../src/plugins/opensearch_dashboards_utils/public';
import { CoreStart, IUiSettingsClient } from '../../../../src/core/public';
import { SavedObjectLoaderAugmentVis } from '../../../../src/plugins/vis_augmenter/public';

const ServicesContext = createContext<BrowserServices | null>(null);

const ServicesConsumer = ServicesContext.Consumer;

export { ServicesContext, ServicesConsumer };

export const [getSavedAugmentVisLoader, setSavedAugmentVisLoader] = createGetterSetter<
  SavedObjectLoaderAugmentVis
  >('savedAugmentVisLoader');

export const [getUISettings, setUISettings] = createGetterSetter<IUiSettingsClient>('UISettings');
export const [getClient, setClient] =
  createGetterSetter<CoreStart['http']>('http');
