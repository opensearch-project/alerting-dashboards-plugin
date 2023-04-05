/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createAugmentVisSavedObject } from '../../../../../../src/plugins/vis_augmenter/public';

export const createSavedObjectAssociation = async (monitorId, visId) => {
  console.log('creating saved obj for this monitor...');

  // create the fields needed for the saved obj
  const savedObjectToCreate = {
    title: `${monitorId}-association`,
    pluginResourceId: monitorId,
    visName: 'Vis name title',
    visId: visId,
    visLayerExpressionFn: {
      type: 'PointInTimeEventsVisLayer',
      name: 'overlay_alerts',
      args: {
        monitorId: monitorId,
      },
    },
  };

  //console.log('saved obj to create: ', savedObjectToCreate);

  // helper fn to create the saved object given an object implementing the
  // ISavedFeatureAnywhere interface.
  // Note that we actually don't have a hard dep on the feature anywhere loader yet,
  // since we have a dependency on visualizations which has a dependency on the
  // feature anywhere loader. But we will probably need later when
  // using the loader's search functionalities within the UI components.

  // TODO: handle failures if it fails to create
  let newSavedObj = await createAugmentVisSavedObject(savedObjectToCreate);

  console.log('savedOecjts: ', newSavedObj);

  // calling save() on the newly-created saved object to actually save it to the system index
  const response = await newSavedObj.save({});
  console.log('response: ', response);

  return response;
};
