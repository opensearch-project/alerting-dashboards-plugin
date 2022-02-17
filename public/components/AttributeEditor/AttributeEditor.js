/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { EuiFlexGroup, EuiFlexItem, EuiButton, EuiText } from '@elastic/eui';

const propTypes = {
  titleText: PropTypes.string,
  emptyText: PropTypes.string,
  name: PropTypes.string.isRequired,
  items: PropTypes.array.isRequired,
  onAdd: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onRenderKeyField: PropTypes.func.isRequired,
  onRenderValueField: PropTypes.func.isRequired,
  addButtonText: PropTypes.string,
  removeButtonText: PropTypes.string,
  isEnabled: PropTypes.bool,
};
const defaultProps = {
  titleText: '',
  emptyText: 'No attributes found.',
  addButtonText: 'Add',
  removeButtonText: 'Remove',
  isEnabled: true,
};

const AttributeEditor = ({
  titleText,
  emptyText,
  name,
  items,
  onAdd,
  onRemove,
  onRenderKeyField,
  onRenderValueField,
  addButtonText,
  removeButtonText,
  isEnabled,
}) => {
  return (
    <EuiFlexGroup direction="column" alignItems="flexStart" style={{ paddingLeft: '10px' }}>
      {!_.isEmpty(titleText) ? (
        <EuiFlexItem>
          <EuiText size="xs">{titleText}</EuiText>
        </EuiFlexItem>
      ) : null}
      {!_.isEmpty(items) ? (
        items.map((item, index) => (
          <EuiFlexItem style={{ marginBottom: 0 }} key={`${name}.${index}.key`}>
            <EuiFlexGroup alignItems="center">
              <EuiFlexItem>
                {onRenderKeyField(`${name}.${index}.key`, index, isEnabled)}
              </EuiFlexItem>
              <EuiFlexItem>
                {onRenderValueField(`${name}.${index}.value`, index, isEnabled)}
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton
                  style={{ marginTop: 10 }}
                  size="s"
                  onClick={(e) => onRemove(index)}
                  disabled={!isEnabled}
                >
                  {removeButtonText}
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        ))
      ) : (
        <EuiFlexItem style={{ marginBottom: 0 }}>
          <EuiText size="xs"> {emptyText} </EuiText>
        </EuiFlexItem>
      )}
      <EuiFlexItem>
        <EuiButton size="s" onClick={onAdd} disabled={!isEnabled}>
          {addButtonText}
        </EuiButton>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

AttributeEditor.propTypes = propTypes;
AttributeEditor.defaultProps = defaultProps;

export default AttributeEditor;
