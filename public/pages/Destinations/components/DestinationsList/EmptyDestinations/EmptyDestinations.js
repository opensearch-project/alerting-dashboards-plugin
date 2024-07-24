/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import { EuiSmallButton, EuiEmptyPrompt, EuiLink, EuiText } from '@elastic/eui';
import { getManageChannelsUrl } from '../../../../../utils/helpers';

const filterText = (hasNotificationPlugin) =>
  hasNotificationPlugin ? (
    <>
      <p>
        There are no destinations matching your applied filters. Reset your filters to view all
        destinations.
      </p>
      <p>
        Migrated destinations can be found in&nbsp;
        {<EuiLink href={getManageChannelsUrl()}>Notifications</EuiLink>}
      </p>
    </>
  ) : (
    <p>
      There are no destinations matching your applied filters. Reset your filters to view all
      destinations.
    </p>
  );

const emptyText = <p>There are no existing destinations.</p>;

const resetFiltersButton = (resetFilters) => (
  <EuiSmallButton fill onClick={resetFilters}>
    Reset filters
  </EuiSmallButton>
);

const propTypes = {
  isFilterApplied: PropTypes.bool.isRequired,
  onResetFilters: PropTypes.func.isRequired,
};

const EmptyDestinations = ({ hasNotificationPlugin, isFilterApplied, onResetFilters }) => (
  <EuiEmptyPrompt
    style={{ maxWidth: '45em' }}
    body={<EuiText>{isFilterApplied ? filterText(hasNotificationPlugin) : emptyText}</EuiText>}
    actions={isFilterApplied ? resetFiltersButton(onResetFilters) : undefined}
  />
);

EmptyDestinations.propTypes = propTypes;

export default EmptyDestinations;
