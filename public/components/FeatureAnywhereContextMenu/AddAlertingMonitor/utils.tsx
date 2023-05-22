/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createAugmentVisSavedObject, VisLayerTypes, VisLayerExpressionFn, ISavedAugmentVis, ISavedPluginResource } from '../../../../../../src/plugins/vis_augmenter/public';

export const createSavedObjectAssociation = async (monitorId, visId) => {

  // public static mapping: Record<string, string> = {
  //   title: 'text',
  //   description: 'text',
  //   originPlugin: 'text',
  //   pluginResource: 'object',
  //   visLayerExpressionFn: 'object',
  //   visId: 'keyword,',
  //   version: 'integer',
  // };

  // export interface ISavedPluginResource {
  //   type: string;
  //   id: string;
  // }
  //
  // export interface ISavedAugmentVis {
  //   id?: string;
  //   title: string;
  //   description?: string;
  //   originPlugin: string;
  //   pluginResource: ISavedPluginResource;
  //   visName?: string;
  //   visId?: string;
  //   visLayerExpressionFn: VisLayerExpressionFn;
  //   version?: number;
  // }

  // let pluginResource;
  // pluginResource = ISavedPluginResource('alerting monitor', monitorId);
  const pluginResource: ISavedPluginResource = {
    type: 'alerting monitor',
    id: monitorId,
  };

  // const fn = {
  //   type: VisLayerTypes.PointInTimeEvents,
  //   name: 'overlay_anomalies',
  //   args: {
  //     detectorId: detectorId,
  //   },
  // } as VisLayerExpressionFn;
  //
  // const savedObjectToCreate = {
  //   title: 'test-title',
  //   pluginResourceId: detectorId,
  //   visId: embeddable.vis.id,
  //   visLayerExpressionFn: fn,
  // } as ISavedAugmentVis;

  // enum VisLayerTypes {
  //   PointInTimeEvents = 'PointInTimeEvents',
  // };
  // create the fields needed for the saved obj
  const fn: VisLayerExpressionFn = {
    type: 'PointInTimeEvents',
    name: 'overlay_alerts',
    args: {
      monitorId: monitorId,
    },
  };
  const savedObjectToCreate: ISavedAugmentVis = {
    // id: `${monitorId}-association`,
    title: 'Vis name title',
    description: 'Association to Alerting monitor',
    originPlugin: 'alertingDashboards',
    pluginResource: pluginResource,
    visName: 'Vis name title',
    visId: visId,
    visLayerExpressionFn: fn,
  };
  // export interface ISavedAugmentVis {
  //   id?: string;
  //   title: string;
  //   description?: string;
  //   originPlugin: string;
  //   pluginResource: ISavedPluginResource;
  //   visName?: string;
  //   visId?: string;
  //   visLayerExpressionFn: VisLayerExpressionFn;
  //   version?: number;
  // }

  //console.log('saved obj to create: ', savedObjectToCreate);

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
