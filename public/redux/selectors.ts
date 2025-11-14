/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { RootState } from './store';

// Query selectors
export const selectQueryString = (state: RootState) => state.query.query;
export const selectQueryLanguage = (state: RootState) => state.query.language;
export const selectDataset = (state: RootState) => state.query.dataset;
export const selectQuery = (state: RootState) => state.query;

// Query Editor selectors
export const selectEditorMode = (state: RootState) => state.queryEditor.editorMode;
export const selectIsQueryEditorDirty = (state: RootState) => state.queryEditor.isQueryEditorDirty;
export const selectQueryStatus = (state: RootState) => state.queryEditor.overallQueryStatus;
export const selectDateRange = (state: RootState) => state.queryEditor.dateRange;

