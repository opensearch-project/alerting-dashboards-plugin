/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import { EuiFieldSearch, EuiFlexGroup, EuiFlexItem, EuiPagination, EuiSelect } from '@elastic/eui';
import { DESTINATION_OPTIONS } from '../../../utils/constants';

const filterTypes = [{ value: 'ALL', text: 'All type' }, ...DESTINATION_OPTIONS];

const propTypes = {
  activePage: PropTypes.number.isRequired,
  pageCount: PropTypes.number.isRequired,
  search: PropTypes.string,
  type: PropTypes.string,
  onSearchChange: PropTypes.func.isRequired,
  onTypeChange: PropTypes.func.isRequired,
  onPageClick: PropTypes.func.isRequired,
  allowList: PropTypes.array.isRequired,
};

const defaultProps = {
  search: '',
  type: 'ALL',
};

const DestinationsControls = ({
  activePage,
  pageCount,
  search,
  type,
  onSearchChange,
  onTypeChange,
  onPageClick,
  allowList,
}) => {
  const allowedOptions = DESTINATION_OPTIONS.filter((option) => allowList.includes(option.value));
  const filterTypes = [{ value: 'ALL', text: 'All type' }, ...allowedOptions];
  return (
    <EuiFlexGroup style={{ padding: '0px 5px' }}>
      <EuiFlexItem>
        <EuiFieldSearch
          fullWidth={true}
          value={search}
          placeholder="Search"
          onChange={onSearchChange}
        />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiSelect options={filterTypes} value={type} onChange={onTypeChange} />
      </EuiFlexItem>
      <EuiFlexItem grow={false} style={{ justifyContent: 'center' }}>
        <EuiPagination pageCount={pageCount} activePage={activePage} onPageClick={onPageClick} />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

DestinationsControls.propTypes = propTypes;

DestinationsControls.defaultProps = defaultProps;

export default DestinationsControls;
