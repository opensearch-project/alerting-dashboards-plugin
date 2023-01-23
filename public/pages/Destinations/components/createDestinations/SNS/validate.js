/*
 *   Copyright 2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 *   Licensed under the Apache License, Version 2.0 (the "License").
 *   You may not use this file except in compliance with the License.
 *   A copy of the License is located at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   or in the "license" file accompanying this file. This file is distributed
 *   on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 *   express or implied. See the License for the specific language governing
 *   permissions and limitations under the License.
 */

export const getSNSTopicARNRegExpPattern = () =>
  `^arn:aws(-[^:]+)?:sns:([a-zA-Z0-9-]+):([0-9]{12}):([a-zA-Z0-9-_]+)(\\.fifo)?$`;

export const getIAMRoleARNRegExpPattern = () =>
  `^arn:aws(-[^:]+)?:iam::([0-9]{12}):([a-zA-Z0-9-/_+=@.,]+)$`;

export const validateSNSTopicARN = (value) => {
  if (!value) return 'Required';
  const pattern = getSNSTopicARNRegExpPattern();
  const isValidARN = new RegExp(pattern).test(value);
  if (!isValidARN) return 'Invalid SNS topic ARN';
};

export const validateIAMRoleARN = (value) => {
  if (!value) return 'Required';
  const pattern = getIAMRoleARNRegExpPattern();
  const isValidARN = new RegExp(pattern).test(value);
  if (!isValidARN) return 'Invalid IAM role ARN';
};
