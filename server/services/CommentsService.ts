/*
* Copyright OpenSearch Contributors
* SPDX-License-Identifier: Apache-2.0
*/

import { Comment } from "../../public/models/Comments";
import { MDSEnabledClientService } from "./MDSEnabledClientService";

export default class CommentsService extends MDSEnabledClientService {
  createComment = async (context, req, res) => {
    const client = this.getClientBasedOnDataSource(context, req);
    try {
      const resp = await client('alerting.createComment', { alertId: req.params.alertId, body: req.body });

      return res.ok({
        body: {
          ok: true,
          resp,
        },
      });
    } catch (err) {
      console.error(err.message);
      return res.ok({
        body: {
          ok: false,
          err: err.message,
        },
      });
    }
  };

  updateComment = async (context, req, res) => {
    const client = this.getClientBasedOnDataSource(context, req);
    try {
      const resp = await client('alerting.updateComment', { commentId: req.params.commentId, body: req.body });

      return res.ok({
        body: {
          ok: true,
          resp,
        },
      });
    } catch (err) {
      console.error(err.message);
      return res.ok({
        body: {
          ok: false,
          err: err.message,
        },
      });
    }
  };

  searchComments = async (context, req, res) => {
    const client = this.getClientBasedOnDataSource(context, req);
    try {
      const resp = await client('alerting.searchComments', { body: req.body });

      const comments: Comment[] = resp.hits.hits.map(({ _id, _source: { entity_id, content, created_time, last_updated_time, user } }) => ({
        id: _id,
        entity_id,
        content,
        created_time,
        last_updated_time,
        user,
      }));

      return res.ok({
        body: {
          ok: true,
          resp: { comments },
        },
      });
    } catch (err) {
      console.error(err.message);
      return res.ok({
        body: {
          ok: false,
          err: err.message,
        },
      });
    }
  };

  deleteComment = async (context, req, res) => {
    const client = this.getClientBasedOnDataSource(context, req);
    try {
      const resp = await client('alerting.deleteComment', { commentId: req.params.commentId });

      return res.ok({
        body: {
          ok: true,
          resp,
        },
      });
    } catch (err) {
      console.error(err.message);
      return res.ok({
        body: {
          ok: false,
          err: err.message,
        },
      });
    }
  };
}