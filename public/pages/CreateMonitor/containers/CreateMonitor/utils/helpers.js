/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import queryString from 'query-string';
import { FORMIK_INITIAL_VALUES } from './constants';
import monitorToFormik from './monitorToFormik';
import { formikToMonitor } from './formikToMonitor';
import { MONITOR_TYPE } from '../../../../../utils/constants';
import { initializeFromQueryParams } from './monitorQueryParams';
import { backendErrorNotification, getDigitId } from '../../../../../utils/helpers';
import {
  formikToTrigger,
  formikToTriggerUiMetadata,
} from '../../../../CreateTrigger/containers/CreateTrigger/utils/formikToTrigger';
import { triggerToFormik } from '../../../../CreateTrigger/containers/CreateTrigger/utils/triggerToFormik';
import { TRIGGER_TYPE } from '../../../../CreateTrigger/containers/CreateTrigger/utils/constants';
import { getInitialTriggerValues } from '../../../../CreateTrigger/components/AddTriggerButton/utils';
import { AGGREGATION_TYPES } from '../../../components/MonitorExpressions/expressions/utils/constants';
import { getDataSourceQueryObj } from '../../../../utils/helpers';

export const getInitialValues = ({
  title,
  index,
  timeField,
  flyoutMode,
  location,
  monitorToEdit,
  edit,
  searchType,
  detectorId,
  embeddable,
}) => {
  let initialValues = _.mergeWith(
    {},
    _.cloneDeep(FORMIK_INITIAL_VALUES),
    initializeFromQueryParams(queryString.parse(location.search)),
    (initialValue, queryValue) => (_.isEmpty(queryValue) ? initialValue : queryValue)
  );

  // Check for query transfer from Explore via sessionStorage
  const params = queryString.parse(location.search);
  const transferKey = params?.qkey;
  if (transferKey && typeof transferKey === 'string') {
    try {
      const transferData = sessionStorage.getItem(transferKey);
      if (transferData) {
        const parsed = JSON.parse(transferData);
        console.log('[getInitialValues] Loaded query from sessionStorage (length:', parsed.query?.length, ')');
        if (parsed.query) {
          initialValues.pplQuery = parsed.query;
          initialValues.monitor_mode = 'ppl';
          initialValues.searchType = 'query';
        }
        if (parsed.dataSourceId) {
          initialValues.dataSourceId = parsed.dataSourceId;
        }
        // Clean up after reading
        sessionStorage.removeItem(transferKey);
      }
    } catch (err) {
      console.error('[getInitialValues] Failed to load query from sessionStorage:', err);
    }
  }

  // allow ?mode=ppl to deep-link into the new flow
  if (params?.mode === 'ppl') {
    initialValues.monitor_mode = 'ppl';
    initialValues.searchType = 'query'; // keep legacy UIs happy
  }

  if (initialValues?.pplQuery && !initialValues.monitor_mode) {
    initialValues.monitor_mode = 'ppl';
    if (!initialValues.searchType) initialValues.searchType = 'query';
  }

  if (flyoutMode) {
    console.log('[getInitialValues] flyoutMode detected, embeddable:', embeddable);
    
    initialValues.name = `${title} ${getDigitId()}`;
    initialValues.index = index;
    initialValues.timeField = timeField;

    // Add trigger
    const monitorType = initialValues.monitor_type;
    const initialTrigger = getInitialTriggerValues({ flyoutMode, monitorType, triggers: [] });
    initialValues.triggerDefinitions = [initialTrigger];

    // Add aggregations
    initialValues.aggregations = getMetricAgg(embeddable);

    // Extract query from embeddable if available
    try {
      console.log('[getInitialValues] Attempting to extract query from embeddable...');
      console.log('[getInitialValues] Full embeddable structure:', JSON.stringify(embeddable, null, 2));
      
      const searchSource = embeddable?.vis?.data?.searchSource;
      console.log('[getInitialValues] searchSource:', searchSource);
      
      let extractedQuery = null;
      
      if (searchSource) {
        const serialized = searchSource.getSerializedFields?.();
        console.log('[getInitialValues] Serialized search source:', JSON.stringify(serialized, null, 2));
        
        const query = serialized?.query || searchSource.getField?.('query');
        console.log('[getInitialValues] Query from searchSource:', JSON.stringify(query, null, 2));
        
        if (query && (query.language === 'PPL' || query.language === 'ppl')) {
          extractedQuery = query.query || query.queryString || '';
          console.log('[getInitialValues] PPL query extracted from searchSource (length: ' + extractedQuery.length + '):', extractedQuery);
        }
      }
      
      // Also check if embeddable has query directly
      const embQuery = embeddable?.vis?.data?.query;
      console.log('[getInitialValues] embeddable.vis.data.query:', JSON.stringify(embQuery, null, 2));
      if (embQuery && (embQuery.language === 'PPL' || embQuery.language === 'ppl')) {
        const embQueryStr = embQuery.query || embQuery.queryString || '';
        console.log('[getInitialValues] PPL query found in embeddable.vis.data.query (length: ' + embQueryStr.length + '):', embQueryStr);
        // Use this if we haven't found one yet, or if it's longer (more complete)
        if (!extractedQuery || embQueryStr.length > extractedQuery.length) {
          extractedQuery = embQueryStr;
        }
      }
      
      // Check vis.params for stored query
      const visParams = embeddable?.vis?.params;
      console.log('[getInitialValues] embeddable.vis.params:', JSON.stringify(visParams, null, 2));
      if (visParams?.query) {
        console.log('[getInitialValues] Query in vis.params:', visParams.query);
        if (typeof visParams.query === 'string' && visParams.query.length > 0) {
          if (!extractedQuery || visParams.query.length > extractedQuery.length) {
            extractedQuery = visParams.query;
            console.log('[getInitialValues] Using query from vis.params (length: ' + extractedQuery.length + ')');
          }
        }
      }
      
      // If we found a PPL query, use it
      if (extractedQuery && extractedQuery.trim().length > 0) {
        console.log('[getInitialValues] Final extracted query (length: ' + extractedQuery.length + '):', extractedQuery);
        console.log('[getInitialValues] Query line count:', extractedQuery.split('\n').length);
        initialValues.monitor_mode = 'ppl';
        initialValues.searchType = 'query';
        initialValues.pplQuery = extractedQuery;
      } else {
        console.warn('[getInitialValues] No PPL query found in embeddable');
      }
    } catch (err) {
      console.error('[getInitialValues] Error extracting query from embeddable:', err);
      console.error('[getInitialValues] Error stack:', err.stack);
    }

    if (searchType) {
      initialValues.searchType = searchType;
    }

    if (detectorId) {
      initialValues.detectorId = detectorId;
      initialValues.period = { interval: 20, unit: 'MINUTES' };
    }
  }

  if (edit && monitorToEdit) {
    const triggers = triggerToFormik(_.get(monitorToEdit, 'triggers', []), monitorToEdit);
    initialValues = {
      ...monitorToFormik(monitorToEdit),
      triggerDefinitions: triggers.triggerDefinitions,
    };
  const isPpl =
    initialValues?.query_language === 'ppl' ||
    monitorToEdit?.query_language === 'ppl' ||
    !!monitorToEdit?.ppl_monitor ||
    !!monitorToEdit?.monitor_v2?.ppl_monitor;
    initialValues.monitor_mode = isPpl ? 'ppl' : 'legacy';
    if (isPpl) {
      initialValues.searchType = 'query';
      initialValues.pplQuery =
        initialValues.pplQuery ||
        _.get(monitorToEdit, 'ppl_monitor.query') ||
        _.get(monitorToEdit, 'query') ||
        '';
    }
  }

  return initialValues;
};

const getMetricAgg = (embeddable) => {
  let aggregationType = AGGREGATION_TYPES[1].value;
  let fieldName = '';
  if (embeddable?.vis?.data?.aggs?.aggs.length === 1) {
    const agg = embeddable.vis.data.aggs.aggs[0];
    if (agg.schema === 'metric' && !(aggregationType && fieldName) && agg.params.field) {
      aggregationType = agg.__type.dslName;
      fieldName = agg.params.field.spec.name;
    }
  }
  return [
    {
      aggregationType: aggregationType,
      fieldName: fieldName,
    },
  ];
};

export const getPlugins = async (httpClient) => {
  try {
    const dataSourceQuery = getDataSourceQueryObj();
    const pluginsResponse = await httpClient.get('/api/alerting/_plugins', dataSourceQuery);
    if (pluginsResponse.ok) {
      return pluginsResponse.resp.map((plugin) => plugin.component);
    } else {
      console.error('There was a problem getting plugins list');
      return [];
    }
  } catch (e) {
    console.error('There was a problem getting plugins list', e);
    return [];
  }
};

export const prepareTriggers = ({
  trigger,
  triggerMetadata,
  monitor,
  edit,
  triggerToEdit = [],
}) => {
  const { ui_metadata: uiMetadata = {}, triggers, monitor_type } = monitor;
  let updatedTriggers;
  let updatedUiMetadata;

  if (edit) {
    updatedTriggers = _.isArray(trigger) ? trigger.concat(triggers) : [trigger].concat(triggers);
    updatedUiMetadata = {
      ...uiMetadata,
      triggers: { ...uiMetadata.triggers, ...triggerMetadata },
    };
  } else {
    const updatedTriggersMetadata = _.cloneDeep(uiMetadata.triggers || {});

    let triggerType;
    switch (monitor_type) {
      case MONITOR_TYPE.BUCKET_LEVEL:
        triggerType = TRIGGER_TYPE.BUCKET_LEVEL;
        break;
      case MONITOR_TYPE.DOC_LEVEL:
        triggerType = TRIGGER_TYPE.DOC_LEVEL;
        break;
      case MONITOR_TYPE.COMPOSITE_LEVEL:
        triggerType = TRIGGER_TYPE.COMPOSITE_LEVEL;
        break;
      default:
        triggerType = TRIGGER_TYPE.QUERY_LEVEL;
        break;
    }

    if (_.isArray(triggerToEdit)) {
      const names = triggerToEdit.map((entry) => _.get(entry, `${triggerType}.name`));
      names.forEach((name) => delete updatedTriggersMetadata[name]);
      updatedTriggers = _.cloneDeep(trigger);
    } else {
      const { name } = _.get(triggerToEdit, `${triggerType}`);
      delete updatedTriggersMetadata[name];

      const findTriggerName = (element) => {
        return name === _.get(element, `${triggerType}.name`);
      };

      const indexToUpdate = _.findIndex(triggers, findTriggerName);
      updatedTriggers = triggers.slice();
      updatedTriggers.splice(indexToUpdate, 1, trigger);
    }

    updatedUiMetadata = {
      ...uiMetadata,
      triggers: { ...updatedTriggersMetadata, ...triggerMetadata },
    };
  }

  return { triggers: updatedTriggers, ui_metadata: updatedUiMetadata };
};

export const create = async ({
  monitor,
  formikBag,
  httpClient,
  notifications,
  history,
  onSuccess,
}) => {
  const { setSubmitting } = formikBag;

  try {
    const isWorkflow = monitor.workflow_type === MONITOR_TYPE.COMPOSITE_LEVEL;
    const creationPool = isWorkflow ? 'workflows' : 'monitors';
    const dataSourceQuery = getDataSourceQueryObj();
    const resp = await httpClient.post(`/api/alerting/${creationPool}`, {
      body: JSON.stringify(monitor),
      query: dataSourceQuery?.query,
    });

    if (resp.ok) {
      // IMPORTANT: end the Formik submit state BEFORE navigating to avoid setState on unmounted
      setSubmitting(false);

      history.push(`/monitors/${resp.resp._id}?type=${isWorkflow ? 'workflow' : 'monitor'}`);

      if (onSuccess) {
        onSuccess({ monitor: { _id: resp.resp._id, ...monitor } });
      }
    } else {
      setSubmitting(false);
      console.log('Failed to create:', resp);
      backendErrorNotification(notifications, 'create', 'monitor', resp.resp);
    }
  } catch (err) {
    console.error(err);
    formikBag.setSubmitting(false);
  }
};

export const update = async ({ history, updateMonitor, notifications, monitor, formikBag }) => {
  const { setSubmitting } = formikBag;
  const updatedMonitor = _.cloneDeep(monitor);
  try {
    const isWorkflow = updatedMonitor.workflow_type === MONITOR_TYPE.COMPOSITE_LEVEL;
    const resp = await updateMonitor(updatedMonitor);
    setSubmitting(false);
    const { ok, id } = resp;
    if (ok) {
      notifications.toasts.addSuccess(`Monitor "${monitor.name}" successfully updated.`);
      history.push(`/monitors/${id}?type=${isWorkflow ? 'workflow' : 'monitor'}`);
    } else {
      console.log('Failed to update:', resp);
    }
  } catch (err) {
    console.error(err);
    setSubmitting(false);
  }
};

export const submit = ({
  values,
  formikBag,
  edit,
  triggerToEdit,
  history,
  updateMonitor,
  notifications,
  httpClient,
  onSuccess,
}) => {
  let monitor = formikToMonitor(values);

  if (!_.isEmpty(_.get(values, 'triggerDefinitions'))) {
    const monitorUiMetadata = _.get(monitor, 'ui_metadata', {});
    const triggerMetadata = formikToTriggerUiMetadata(values, monitorUiMetadata);
    const triggers = prepareTriggers({
      trigger: formikToTrigger(values, monitorUiMetadata),
      triggerMetadata,
      monitor,
      edit,
      triggerToEdit,
    });
    monitor = { ...monitor, ...triggers };
  }

  if (edit) {
    update({ history, updateMonitor, notifications, monitor, formikBag });
  } else {
    create({ history, monitor, formikBag, httpClient, notifications, onSuccess });
  }
};

/** ----------------------------------------------------------------
 * New helpers (Alerting V2 / PPL)
 * ---------------------------------------------------------------*/

/**
 * Small service wrapper that calls the server (proxy) API for V2 routes.
 * (Preview is handled via /_plugins/_ppl; only create/update live here.)
 */
export const makeAlertingV2Service = (httpClient) => {
  const base = '/api/alerting/v2';

  const withDataSource = () => {
    const ds = getDataSourceQueryObj();
    return ds?.query || {};
  };

  return {
    /** Create a PPL Monitor V2 */
    createMonitor: async (body, { dataSourceId } = {}) => {
      const query = withDataSource();
      if (dataSourceId) query['dataSourceId'] = dataSourceId;
      const r = await httpClient.post(`${base}/monitors`, {
        body: JSON.stringify(body),
        query,
      });
      if (!r.ok) throw r.resp || r;
      return r.resp;
    },

    /** Update an existing PPL Monitor V2 */
    updateMonitor: async (id, body, { ifSeqNo, ifPrimaryTerm, dataSourceId } = {}) => {
      const query = withDataSource();
      if (dataSourceId) query['dataSourceId'] = dataSourceId;
      if (Number.isFinite(ifSeqNo)) query['if_seq_no'] = ifSeqNo;
      if (Number.isFinite(ifPrimaryTerm)) query['if_primary_term'] = ifPrimaryTerm;
      const r = await httpClient.put(`${base}/monitors/${encodeURIComponent(id)}`, {
        body: JSON.stringify(body),
        query,
      });
      if (!r.ok) throw r.resp || r;
      return r.resp;
    },

    /** V2: Get alerts (replaces legacy monitors/alerts) */
    getAlerts: async ({ monitorId, size = 200, from = 0 } = {}) => {
      const query = withDataSource();
      if (monitorId) query.monitorId = monitorId;
      query.size = size;
      query.from = from;
      const r = await httpClient.get(`${base}/alerts`, { query });
      if (!r.ok) throw r.resp || r;
      return r.resp;
    },
  };
};

// Normalize timezone coming from formik (can be array/object/string)
const getTimezoneString = (values) => {
  const tz = values?.timezone;
  // EUI often stores single-selects as arrays of {label, value}
  if (Array.isArray(tz) && tz.length) {
    return tz[0]?.label || tz[0]?.value || 'UTC';
  }
  if (tz && typeof tz === 'object') {
    return tz.label || tz.value || 'UTC';
  }
  if (typeof tz === 'string' && tz.trim()) return tz;
  return 'UTC';
};

export const pplToV2Schedule = (values) => {
  const tz = getTimezoneString(values);
  const freq = values.frequency;

  if (freq === 'interval') {
    // Keep unit uppercase to match API spec: MINUTES | HOURS | DAYS
    const unit = (values.period?.unit || 'MINUTES').toUpperCase();
    return {
      period: {
        interval: values.period?.interval === '' ? 1 : Number(values.period?.interval || 1),
        unit: unit,
      },
    };
  }

  if (freq === 'daily') {
    // `daily` is expected to be "<minute> <hour>" like legacy buildSchedule
    const daily = values.daily || '0 0';
    return { cron: { expression: `0 ${daily} * * *`, timezone: tz } };
  }

  if (freq === 'weekly') {
    const daily = values.daily || '0 0';
    const daysOfWeek = Object.entries(values.weekly || {})
      .filter(([_, checked]) => checked)
      .map(([dayName]) => dayName.toUpperCase())
      .join(',');
    return { cron: { expression: `0 ${daily} * * ${daysOfWeek || '*'}`, timezone: tz } };
  }

  if (freq === 'monthly') {
    const daily = values.daily || '0 0';
    const { type, day } = values.monthly || {};
    const dayOfMonth = type === 'day' ? day : '?';
    return { cron: { expression: `0 ${daily} ${dayOfMonth} */1 *`, timezone: tz } };
  }

  if (freq === 'cronExpression' && values.cronExpression) {
    return { cron: { expression: values.cronExpression, timezone: tz } };
  }

  // Fallback: 1 minute interval
  return {
    period: {
      interval: 1,
      unit: 'MINUTES', // uppercase to match API spec
    },
  };
};

/** Convert a triggerDefinition from Formik -> ppl trigger payload */
const formikPplTriggerToWire = (t, i = 0) => {
  // Map any legacy enums or friendly labels to backend-supported symbols
  const normalizeNumCondition = (raw) => {
    const v = String(raw ?? '').trim().toLowerCase();
    switch (v) {
      case 'above':
      case 'greater than':
      case '>':
        return '>';
      case 'at least':
      case 'greater than or equal to':
      case '>=':
        return '>=';
      case 'below':
      case 'less than':
      case '<':
        return '<';
      case 'at most':
      case 'less than or equal to':
      case '<=':
        return '<=';
      case 'equal':
      case 'equals':
      case '==':
        return '==';
      case 'not equal':
      case '!=':
        return '!=';
      default:
        return '>='; // safe default
    }
  };
  const normalizeSeverity = (s) => {
    const v = String(s ?? '').toLowerCase();
    if (['info', 'low', 'medium', 'high', 'critical', 'error'].includes(v)) return v;
    if (v === '0') return 'info';
    if (v === '1') return 'low';
    if (v === '2') return 'medium';
    if (v === '3') return 'high';
    if (v === '4') return 'critical';
    return 'info';
  };

  // Convert duration to long integer MINUTES for throttle/expires fields
  const durationToMinutes = (raw) => {
    if (!raw) return null;
    
    // If it's already a number, assume it's minutes
    if (typeof raw === 'number') {
      return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : null;
    }
    
    // If it's a string like "5m", "7d", parse it
    if (typeof raw === 'string') {
      const match = raw.trim().match(/^(\d+)\s*([smhd]?)$/i);
      if (match) {
        const val = Number(match[1]);
        const unit = (match[2] || 'm').toLowerCase();
        
        if (unit === 's') return Math.max(1, Math.ceil(val / 60));
        if (unit === 'm') return Math.floor(val);
        if (unit === 'h') return Math.floor(val * 60);
        if (unit === 'd') return Math.floor(val * 60 * 24);
      }
      return null;
    }
    
    // If it's an object with {value, unit}
    if (typeof raw === 'object' && raw.value) {
      const val = Number(raw.value);
      if (!Number.isFinite(val) || val <= 0) return null;
      
      const unit = String(raw.unit || 'minutes').toLowerCase();
      if (unit.startsWith('minute')) return Math.floor(val);
      if (unit.startsWith('hour')) return Math.floor(val * 60);
      if (unit.startsWith('day')) return Math.floor(val * 60 * 24);
      return Math.floor(val); // default to minutes
    }
    
    return null;
  };

  const type = (t?.uiConditionType || t?.type || t?.conditionType || 'number_of_results').toLowerCase();
  const isNum = type === 'number_of_results';

  const throttle = durationToMinutes(t?.suppress ?? t?.throttle);
  const expires = durationToMinutes(t?.expires ?? t?.queryLevelTrigger?.expires);

  // Clean up actions to only include required fields for PPL v2
  const cleanActions = (actions) => {
    if (!Array.isArray(actions)) return [];
    return actions.map(a => ({
      name: a.name,
      destination_id: a.destination_id,
      message_template: a.message_template,
      ...(a.subject_template ? { subject_template: a.subject_template } : {}),
    }));
  };

  const trigger = {
    name: t?.name || `trigger${i + 1}`,
    severity: normalizeSeverity(t?.severity),
    actions: cleanActions(t?.actions),
    mode: (t?.mode || 'result_set').toLowerCase(), // 'result_set' | 'per_result'
    type, // 'number_of_results' | 'custom'
    num_results_condition: isNum ? normalizeNumCondition(t?.num_results_condition || t?.thresholdEnum) : null,
    num_results_value: isNum ? Number(t?.num_results_value ?? t?.thresholdValue ?? 1) : null,
    custom_condition: !isNum ? (t?.custom_condition || t?.customCondition || null) : null,
  };

  // Preserve trigger ID if it exists (for updates)
  if (t?.id) {
    trigger.id = t.id;
  }

  // Add optional fields only if they have values (long integers in minutes)
  // Use the _minutes suffix as required by the API
  if (throttle !== null) {
    trigger.throttle_minutes = throttle;
  }
  if (expires !== null) {
    trigger.expires_minutes = expires;
  }

  return trigger;
};

/**
 * Build the Monitor V2 (PPL) payload expected by backend.
 * Shape: { "ppl_monitor": { name, enabled, schedule, query, triggers, look_back_window_minutes?, timestamp_field? } }
 */
export const buildPPLMonitorFromFormik = (values) => {
  const schedule = pplToV2Schedule(values);
  const lookBack = buildLookBackFromFormik(values); // returns integer in minutes or null

  const defs = Array.isArray(values.triggerDefinitions) ? values.triggerDefinitions : [];
  const triggers = defs.length
    ? defs.map((t, i) => formikPplTriggerToWire(t, i))
    : [
        {
          name: 'trigger1',
          severity: 'info',
          actions: [],
          mode: 'result_set',
          type: 'number_of_results',
          num_results_condition: '>=',
          num_results_value: 1,
          custom_condition: null,
          expires_minutes: 10080, // 7 days in minutes
        },
      ];

  const monitor = {
    name: values.name || 'Untitled monitor',
    description: values.description || '',
    enabled: !values.disabled,
    schedule,
    query: values.pplQuery || '',
    triggers,
  };

  // Add look_back_window_minutes and timestamp_field together (both required)
  if (lookBack && values.timestampField) {
    monitor.look_back_window_minutes = lookBack;
    monitor.timestamp_field = values.timestampField;
  }

  // Wrap in ppl_monitor object
  return {
    ppl_monitor: monitor,
  };
};


/** Build look back window as long integer MINUTES from Formik values */
const buildLookBackFromFormik = (values) => {
  const enabled = values?.useLookBackWindow ?? true;
  if (!enabled) return null;
  
  const n = Number(values?.lookBackAmount ?? 1);
  const amt = Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
  const unit = String(values?.lookBackUnit || 'hours').toLowerCase();
  
  // Convert to minutes (long integer)
  if (unit.startsWith('minute')) return Math.floor(amt);
  if (unit.startsWith('hour')) return Math.floor(amt * 60);
  if (unit.startsWith('day')) return Math.floor(amt * 60 * 24);
  
  // Default to minutes
  return Math.floor(amt);
};

/**
 * Extract index names from a PPL query using regex.
 * Regex: source(?:\s*)=(?:\s*)([-\w.*'+]+(?:\*)?(?:\s*,\s*[-\w.*'+]+\*?)*)\s*\|*
 * Returns array of index names or empty array if no match.
 */
export const extractIndicesFromPPL = (pplQuery) => {
  if (!pplQuery || typeof pplQuery !== 'string') return [];

  // Regex supports backtick-wrapped or plain index names, e.g. source=`foo`,`bar` or source=foo,bar
  const regex = /source\s*=\s*((?:`[^`]+`|[-\w.*'+]+)(?:\s*,\s*(?:`[^`]+`|[-\w.*'+]+))*)/i;
  const match = pplQuery.match(regex);

  if (!match || !match[1]) return [];

  return match[1]
    .split(',')
    .map((idx) => idx.trim())
    .map((idx) => (idx.startsWith('`') && idx.endsWith('`') ? idx.slice(1, -1) : idx))
    .filter(Boolean);
};

/**
 * Fetch mappings for given indices and find date fields common to all indices.
 * Returns { commonDateFields: string[], error: string | null }
 */
export const findCommonDateFields = async (httpClient, indices, dataSourceId) => {
  if (!indices || indices.length === 0) {
    return { commonDateFields: [], error: 'No indices specified' };
  }

  try {
    const dataSourceQuery = getDataSourceQueryObj();
    const query = { ...(dataSourceQuery?.query || {}) };
    if (dataSourceId) query['dataSourceId'] = dataSourceId;

    const resp = await httpClient.post('/api/alerting/_mappings', {
      body: JSON.stringify({ index: indices }),
      query,
    });

    if (!resp.ok) {
      return { commonDateFields: [], error: resp.resp || 'Failed to fetch mappings' };
    }

    const mappings = resp.resp || {};
    
    // Extract date fields from each index
    const dateFieldsByIndex = [];
    
    for (const indexName of Object.keys(mappings)) {
      const indexMapping = mappings[indexName];
      const properties = indexMapping?.mappings?.properties || {};
      const dateFields = [];
      
      // Recursively find all date fields
      const findDateFields = (props, prefix = '') => {
        for (const [fieldName, fieldDef] of Object.entries(props)) {
          const fullFieldName = prefix ? `${prefix}.${fieldName}` : fieldName;
          
          // Include field only if its type is exactly "date" or "date_nanos"
          const fieldType = (fieldDef.type || '').toLowerCase();
          
          if (fieldType === 'date' || fieldType === 'date_nanos') {
            dateFields.push(fullFieldName);
          }
          
          // Check nested properties
          if (fieldDef.properties) {
            findDateFields(fieldDef.properties, fullFieldName);
          }
        }
      };
      
      findDateFields(properties);
      dateFieldsByIndex.push(new Set(dateFields));
    }

    // Find common date fields present in ALL indices
    if (dateFieldsByIndex.length === 0) {
      return { commonDateFields: [], error: null };
    }

    const commonFields = Array.from(dateFieldsByIndex[0]).filter((field) =>
      dateFieldsByIndex.every((fieldSet) => fieldSet.has(field))
    );

    // Sort to prioritize @timestamp
    commonFields.sort((a, b) => {
      if (a === '@timestamp') return -1;
      if (b === '@timestamp') return 1;
      return a.localeCompare(b);
    });

    return { commonDateFields: commonFields, error: null };
  } catch (err) {
    console.error('[findCommonDateFields] Error:', err);
    return { 
      commonDateFields: [], 
      error: err?.body?.message || err?.message || 'Failed to fetch mappings' 
    };
  }
};


/**
 * Preview PPL by calling the PPL endpoint directly:
 * POST /_plugins/_ppl { query: "<PPL string>" }
 * Returns the raw PPL response. Callers can wrap it into an execute-like shape if needed.
 */
export const runPPLPreview = async (httpClient, { queryText, dataSourceId } = {}) => {
  const dataSourceQuery = getDataSourceQueryObj();
  const query = { ...(dataSourceQuery?.query || {}) };
  if (dataSourceId) query['dataSourceId'] = dataSourceId;

  const resp = await httpClient.post('/_plugins/_ppl', {
    body: JSON.stringify({ query: queryText || '' }),
    query,
  });
  if (!resp.ok) throw resp.resp || resp;
  return resp.resp;
};

/** Create or update a PPL MonitorV2 */
export const submitPPL = async ({
  values,
  formikBag,
  edit,
  monitorToEdit,
  history,
  notifications,
  httpClient,
  dataSourceId,
}) => {
  const { setSubmitting } = formikBag;
  const api = makeAlertingV2Service(httpClient);
  const body = buildPPLMonitorFromFormik(values);

  try {
    if (edit && monitorToEdit?._id) {
      const seqNo = monitorToEdit?._seq_no;
      const primary = monitorToEdit?._primary_term;
      await api.updateMonitor(monitorToEdit._id, body, {
        ifSeqNo: seqNo,
        ifPrimaryTerm: primary,
        dataSourceId,
      });
      // end submit BEFORE routing to avoid "setState on unmounted" warning
      setSubmitting(false);
      notifications.toasts.addSuccess(`Monitor "${values.name}" saved.`);
      history.push(`/monitors/${monitorToEdit._id}?type=monitor`);
    } else {
      await api.createMonitor(body, { dataSourceId });
      // end submit BEFORE routing to avoid "setState on unmounted" warning
      setSubmitting(false);
      notifications.toasts.addSuccess(`Monitor "${values.name}" successfully created.`);
      // Route to list
      history.push(`/monitors`);
    }
  } catch (e) {
    setSubmitting(false);
    notifications.toasts.addDanger(
      e?.message || e?.body?.message || `Failed to ${edit ? 'update' : 'create'} the monitor`
    );
  }
};
