import React from 'react';
import {
  EuiText,
  EuiFormRow,
  EuiFlexItem,
  EuiFlexGroup,
  EuiFilterGroup,
  EuiFilterButton,
} from '@elastic/eui';

const SeverityLevel = ({ value, onChange }) => (
  <EuiFormRow
    label="Severity level"
    helpText={
      <EuiFlexGroup justifyContent="spaceBetween">
        <EuiFlexItem>
          <EuiText size="xs">Highest</EuiText>
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiText size="xs" textAlign="right">
            Lowest
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
    }
  >
    <EuiFilterGroup fullWidth>
      {['1', '2', '3', '4', '5'].map((level) => (
        <EuiFilterButton
          key={level}
          hasActiveFilters={level === value}
          isSelected={level === value}
          noDivider
          onClick={() => onChange({ target: { value: level } })}
        >
          {level}
        </EuiFilterButton>
      ))}
    </EuiFilterGroup>
  </EuiFormRow>
);

export default SeverityLevel;
