/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type EditorMode = 'query' | 'prompt';
export type QueryExecutionStatus = 'UNINITIALIZED' | 'RUNNING' | 'COMPLETE' | 'ERROR';

export interface QueryResultStatus {
  status: QueryExecutionStatus;
  elapsedMs?: number;
  startTime?: number;
  error?: string;
}

export interface QueryEditorSliceState {
  overallQueryStatus: QueryResultStatus;
  editorMode: EditorMode;
  isQueryEditorDirty: boolean;
  dateRange?: { from: string; to: string };
}

const initialState: QueryEditorSliceState = {
  overallQueryStatus: {
    status: 'UNINITIALIZED',
    elapsedMs: undefined,
    startTime: undefined,
  },
  editorMode: 'query',
  isQueryEditorDirty: false,
  dateRange: undefined,
};

const queryEditorSlice = createSlice({
  name: 'queryEditor',
  initialState,
  reducers: {
    setQueryEditorState: (_, action: PayloadAction<QueryEditorSliceState>) => action.payload,
    setOverallQueryStatus: (state, action: PayloadAction<QueryResultStatus>) => {
      state.overallQueryStatus = action.payload;
    },
    updateOverallQueryStatus: (state, action: PayloadAction<Partial<QueryResultStatus>>) => {
      state.overallQueryStatus = {
        ...state.overallQueryStatus,
        ...action.payload,
      };
    },
    setEditorMode: (state, action: PayloadAction<EditorMode>) => {
      state.editorMode = action.payload;
    },
    setIsQueryEditorDirty: (state, action: PayloadAction<boolean>) => {
      state.isQueryEditorDirty = action.payload;
    },
    setDateRange: (state, action: PayloadAction<{ from: string; to: string }>) => {
      state.dateRange = action.payload;
    },
  },
});

export const {
  setQueryEditorState,
  setOverallQueryStatus,
  updateOverallQueryStatus,
  setEditorMode,
  setIsQueryEditorDirty,
  setDateRange,
} = queryEditorSlice.actions;
export const queryEditorReducer = queryEditorSlice.reducer;
export const queryEditorInitialState = initialState;


