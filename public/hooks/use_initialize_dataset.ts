/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { setDataset } from '../redux/slices';
const INDEX_PATTERN_TYPE = 'index-pattern';


/**
 * Initialize dataset in queryString service - EXACTLY like explore plugin does
 */
export const useInitializeDataset = (services: any, indices: string[]) => {
  const dispatch = useDispatch();
  const isInitialized = useRef(false);

  useEffect(() => {
    const initializeDataset = async () => {
      if (isInitialized.current) return;

      try {
        const { data } = services ?? {};
        if (!data?.dataViews || !data?.query?.queryString) {
          return;
        }

        let dataset = null;

        // Try to get existing dataset from queryString service
        const existingQuery = data.query.queryString.getQuery();

        if (existingQuery?.dataset) {
          dataset = existingQuery.dataset;
        } else {
          // Fetch first available index pattern
          const indexPatterns = await data.dataViews.getIdsWithTitle();

            if (indexPatterns && indexPatterns.length > 0) {
            const firstPattern = indexPatterns[0];
            const dataView = await data.dataViews.get(firstPattern.id);

            dataset = {
              id: dataView.id,
              title: dataView.title,
                type: INDEX_PATTERN_TYPE,
              timeFieldName: dataView.timeFieldName,
            };
          } else if (indices.length > 0) {
            const indexTitle = indices.join(',');
            const dataView = await data.dataViews.create(
              {
                title: indexTitle,
              },
              false,
              true
            );

            dataset = {
              id: dataView.id!,
              title: indexTitle,
                type: INDEX_PATTERN_TYPE,
              timeFieldName: dataView.timeFieldName,
            };
          }
        }

        if (dataset) {
          const initialQuery = data.query.queryString.getInitialQueryByDataset({
            ...dataset,
            language: 'PPL',
          });

          data.query.queryString.setQuery({
            ...initialQuery,
            query: '',
            dataset,
          });

          dispatch(setDataset(dataset));
          isInitialized.current = true;
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[useInitializeDataset] Error initializing dataset:', error);
      }
    };

    initializeDataset();
  }, [services, indices, dispatch]);
};


