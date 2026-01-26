/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import _ from 'lodash';
import queryString from 'query-string';
import { FORMIK_INITIAL_VALUES } from './constants';
import pplAlertingMonitorToFormik from './pplAlertingMonitorToFormik';
import { buildPPLMonitorFromFormik, pplToV2Schedule } from './pplFormikToMonitor';
import { MONITOR_TYPE, DEFAULT_EMPTY_DATA } from '../../../../../utils/constants';
import { initializeFromQueryParams } from './monitorQueryParams';
import { backendErrorNotification, getDigitId } from '../../../../../utils/helpers';
import {
  formikToTrigger,
  formikToTriggerUiMetadata,
} from '../../../../CreateTrigger/containers/CreateTrigger/utils/formikToTrigger';
import { triggerToFormikPpl } from '../../../../CreateTrigger/containers/CreateTrigger/utils/triggerToFormikPpl';
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

  const params = queryString.parse(location.search);
  const transferKey = params?.qkey;
  if (transferKey && typeof transferKey === 'string') {
    try {
      const transferData = sessionStorage.getItem(transferKey);
      if (transferData) {
        const parsed = JSON.parse(transferData);
        if (parsed.query) {
          initialValues.pplQuery = parsed.query;
          initialValues.monitor_mode = 'ppl';
          initialValues.searchType = 'query';
        }
        if (parsed.dataSourceId) {
          initialValues.dataSourceId = parsed.dataSourceId;
        }
        sessionStorage.removeItem(transferKey);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[getInitialValues] Failed to load query from sessionStorage:', err);
    }
  }

  if (params?.mode === 'ppl') {
    initialValues.monitor_mode = 'ppl';
    initialValues.searchType = 'query';
  }

  if (flyoutMode) {
    initialValues.name = `${title} ${getDigitId()}`;
    initialValues.index = index;
    initialValues.timeField = timeField;

    initialValues.triggerDefinitions = [];

    initialValues.aggregations = getMetricAgg(embeddable);

    if (searchType) {
      initialValues.searchType = searchType;
    }

    if (detectorId) {
      initialValues.detectorId = detectorId;
      initialValues.period = { interval: 20, unit: 'MINUTES' };
    }
  }

  try {
    const urlParams = new URLSearchParams(location?.search || '');
    const incoming = urlParams.get('ppl') || urlParams.get('pplQuery');
    const incomingDataSourceId = urlParams.get('dataSourceId');

    if (incoming) {
      initialValues.pplQuery = decodeURIComponent(incoming);
      initialValues.monitor_mode = 'ppl';
    }

    if (incomingDataSourceId) {
      initialValues.dataSourceId = incomingDataSourceId;
    }
  } catch (e) {
    // ignore URL parsing failures
  }

  if (edit && monitorToEdit) {
    const monitorLevelTriggers = _.get(monitorToEdit, 'ppl_monitor.triggers', []);
    const rootLevelTriggers = _.get(monitorToEdit, 'triggers', []);
    const rawTriggers =
      Array.isArray(monitorLevelTriggers) && monitorLevelTriggers.length
        ? monitorLevelTriggers
        : Array.isArray(rootLevelTriggers)
        ? rootLevelTriggers
        : [];

    const normalizedTriggers = rawTriggers.map((trigger) => triggerToFormikPpl(trigger));

    const convertedValues = pplAlertingMonitorToFormik(monitorToEdit);
    initialValues = {
      ...convertedValues,
      triggerDefinitions: normalizedTriggers,
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
      aggregationType,
      fieldName,
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
      // eslint-disable-next-line no-console
      console.error('There was a problem getting plugins list');
      return [];
    }
  } catch (e) {
    // eslint-disable-next-line no-console
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
      setSubmitting(false);
      history.push(`/monitors/${resp.resp._id}?type=${isWorkflow ? 'workflow' : 'monitor'}`);

      if (onSuccess) {
        onSuccess({ monitor: { _id: resp.resp._id, ...monitor } });
      }
    } else {
      setSubmitting(false);
      backendErrorNotification(notifications, 'create', 'monitor', resp.resp);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    setSubmitting(false);
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
      // eslint-disable-next-line no-console
      console.log('Failed to update:', resp);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
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
  let monitor = buildPPLMonitorFromFormik(values);

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

export const makeAlertingV2Service = (httpClient) => {
  const base = '/api/alerting/v2';

  const withDataSource = () => {
    const ds = getDataSourceQueryObj();
    return ds?.query || {};
  };

  return {
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

    updateMonitor: async (id, body, { dataSourceId } = {}) => {
      const query = withDataSource();
      if (dataSourceId) query['dataSourceId'] = dataSourceId;
      const r = await httpClient.put(`${base}/monitors/${encodeURIComponent(id)}`, {
        body: JSON.stringify(body),
        query,
      });
      if (!r.ok) throw r.resp || r;
      return r.resp;
    },

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

export const extractIndicesFromPPL = (pplQuery) => {
  if (!pplQuery || typeof pplQuery !== 'string') return [];

  const regex = /source\s*=\s*((?:`[^`]+`|[-\w.*'+]+)(?:\s*,\s*(?:`[^`]+`|[-\w.*'+]+))*)/i;
  const match = pplQuery.match(regex);

  if (!match || !match[1]) return [];

  return match[1]
    .split(',')
    .map((idx) => idx.trim())
    .map((idx) => (idx.startsWith('`') && idx.endsWith('`') ? idx.slice(1, -1) : idx))
    .filter(Boolean);
};

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

    const dateFieldsByIndex = [];

    for (const indexName of Object.keys(mappings)) {
      const indexMapping = mappings[indexName];
      const properties = indexMapping?.mappings?.properties || {};
      const dateFields = [];

      const findDateFields = (props, prefix = '') => {
        for (const [fieldName, fieldDef] of Object.entries(props)) {
          const fullFieldName = prefix ? `${prefix}.${fieldName}` : fieldName;

          const fieldType = (fieldDef.type || '').toLowerCase();

          if (fieldType === 'date' || fieldType === 'date_nanos') {
            dateFields.push(fullFieldName);
          }

          if (fieldDef.properties) {
            findDateFields(fieldDef.properties, fullFieldName);
          }
        }
      };

      findDateFields(properties);
      dateFieldsByIndex.push(new Set(dateFields));
    }

    if (dateFieldsByIndex.length === 0) {
      return { commonDateFields: [], error: null };
    }

    const commonFields = Array.from(dateFieldsByIndex[0]).filter((field) =>
      dateFieldsByIndex.every((fieldSet) => fieldSet.has(field))
    );

    commonFields.sort((a, b) => {
      if (a === '@timestamp') return -1;
      if (b === '@timestamp') return 1;
      return a.localeCompare(b);
    });

    return { commonDateFields: commonFields, error: null };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[findCommonDateFields] Error:', err);
    return {
      commonDateFields: [],
      error: err?.body?.message || err?.message || 'Failed to fetch mappings',
    };
  }
};

export const runPPLPreview = async (httpClient, { queryText, dataSourceId } = {}) => {
  const dataSourceQuery = getDataSourceQueryObj();
  const query = { ...(dataSourceQuery?.query || {}) };
  if (dataSourceId) query['dataSourceId'] = dataSourceId;

  try {
    const resp = await httpClient.post('/_plugins/_ppl', {
      body: JSON.stringify({ query: queryText || '' }),
      query,
    });
    if (!resp.ok) {
      return {
        ok: false,
        error: resp?.resp?.message || 'Incorrect data source or invalid query',
      };
    }
    return resp.resp;
  } catch (err) {
    return {
      ok: false,
      error: err?.body?.message || err?.message || 'Incorrect data source or invalid query',
    };
  }
};

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
  const { setSubmitting, setFieldError } = formikBag;
  const api = makeAlertingV2Service(httpClient);

  // Validate that all triggers have names
  const triggerDefinitions = _.get(values, 'triggerDefinitions', []);
  if (Array.isArray(triggerDefinitions) && triggerDefinitions.length > 0) {
    const triggersWithoutNames = triggerDefinitions
      .map((trigger, index) => ({ trigger, index }))
      .filter(({ trigger }) => !trigger?.name || trigger.name.trim() === '');
    if (triggersWithoutNames.length > 0) {
      triggersWithoutNames.forEach(({ index }) => {
        setFieldError(`triggerDefinitions[${index}].name`, 'Trigger name is required.');
      });
      setSubmitting(false);
      notifications.toasts.addDanger({
        title: `Failed to ${edit ? 'update' : 'create'} the monitor`,
        text: 'All triggers must have a name. Please fill in the trigger name(s) before continuing.',
      });
      return;
    }

    // Validate that "Number of results" triggers with >= condition don't have value >= 10000
    const invalidTriggers = triggerDefinitions
      .map((trigger, index) => ({ trigger, index }))
      .filter(({ trigger }) => {
        const type = trigger?.type;
        const condition = trigger?.num_results_condition;
        const value = trigger?.num_results_value;
        return (
          type === 'number_of_results' &&
          (condition === '>=' || condition === '>') &&
          !isNaN(Number(value)) &&
          Number(value) >= 10000
        );
      });
    if (invalidTriggers.length > 0) {
      invalidTriggers.forEach(({ index }) => {
        setFieldError(
          `triggerDefinitions[${index}].num_results_value`,
          'Value cannot be greater than or equal to 10000.'
        );
      });
      setSubmitting(false);
      notifications.toasts.addDanger({
        title: `Failed to ${edit ? 'update' : 'create'} the monitor`,
        text: 'Invalid value: "Number of results" triggers with ">=" or ">" condition cannot have a value >= 10000.',
      });
      return;
    }
  }

  const body = buildPPLMonitorFromFormik(values);

  try {
    if (edit && monitorToEdit?._id) {
      await api.updateMonitor(monitorToEdit._id, body, {
        dataSourceId,
      });
      setSubmitting(false);
      notifications.toasts.addSuccess(`Monitor "${values.name}" saved.`);
      history.push(`/monitors/${monitorToEdit._id}?type=monitor`);
    } else {
      const resp = await api.createMonitor(body, { dataSourceId });
      setSubmitting(false);
      notifications.toasts.addSuccess(`Monitor "${values.name}" successfully created.`);
      const newId = resp?._id || resp?.monitor_id || resp?.monitor?.id || resp?.id;
      if (newId) {
        history.push(`/monitors/${newId}?type=monitor`);
      } else {
        history.push(`/monitors`);
      }
    }
  } catch (e) {
    setSubmitting(false);
    // Check if this is a PPL query validation error
    // The error can be thrown as r.resp (string) or r (object) from makeAlertingV2Service
    const errorResp =
      typeof e === 'string' ? e : e?.resp || e?.body?.resp || e?.message || String(e);
    const isPplQueryError =
      typeof errorResp === 'string' &&
      (errorResp.includes('Validation error for PPL Query') ||
        errorResp.includes('PPL Query') ||
        errorResp.includes('PPL Monitor'));

    if (isPplQueryError) {
      // Replace "Data Source Error: [alerting_exception]" with "Invalid Ppl Query:"
      const formattedError =
        typeof errorResp === 'string'
          ? errorResp.replace(
              /Data Source Error:\s*\[alerting_exception\]\s*/i,
              'Invalid Ppl Query: '
            )
          : errorResp;
      notifications.toasts.addDanger({
        title: 'Failed to Create Monitor',
        text: formattedError,
      });
    } else {
      notifications.toasts.addDanger(
        e?.message || e?.body?.message || `Failed to ${edit ? 'update' : 'create'} the monitor`
      );
    }
  }
};

/**
 * Formats duration in minutes to a human-readable string
 * - If >= 60 minutes, converts to hours (e.g., 60 min -> 1 hour, 65 min -> 1 hr 5 min)
 * - If >= 24 hours (1440 minutes), converts to days (e.g., 1440 min -> 1 d)
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration string
 */
export const formatDuration = (minutes) => {
  if (minutes === null || minutes === undefined || minutes === '') {
    return DEFAULT_EMPTY_DATA;
  }

  const totalMinutes = Number(minutes);
  if (isNaN(totalMinutes) || totalMinutes < 0) {
    return DEFAULT_EMPTY_DATA;
  }

  if (totalMinutes === 0) {
    return '0 minutes';
  }

  // If >= 24 hours (1440 minutes), convert to days
  const MINUTES_PER_DAY = 24 * 60;
  if (totalMinutes >= MINUTES_PER_DAY) {
    const days = Math.floor(totalMinutes / MINUTES_PER_DAY);
    const remainingMinutes = totalMinutes % MINUTES_PER_DAY;

    if (remainingMinutes === 0) {
      return `${days} d`;
    }

    // If remaining minutes >= 60, convert to hours
    if (remainingMinutes >= 60) {
      const hours = Math.floor(remainingMinutes / 60);
      const mins = remainingMinutes % 60;
      if (mins === 0) {
        return `${days} d ${hours} hr`;
      }
      return `${days} d ${hours} hr ${mins} min`;
    }

    return `${days} d ${remainingMinutes} min`;
  }

  // If >= 60 minutes, convert to hours
  const MINUTES_PER_HOUR = 60;
  if (totalMinutes >= MINUTES_PER_HOUR) {
    const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
    const mins = totalMinutes % MINUTES_PER_HOUR;

    if (mins === 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    }

    return `${hours} hr ${mins} min`;
  }

  // Less than 60 minutes, return as minutes
  return `${totalMinutes} ${totalMinutes === 1 ? 'minute' : 'minutes'}`;
};
