import React, { Component } from 'react';
import _ from 'lodash';
import ContentPanel from '../../../components/ContentPanel';
import { FlexibleWidthXYPlot, XAxis, HorizontalBarSeries, ChartLabel } from 'react-vis';
import { CLUSTER_METRICS } from '../../../../server/services/utils/constants';
import ClusterMetricLineGraph from './ClusterMetricLineGraph';
import ClusterMetricLineGraphMultiple from './ClusterMetricLineGraphMultiple';
import ClusterMetricsNode from './ClusterMetricsNode';

export default class ClusterMetricsGraphs extends Component {
  constructor(props) {
    super(props);

    this.state = {
      dataPoints: [],
      hint: null,
    };
  }
  componentDidMount() {
    this.getResponse();
  }

  static defaultProps = { annotation: false };

  color_map = {
    red: '#D0021B',
    green: '#6AAF35',
    yellow: '#FFFF4D',
  };

  async getResponse() {
    const { httpClient } = this.props;
    const body = {
      sort: [
        {
          'cluster_status.timestamp': { order: 'asc' },
        },
        {
          'unassigned_shards.timestamp': { order: 'asc' },
        },
        {
          'cpu_usage.timestamp': { order: 'asc' },
        },
        {
          'jvm_pressure.timestamp': { order: 'asc' },
        },
      ],
      query: {
        match_all: {},
      },
    };
    const resp = await httpClient.get(`/${CLUSTER_METRICS}/_search`, body);
    this.setState({ dataPoints: this.cleanResponse(resp) });
  }

  cleanResponse(resp) {
    const data = [];
    let array = _.get(resp, 'resp.hits.hits', []);
    for (let i = 0; i < array.length; i++) {
      const dataPoint = _.get(array, `${i}._source`);
      if (!_.isEmpty(dataPoint)) {
        data.push(dataPoint);
      }
    }
    return data;
  }

  sortData(data) {
    return data.sort((a, b) => a.x - b.x);
  }

  // start here later
  //implement sorting logic somewhere sometime
  cleanData(data, type) {
    let cleaned = [];
    for (let i = 0; i < data.length; i++) {
      let dataPoint = data[i];
      const dataPointType = Object.keys(dataPoint)[0];
      if (dataPointType === type) {
        dataPoint = _.get(dataPoint, `${type}`);
      }
      if (dataPointType === type && !_.includes(cleaned, dataPoint)) {
        cleaned.push(this.getXYValues(dataPoint));
      }
    }
    cleaned = this.sortData(cleaned);
    return cleaned;
  }

  cleanMinMaxData(data, type, path) {
    let cleaned = [];
    for (let i = 0; i < data.length; i++) {
      let dataPoint = data[i];
      const dataPointType = Object.keys(dataPoint)[0];
      if (dataPointType === type) {
        dataPoint = _.get(dataPoint, `${type}`);
      }
      if (dataPointType === type && !_.includes(cleaned, dataPoint)) {
        cleaned.push(this.getXYValuesMinMax(dataPoint, path));
      }
    }
    cleaned = this.sortData(cleaned);
    return cleaned;
  }

  cleanBarData(data) {
    const cleaned = [];
    for (let i = 0; i < data.length - 1; i++) {
      cleaned.push(this.getXXYValues(data[i], data[i + 1]));
    }
    cleaned.push(this.getXXYValues(data[data.length - 1], data[data.length - 1]));
    return cleaned;
  }

  getXYValues(data) {
    const x = new Date(_.get(data, 'timestamp'));
    const y = _.get(data, 'value');
    return { x, y };
  }

  getXYValuesMinMax(data, minOrMax) {
    const x = new Date(_.get(data, 'timestamp'));
    const y = _.get(data, minOrMax);
    return { x, y };
  }

  getXXYValues(data0, data) {
    const x0 = data0.x;
    const x = data.x;
    const y = data0.y;
    return { x0, x, y };
  }

  renderBarPlot = (data) => {
    const xDomain_bar = [data[0].x0, data[data.length - 1].x];
    const xTitle = 'Time';
    return (
      <ContentPanel title="Cluster Status" titleSize="s" panelStyles={{ paddingLeft: '10px' }}>
        <FlexibleWidthXYPlot
          height={100}
          margin={{ top: 20, right: 20, bottom: 50 }}
          xDomain={xDomain_bar}
          xType="time"
          yType="ordinal"
          getColor={(dataPoint) => this.color_map[dataPoint.y]}
          getY={() => 0}
        >
          <HorizontalBarSeries data={data} colorType="literal" />
          <XAxis />
          <ChartLabel text={xTitle} xPercent={0.965} yPercent={0.5} />
        </FlexibleWidthXYPlot>
      </ContentPanel>
    );
  };

  render() {
    const { dataPoints } = this.state;

    if (!_.isEmpty(dataPoints)) {
      const unassigned_shards_data = this.cleanData(dataPoints, 'unassigned_shards');
      const cpu_data = this.cleanData(dataPoints, 'cpu_usage');

      const min_jvm = this.cleanMinMaxData(dataPoints, 'jvm_pressure', 'minimum');
      const max_jvm = this.cleanMinMaxData(dataPoints, 'jvm_pressure', 'maximum');

      const min_cpu = this.cleanMinMaxData(dataPoints, 'cpu_usage', 'minimum');
      const max_cpu = this.cleanMinMaxData(dataPoints, 'cpu_usage', 'maximum');

      const jvm_pressure = this.cleanData(dataPoints, 'jvm_pressure');
      const cluster_status_data = this.cleanData(dataPoints, 'cluster_status');
      const cleaned_status = this.cleanBarData(cluster_status_data);
      const number_pending_tasks = this.cleanData(dataPoints, 'number_of_pending_tasks');
      const active_shards = this.cleanData(dataPoints, 'active_shards');
      const relocating_shards = this.cleanData(dataPoints, 'relocating_shards');
      const number_total_nodes = this.cleanData(dataPoints, 'number_of_nodes');
      const number_data_nodes = this.cleanData(dataPoints, 'number_of_data_nodes');

      return (
        <>
          {this.renderBarPlot(cleaned_status)}
          <ClusterMetricsNode
            data={number_total_nodes}
            dataNodes={number_data_nodes}
            type={'Nodes Data'}
          />
          <ClusterMetricLineGraphMultiple
            data={cpu_data}
            dataMin={min_cpu}
            dataMax={max_cpu}
            type={'CPU Data'}
          />
          <ClusterMetricLineGraphMultiple
            data={jvm_pressure}
            dataMin={min_jvm}
            dataMax={max_jvm}
            type={'JVM Pressure'}
          />
          <ClusterMetricLineGraph data={unassigned_shards_data} type={'Unassigned Shards'} />
          <ClusterMetricLineGraph data={active_shards} type={'Active Shards'} />
          <ClusterMetricLineGraph data={relocating_shards} type={'Relocating Shards'} />
          <ClusterMetricLineGraph data={number_pending_tasks} type={'Number of Pending Tasks'} />
        </>
      );
    } else {
      return 'Loading...';
    }
  }
}
