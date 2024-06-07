import React, { createContext, useState } from 'react';

const MultiDataSourceContext = createContext();

export const MultiDataSourceContextProvider = ({ children, value }) => {
  const [dataSourceId, setDataSourceId] = useState(value.dataSourceId);
  return (
    <MultiDataSourceContext.Provider value={{ dataSourceId, setDataSourceId }}>
      {children}
    </MultiDataSourceContext.Provider>
  );
};

export { MultiDataSourceContext };
