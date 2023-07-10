/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { FormikComboBox } from '../../../../components/FormControls';
import {
  hasError,
  isInvalid,
  required,
  validateDetector,
  validateMonitorName,
} from '../../../../utils/validate';
import { CoreContext } from '../../../../utils/CoreContext';
import { backendErrorNotification } from '../../../../utils/helpers';
import FormikFieldText from '../../../../components/FormControls/FormikFieldText';
import { getClient } from '../../../../services';

class AnomalyDetectors extends React.Component {
  static contextType = CoreContext;
  constructor(props) {
    super(props);
    this.state = {
      detectorOptions: [],
      isLoading: false,
    };
    this.searchDetectors = this.searchDetectors.bind(this);
  }
  async componentDidMount() {
    await this.searchDetectors();
  }

  async searchDetectors() {
    const httpClient = getClient();
    try {
      const response = await httpClient.post('../api/alerting/detectors/_search');
      if (response.ok) {
        const detectorOptions = response.detectors
          .filter((detector) => detector.detectionDateRange === undefined)
          .map((detector) => ({
            label: detector.name,
            value: detector.id,
            features: detector.featureAttributes,
            interval: detector.detectionInterval,
            resultIndex: detector.resultIndex,
          }));
        this.setState({ detectorOptions });
      } else {
        // TODO: 'response.ok' is 'false' when there is no anomaly-detection config index in the cluster, and notification should not be shown to new Anomaly-Detection users
        // backendErrorNotification(notifications, 'get', 'detectors', response.resp);
      }
    } catch (err) {
      console.error(err);
    }
  }

  render() {
    const { detectorOptions } = this.state;
    const { values, detectorId, flyoutMode } = this.props;
    //Default to empty
    let selectedOptions = [];
    let detectorName = '';
    if (detectorOptions.length > 0) {
      const adId = values.detectorId ? values.detectorId : detectorId;
      const selectedValue = detectorOptions.find((detector) => adId === detector.value);
      if (selectedValue) {
        selectedOptions = [selectedValue];
        detectorName = selectedValue.label;
      }
    }

    return (
      <div
        style={{
          maxWidth: flyoutMode ? '400px' : '390px',
        }}
      >
        {!flyoutMode && (
          <FormikComboBox
            name={'detectorId'}
            formRow
            rowProps={{
              label: 'Detector',
              isInvalid,
              error: hasError,
            }}
            fieldProps={{
              validate: (value) => validateDetector(value, selectedOptions[0]),
            }}
            inputProps={{
              placeholder: 'Select a detector',
              options: detectorOptions,
              onBlur: (e, field, form) => {
                form.setFieldTouched('detectorId', true);
              },
              onChange: (options, field, form) => {
                form.setFieldError('detectorId', undefined);
                form.setFieldValue('detectorId', get(options, '0.value', ''));
                form.setFieldValue('period', {
                  interval: 2 * get(options, '0.interval.period.interval'),
                  unit: get(options, '0.interval.period.unit', 'MINUTES').toUpperCase(),
                });
                form.setFieldValue('adResultIndex', get(options, '0.resultIndex'));
              },
              singleSelection: { asPlaintext: true },
              isClearable: false,
              selectedOptions,
            }}
          />
        )}
        {flyoutMode && (
          <FormikFieldText
            name="Detector"
            formRow
            rowProps={{
              label: 'Detector',
            }}
            inputProps={{
              value: detectorName,
              disabled: true,
            }}
          />
        )}
      </div>
    );
  }
}

AnomalyDetectors.propTypes = {
  values: PropTypes.object.isRequired,
  renderEmptyMessage: PropTypes.func.isRequired,
};

export default AnomalyDetectors;
