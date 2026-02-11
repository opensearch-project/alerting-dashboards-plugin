/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { selectDataset } from '../redux/selectors';
import { CoreContext } from '../utils/CoreContext';

interface DatasetContextValue {
  dataset: any | null;
  loading: boolean;
  error: string | null;
}

const DatasetContext = createContext<DatasetContextValue>({
  dataset: null,
  loading: false,
  error: null,
});

export const useDatasetContext = () => useContext(DatasetContext);

interface DatasetProviderProps {
  children?: React.ReactNode;
}

export const DatasetProvider: React.FC<DatasetProviderProps> = ({ children }) => {
  const dataset = useSelector(selectDataset);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const value: DatasetContextValue = {
    dataset,
    loading,
    error,
  };

  return <DatasetContext.Provider value={value}>{children}</DatasetContext.Provider>;
};

