/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createAugmentVisSavedObject, VisLayerTypes, VisLayerExpressionFn, ISavedAugmentVis, ISavedPluginResource } from '../../../../../../src/plugins/vis_augmenter/public';

export const createSavedObjectAssociation = async (monitorId, visId) => {

  const pluginResource: ISavedPluginResource = {
    type: 'alerting monitor',
    id: monitorId,
  };

  // create the fields needed for the saved obj
  const fn: VisLayerExpressionFn = {
    type: 'PointInTimeEvents',
    name: 'overlay_alerts',
    args: {
      monitorId: monitorId,
    },
  };
  const savedObjectToCreate: ISavedAugmentVis = {
    title: 'Vis name title',
    description: 'Association to Alerting monitor',
    originPlugin: 'alertingDashboards',
    pluginResource: pluginResource,
    visName: 'Vis name title',
    visId: visId,
    visLayerExpressionFn: fn,
  };

  // helper fn to create the saved object given an object implementing the
  // ISavedFeatureAnywhere interface.
  // Note that we actually don't have a hard dep on the feature anywhere loader yet,
  // since we have a dependency on visualizations which has a dependency on the
  // feature anywhere loader. But we will probably need later when
  // using the loader's search functionalities within the UI components.

  // TODO: handle failures if it fails to create
  let newSavedObj = await createAugmentVisSavedObject(savedObjectToCreate);

  // calling save() on the newly-created saved object to actually save it to the system index
  const response = await newSavedObj.save({});

  return response;
};
