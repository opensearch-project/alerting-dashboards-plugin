/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import { CoreContext } from '../../../../utils/CoreContext';
import { AD_PREVIEW_DAYS, DEFAULT_PREVIEW_ERROR_MSG } from '../../../../utils/constants';
import { backendErrorNotification } from '../../../../utils/helpers';

class AnomalyDetectorData extends React.Component {
  static contextType = CoreContext;
  constructor(props) {
    super(props);
    this.state = {
      anomalyResult: {
        anomalies: [],
        featureData: {},
      },
      detector: {
        featureAttributes: [],
      },
      previewStartTime: 0,
      previewEndTime: 0,
      isLoading: false,
      error: '',
    };
    this.getPreviewData = this.getPreviewData.bind(this);
  }

  async componentDidMount() {
    await this.getPreviewData();
  }

  async componentDidUpdate(prevProps) {
    if (prevProps.detectorId !== this.props.detectorId) {
      await this.getPreviewData();
    }
  }

  getPreviewErrorMessage(err) {
    if (typeof err === 'string') return err;
    if (err) {
      if (err.msg === 'Bad Request') {
        return err.response || DEFAULT_PREVIEW_ERROR_MSG;
      }
      if (err.msg) return err.msg;
    }
    return DEFAULT_PREVIEW_ERROR_MSG;
  }

  async getPreviewData() {
    const { detectorId, startTime, endTime } = this.props;
    const { http: httpClient, notifications } = this.context;
    this.setState({
      isLoading: true,
    });
    if (!detectorId) return;
    const requestParams = {
      startTime: startTime,
      endTime: endTime,
      preview: this.props.preview,
    };
    try {
      const response = await httpClient.get(`../api/alerting/detectors/${detectorId}/results`, {
        query: requestParams,
      });
      if (response.ok) {
        const { anomalyResult, detector } = response.response;
        this.setState({
          ...this.state,
          anomalyResult,
          detector,
          previewStartTime: requestParams.startTime,
          previewEndTime: requestParams.endTime,
          isLoading: false,
        });
      } else {
        this.setState({
          isLoading: false,
          error: getPreviewErrorMessage(response.error),
        });
        backendErrorNotification(notifications, 'get', 'detector results', response.error);
      }
    } catch (err) {
      console.error('Unable to get detectorResults', err);
      this.setState({
        isLoading: false,
        error: err,
      });
    }
  }
  render() {
    const { render } = this.props;
    return render({ ...this.state });
  }
}

AnomalyDetectorData.propTypes = {
  detectorId: PropTypes.string.isRequired,
  preview: PropTypes.bool,
};
AnomalyDetectorData.defaultProps = {
  preview: true,
  startTime: moment().subtract(AD_PREVIEW_DAYS, 'd').valueOf(),
  endTime: moment().valueOf(),
};

export { AnomalyDetectorData };
