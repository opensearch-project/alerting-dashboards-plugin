/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  configureStore,
  combineReducers,
  PreloadedState,
} from '@reduxjs/toolkit';
import { queryReducer, queryEditorReducer } from './slices';

const rootReducer = combineReducers({
  query: queryReducer,
  queryEditor: queryEditorReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppStore = ReturnType<typeof configureAlertingStore>;
export type AppDispatch = AppStore['dispatch'];

export const configureAlertingStore = (
  preloadedState?: PreloadedState<RootState>
) => {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
  });
};

export const getAlertingStore = () => {
  const store = configureAlertingStore();
  return store;
};


