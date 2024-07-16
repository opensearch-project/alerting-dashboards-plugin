/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component } from 'react';
import { EuiSpacer } from '@elastic/eui';
import { connect } from 'formik';
import MinimalAccordion from '../../../../components/FeatureAnywhereContextMenu/MinimalAccordion';
import DataSource from '../DataSource'

class DataSourceFlyout extends Component<any, any> {
  constructor(props: any) {
    super(props);

    this.state = {
      accordionOpen: false,
    };
  }

  render() {
    return (
      <><MinimalAccordion
        {...{
          id: 'dataSource',
          isOpen: this.state.accordionOpen,
          onToggle: () => {this.setState({accordionOpen: !this.state.accordionOpen})},
          title: 'Data Source',
          subTitle: `Index: [${this.props.formik.values.index.map((index: {label: string} )=> index.label).join(",")}],  timeField: ${this.props.formik.values.timeField}`
          ,
        }}
      >
        <DataSource {...this.props} isMinimal={true}/>
      </MinimalAccordion><EuiSpacer size="xs" /></>
    );
  }
}

export default connect(DataSourceFlyout);
