/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Query } from '../../../../../src/plugins/data/common';

export interface QueryState {
  query: string;
  language: string;
  dataset?: any;
}

const initialState: QueryState = {
  query: '',
  language: 'ppl',
  dataset: undefined,
};

const querySlice = createSlice({
  name: 'query',
  initialState,
  reducers: {
    setQueryState: (_, action: PayloadAction<Query>) => {
      return {
        ...action.payload,
        query: typeof action.payload.query === 'string' ? action.payload.query : '',
      };
    },
    setQueryWithHistory: {
      reducer: (_, action: PayloadAction<QueryState>) => {
        return action.payload;
      },
      prepare: (query: Query) => ({
        payload: {
          ...query,
          query: typeof query.query === 'string' ? query.query : '',
        },
        meta: { addToHistory: true },
      }),
    },
    setQueryString: (state, action: PayloadAction<string>) => {
      state.query = action.payload;
    },
    setQueryLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
    setDataset: (state, action: PayloadAction<any>) => {
      state.dataset = action.payload;
    },
  },
});

export const { 
  setQueryState, 
  setQueryWithHistory, 
  setQueryString, 
  setQueryLanguage, 
  setDataset 
} = querySlice.actions;
export const queryReducer = querySlice.reducer;
export const queryInitialState = querySlice.getInitialState();

