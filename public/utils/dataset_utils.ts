/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DEFAULT_DATA } from '../../../../src/plugins/data/common';

/**
 * Creates a dataset object from an index pattern or index name
 */
export const createDatasetFromIndex = (indexId: string, indexType: string = DEFAULT_DATA.SET_TYPES.INDEX_PATTERN) => {
  return {
    id: indexId,
    title: indexId,
    type: indexType,
  };
};

/**
 * Initializes a default dataset for PPL queries
 */
export const initializeDefaultDataset = async (services: any) => {
  try {
    const { data } = services;
    if (!data?.dataViews) {
      return null;
    }

    // Try to get the default index pattern
    const defaultId = await data.dataViews.getDefaultId();
    if (defaultId) {
      const dataView = await data.dataViews.get(defaultId);
      return {
        id: dataView.id,
        title: dataView.title,
        type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
      };
    }

    // If no default, try to get the first available index pattern
    const indexPatterns = await data.dataViews.getIdsWithTitle();
    if (indexPatterns && indexPatterns.length > 0) {
      return {
        id: indexPatterns[0].id,
        title: indexPatterns[0].title,
        type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
      };
    }

    return null;
  } catch (error) {
    console.error('Error initializing default dataset:', error);
    return null;
  }
};

