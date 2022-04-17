/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import { EuiButton, EuiEmptyPrompt, EuiText } from '@elastic/eui';

const filterText =
  'There are no destinations matching your applied filters. Reset your filters to view all destinations.';
const emptyText = 'There are no existing destinations.';

const resetFiltersButton = (resetFilters) => (
  <EuiButton fill onClick={resetFilters}>
    Reset filters
  </EuiButton>
);

const propTypes = {
  isFilterApplied: PropTypes.bool.isRequired,
  onResetFilters: PropTypes.func.isRequired,
};

const EmptyDestinations = ({ isFilterApplied, onResetFilters }) => (
  <EuiEmptyPrompt
    style={{ maxWidth: '45em' }}
    body={
      <EuiText>
        <p>{isFilterApplied ? filterText : emptyText}</p>
      </EuiText>
    }
    actions={isFilterApplied ? resetFiltersButton(onResetFilters) : undefined}
  />
);

EmptyDestinations.propTypes = propTypes;

export default EmptyDestinations;
