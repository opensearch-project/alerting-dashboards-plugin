/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { DEFAULT_DATA } from '../../../../src/plugins/data/common';
import { setDataset } from '../redux/slices';

/**
 * Initialize dataset in queryString service - EXACTLY like explore plugin does
 */
export const useInitializeDataset = (services: any, indices: string[]) => {
  const dispatch = useDispatch();
  const isInitialized = useRef(false);

  useEffect(() => {
    const initializeDataset = async () => {
      if (isInitialized.current) return;
      
      console.log('[useInitializeDataset] Initializing dataset for autocomplete');
      console.log('[useInitializeDataset] Services:', {
        data: !!services?.data,
        dataViews: !!services?.data?.dataViews,
        queryString: !!services?.data?.query?.queryString,
      });
      console.log('[useInitializeDataset] Indices available:', indices.length);

      try {
        const { data } = services;
        if (!data?.dataViews || !data?.query?.queryString) {
          console.warn('[useInitializeDataset] Data services not available');
          return;
        }

        let dataset = null;

        // Try to get existing dataset from queryString service
        const existingQuery = data.query.queryString.getQuery();
        console.log('[useInitializeDataset] Existing query:', existingQuery);
        
        if (existingQuery?.dataset) {
          console.log('[useInitializeDataset] Using existing dataset:', existingQuery.dataset.id);
          dataset = existingQuery.dataset;
        } else {
          // Fetch first available index pattern, like explore does
          console.log('[useInitializeDataset] No existing dataset, fetching first available');
          
          try {
            // Get list of all index patterns
            const indexPatterns = await data.dataViews.getIdsWithTitle();
            console.log('[useInitializeDataset] Available index patterns:', indexPatterns.length);
            
            if (indexPatterns && indexPatterns.length > 0) {
              // Use first index pattern
              const firstPattern = indexPatterns[0];
              console.log('[useInitializeDataset] Using first index pattern:', firstPattern.title);
              
              const dataView = await data.dataViews.get(firstPattern.id);
              
              dataset = {
                id: dataView.id,
                title: dataView.title,
                type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
                timeFieldName: dataView.timeFieldName,
              };
              
              console.log('[useInitializeDataset] Dataset created:', dataset);
            } else if (indices.length > 0) {
              // Fallback: create from indices array
              console.log('[useInitializeDataset] No index patterns, creating from indices');
              const indexTitle = indices.join(',');
              const dataView = await data.dataViews.create({
                title: indexTitle,
              }, false, true); // skipFetchFields=false, displayErrors=true
              
              dataset = {
                id: dataView.id!,
                title: indexTitle,
                type: DEFAULT_DATA.SET_TYPES.INDEX_PATTERN,
                timeFieldName: dataView.timeFieldName,
              };
              
              console.log('[useInitializeDataset] Dataset created from indices:', dataset);
            } else {
              console.warn('[useInitializeDataset] No index patterns or indices available');
            }
          } catch (e) {
            console.error('[useInitializeDataset] Error fetching index patterns:', e);
          }
        }

        if (dataset) {
          // Set the dataset in queryString service - THIS IS THE KEY STEP!
          const initialQuery = data.query.queryString.getInitialQueryByDataset({
            ...dataset,
            language: 'PPL',
          });

          console.log('[useInitializeDataset] Setting query with dataset in queryString service');
          data.query.queryString.setQuery({
            ...initialQuery,
            query: '', // Start with empty query
            dataset,
          });

          // Also update Redux store
          dispatch(setDataset(dataset));

          console.log('[useInitializeDataset] ✅ Dataset initialized successfully!');
          console.log('[useInitializeDataset] Verify - current query:', data.query.queryString.getQuery());
          
          isInitialized.current = true;
        } else {
          console.warn('[useInitializeDataset] Could not initialize dataset');
        }
      } catch (error) {
        console.error('[useInitializeDataset] Error initializing dataset:', error);
      }
    };

    initializeDataset();
  }, [services, indices, dispatch]);
};

