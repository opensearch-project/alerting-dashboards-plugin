/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { EuiHealth, EuiHighlight } from '@elastic/eui';

import { FormikComboBox } from '../../../../components/FormControls';
import { validateIndex, hasError, isInvalid } from '../../../../utils/validate';
import { canAppendWildcard, createReasonableWait, getMatchedOptions } from './utils/helpers';
import { MONITOR_TYPE } from '../../../../utils/constants';
import CrossClusterConfiguration from '../../components/CrossClusterConfigurations/containers';

const CustomOption = ({ option, searchValue, contentClassName }) => {
  const { health, label, index } = option;
  const isAlias = !!index;
  const healthToColor = {
    green: 'success',
    yellow: 'warning',
    red: 'danger',
    undefined: 'subdued',
  };
  const color = healthToColor[health];
  return (
    <EuiHealth color={color}>
      <span className={contentClassName}>
        <EuiHighlight search={searchValue}>{label}</EuiHighlight>
        {isAlias && <span>&nbsp;({index})</span>}
      </span>
    </EuiHealth>
  );
};

const propTypes = {
  httpClient: PropTypes.object.isRequired,
};

class MonitorIndex extends React.Component {
  constructor(props) {
    super(props);

    this.lastQuery = null;
    this.state = {
      isLoading: false,
      appendedWildcard: false,
      showingIndexPatternQueryErrors: false,
      options: [],
      allIndices: [],
      partialMatchedIndices: [],
      exactMatchedIndices: [],
      allAliases: [],
      partialMatchedAliases: [],
      exactMatchedAliases: [],
    };

    this.onCreateOption = this.onCreateOption.bind(this);
    this.onSearchChange = this.onSearchChange.bind(this);
    this.handleQueryIndices = this.handleQueryIndices.bind(this);
    this.handleQueryAliases = this.handleQueryAliases.bind(this);
    this.onFetch = this.onFetch.bind(this);
  }

  componentDidMount() {
    // Simulate initial load.
    this.onSearchChange('');
  }

  onCreateOption(searchValue, selectedOptions, setFieldValue, supportMultipleIndices) {
    const normalizedSearchValue = searchValue.trim().toLowerCase();

    if (!normalizedSearchValue) return;

    const newOption = { label: searchValue };
    if (supportMultipleIndices) setFieldValue('index', selectedOptions.concat(newOption));
    else setFieldValue('index', [newOption]);
  }

  async onSearchChange(searchValue) {
    const { appendedWildcard } = this.state;
    let query = searchValue;
    if (query.length === 1 && canAppendWildcard(query)) {
      query += '*';
      this.setState({ appendedWildcard: true });
    } else {
      if (query === '*' && appendedWildcard) {
        query = '';
        this.setState({ appendedWildcard: false });
      }
    }

    this.lastQuery = query;
    this.setState({ query, showingIndexPatternQueryErrors: !!query.length });

    await this.onFetch(query);
  }

  async handleQueryIndices(rawIndex) {
    const index = rawIndex.trim();

    // Searching for `*:` fails for CCS environments. The search request
    // is worthless anyways as the we should only send a request
    // for a specific query (where we do not append *) if there is at
    // least a single character being searched for.
    if (index === '*:') {
      return [];
    }

    // This should never match anything so do not bother
    if (index === '') {
      return [];
    }
    try {
      const response = await this.props.httpClient.post('../api/alerting/_indices', {
        body: JSON.stringify({ index }),
      });
      if (response.ok) {
        const indices = response.resp.map(({ health, index, status }) => ({
          label: index,
          health,
          status,
        }));
        return _.sortBy(indices, 'label');
      }
      return [];
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  async handleQueryAliases(rawAlias) {
    const alias = rawAlias.trim();

    if (alias === '*:') {
      return [];
    }

    if (alias === '') {
      return [];
    }

    try {
      const response = await this.props.httpClient.post('../api/alerting/_aliases', {
        body: JSON.stringify({ alias }),
      });
      if (response.ok) {
        const indices = response.resp.map(({ alias, index }) => ({ label: alias, index }));
        return _.sortBy(indices, 'label');
      }
      return [];
    } catch (err) {
      console.error(err);
      return [];
    }
  }

  async onFetch(query) {
    this.setState({ isLoading: true, indexPatternExists: false });
    if (query.endsWith('*')) {
      const exactMatchedIndices = await this.handleQueryIndices(query);
      const exactMatchedAliases = await this.handleQueryAliases(query);
      createReasonableWait(() => {
        // If the search changed, discard this state
        if (query !== this.lastQuery) {
          return;
        }
        this.setState({ exactMatchedIndices, exactMatchedAliases, isLoading: false });
      });
    } else {
      const partialMatchedIndices = await this.handleQueryIndices(`${query}*`);
      const exactMatchedIndices = await this.handleQueryIndices(query);
      const partialMatchedAliases = await this.handleQueryAliases(`${query}*`);
      const exactMatchedAliases = await this.handleQueryAliases(query);
      createReasonableWait(() => {
        // If the search changed, discard this state
        if (query !== this.lastQuery) {
          return;
        }

        this.setState({
          partialMatchedIndices,
          exactMatchedIndices,
          partialMatchedAliases,
          exactMatchedAliases,
          isLoading: false,
        });
      });
    }
  }

  renderOption(option, searchValue, contentClassName) {
    return (
      <CustomOption option={option} searchValue={searchValue} contentClassName={contentClassName} />
    );
  }

  render() {
    const { httpClient, remoteMonitoringEnabled } = this.props;
    const {
      isLoading,
      allIndices,
      partialMatchedIndices,
      exactMatchedIndices,
      allAliases,
      partialMatchedAliases,
      exactMatchedAliases,
    } = this.state;

    const { visibleOptions } = getMatchedOptions(
      allIndices, //all indices
      partialMatchedIndices,
      exactMatchedIndices,
      allAliases,
      partialMatchedAliases,
      exactMatchedAliases,
      false //isIncludingSystemIndices
    );

    let supportMultipleIndices = true;
    let supportsCrossClusterMonitoring = false;
    switch (this.props.monitorType) {
      case MONITOR_TYPE.DOC_LEVEL:
        supportMultipleIndices = false;
        supportsCrossClusterMonitoring = false;
        break;
      case MONITOR_TYPE.BUCKET_LEVEL:
      case MONITOR_TYPE.CLUSTER_METRICS:
      case MONITOR_TYPE.QUERY_LEVEL:
        supportsCrossClusterMonitoring = true;
        break;
      default:
    }

    return (
      <>
        {remoteMonitoringEnabled && supportsCrossClusterMonitoring ? (
          <CrossClusterConfiguration monitorType={this.props.monitorType} httpClient={httpClient} />
        ) : (
          <FormikComboBox
            name="index"
            formRow
            fieldProps={{ validate: validateIndex }}
            rowProps={{
              label: 'Index',
              helpText:
                'You can use a * as a wildcard or date math index resolution in your index pattern',
              isInvalid,
              error: hasError,
              style: { paddingLeft: '10px' },
            }}
            inputProps={{
              placeholder: supportMultipleIndices ? 'Select indices' : 'Select an index',
              async: true,
              isLoading,
              options: visibleOptions,
              onBlur: (e, field, form) => {
                form.setFieldTouched('index', true);
              },
              onChange: (options, field, form) => {
                form.setFieldValue('index', options);
              },
              onCreateOption: (value, field, form) => {
                this.onCreateOption(value, field.value, form.setFieldValue, supportMultipleIndices);
              },
              onSearchChange: this.onSearchChange,
              renderOption: this.renderOption,
              delimiter: ',',
              isClearable: true,
              singleSelection: supportMultipleIndices ? false : { asPlainText: true },
              'data-test-subj': 'indicesComboBox',
            }}
          />
        )}
      </>
    );
  }
}

MonitorIndex.propTypes = propTypes;

export default MonitorIndex;
