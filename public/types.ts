/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Introduce a compile dependency on dashboards-assistant
 * as alerting need some types from the plugin.
 * It will give a type error when dashboards-assistant is not installed so add a ts-ignore to suppress the error.
 */
// @ts-ignore
export type { AssistantSetup, IMessage, RenderProps } from '../../dashboards-assistant/public';
