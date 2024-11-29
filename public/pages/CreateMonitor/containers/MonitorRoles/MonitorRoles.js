/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { EuiHealth, EuiHighlight } from '@elastic/eui';

import { FormikComboBox } from '../../../../components/FormControls';
import { createReasonableWait } from '../MonitorIndex/utils/helpers';

const propTypes = {
  httpClient: PropTypes.object.isRequired,
};

class MonitorRoles extends React.Component {
  constructor(props) {
    super(props);

    this.lastQuery = null;
    this.state = {
      isLoading: false,
      showingRoleQueryErrors: false,
      options: [],
      roles: [],
    };

    this.onSearchChange = this.onSearchChange.bind(this);
    this.handleQueryRoles = this.handleQueryRoles.bind(this);
    this.onFetch = this.onFetch.bind(this);
  }

  componentDidMount() {
    // Simulate initial load.
    this.onSearchChange('');
  }

  async onSearchChange(searchValue) {
    let query = searchValue;
    this.lastQuery = query;
    this.setState({ query, showingRoleQueryErrors: !!query.length });

    await this.onFetch(query);
  }

  async handleQueryRoles(rawRole) {
    const role = rawRole.trim();

    try {
      const response = await this.props.httpClient.post('../api/alerting/_roles', {
        body: JSON.stringify({ role }),
      });
      if (response.ok) {
        const roles = response.resp.map((role) => ({
          label: role,
          role,
        }));
        return _.sortBy(roles, 'label');
      }
      return [];
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  async onFetch(query) {
    this.setState({ isLoading: true });
    const roles = await this.handleQueryRoles(query);
    createReasonableWait(() => {
      // If the search changed, discard this state
      if (query !== this.lastQuery) {
        return;
      }
      this.setState({ roles, isLoading: false });
    });
  }

  render() {
    const { roles, isLoading } = this.state;

    const visibleOptions = [
      {
        label: 'Backend roles',
        options: roles,
      },
    ];

    return (
      <FormikComboBox
        name="roles"
        formRow
        rowProps={{
          label: 'Backend roles',
          helpText:
            'You can optionally assign one or more backend roles to the monitor (assigned roles have an effect only when filter_by_backend_roles is enabled)',
          style: { paddingLeft: '10px' },
        }}
        inputProps={{
          placeholder: 'Select backend roles',
          async: true,
          isLoading,
          options: visibleOptions,
          onBlur: (e, field, form) => {
            form.setFieldTouched('roles', true);
          },
          onChange: (options, field, form) => {
            form.setFieldValue('roles', options);
          },
          onSearchChange: this.onSearchChange,
          isClearable: true,
          singleSelection: false,
          'data-test-subj': 'rolesComboBox',
        }}
      />
    );
  }
}

MonitorRoles.propTypes = propTypes;

export default MonitorRoles;
