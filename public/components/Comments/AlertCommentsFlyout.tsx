/*
* Copyright OpenSearch Contributors
* SPDX-License-Identifier: Apache-2.0
*/

import React, { useCallback, useEffect, useState } from "react";
import { Comment } from "../../models/Comments";
import {
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiCommentList,
  EuiText,
  EuiButtonIcon,
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiPopover,
  EuiTitle,
  EuiSpacer,
  EuiCallOut,
  EuiLink
} from "@elastic/eui";
import { CommentEditor } from "./CommentEditor";
import moment from "moment";
import { getTimeZone } from "../../pages/CreateTrigger/utils/helper";
import { title } from "vega-lite/src/channeldef";

export interface AlertCommentsFlyoutProps {
  alertId: string;
  httpClient: any;
  closeFlyout: () => void;
}

type CommentItem = Comment & { state: 'edit' | 'readonly', draft: string; };

export const AlertCommentsFlyout: React.FC<AlertCommentsFlyoutProps> = ({ alertId, httpClient, closeFlyout }) => {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentIdWithOpenActionMenu, setCommentIdWithOpenActionMenu] = useState<string | undefined>(undefined);
  const [draftCommentContent, setDraftCommentContent] = useState('');
  const [createPending, setCreatePending] = useState(false);
  const [updatePending, setUpdatePending] = useState(false);
  const toggleCommentActionMenu = (commentId: string) => {
    setCommentIdWithOpenActionMenu(commentIdWithOpenActionMenu ? undefined : commentId);
  };
  const isACommentBeingEdited = comments.some(comment => comment.state === 'edit');

  const loadComments = useCallback(async () => {
    const getComments = async () => {
      const res = await httpClient.post('../api/alerting/comments/_search', { body: JSON.stringify({
          query: {
            match: {
              entity_id: alertId
            }
          }
        })
      });

      if (res.ok) {
        setComments(res.resp.comments.map((comment: Comment) => ({
          ...comment,
          state: 'readonly',
          draft: comment.content
        })).sort((a: Comment, b: Comment) => b.created_time - a.created_time));
      }
    }

    getComments();
  }, [httpClient, alertId]);

  useEffect(() => {
    loadComments();
  }, [alertId]);

  const closeCommentActionMenu = () => {
    setCommentIdWithOpenActionMenu(undefined);
  };

  const createComment = async () => {
    setCreatePending(true);
    await httpClient.post(`../api/alerting/comments/${alertId}`, { body: JSON.stringify({
      content: draftCommentContent
    })});

    setDraftCommentContent('');
    loadComments();
    setCreatePending(false);
  }

  const updateComment = async (commentId: string, content: string) => {
    setUpdatePending(true);
    await httpClient.put(`../api/alerting/comments/${commentId}`, { body: JSON.stringify({ content })});
    loadComments();
    setUpdatePending(false);
  }

  const deleteComment = async (commentId: string) => {
    await httpClient.delete(`../api/alerting/comments/${commentId}`);
    loadComments();
  }

  const onCommentContentChange = (comment: CommentItem, commentIdx: number, newContent: string) => {
    setComments([
      ...comments.slice(0, commentIdx),
      {
        ...comment,
        draft: newContent
      },
      ...comments.slice(commentIdx + 1)
    ]);
  }

  const onEditClick = (comment: CommentItem, idx: number) => {
    setComments([
      ...comments.slice(0, idx),
      {
        ...comment,
        state: 'edit'
      },
      ...comments.slice(idx + 1)
    ]);
    setCommentIdWithOpenActionMenu(undefined);
  }

  const onEditCancel = (comment: CommentItem, idx: number) => {
    setComments([
      ...comments.slice(0, idx),
      {
        ...comment,
        state: 'readonly'
      },
      ...comments.slice(idx + 1)
    ]);
  }

  const commentListItems = comments.map((comment, idx) => {
    const content = comment.state === 'readonly' ? (
      <EuiText size="s">
        <p>
          {comment.content}
        </p>
      </EuiText>
    ) : (
      <CommentEditor
        isLoading={updatePending}
        draftCommentContent={comment.draft}
        onContentChange={(event) => {
          onCommentContentChange(comment, idx, event.target.value);
        }}
        onSave={() => updateComment(comment.id, comment.draft)}
        onCancel={() => onEditCancel(comment, idx)}
      />
    );

    const customActions = comment.state === 'readonly' && (
      <EuiPopover
        button={
          <EuiButtonIcon
            aria-label="Actions"
            iconType="boxesHorizontal"
            size="s"
            color="text"
            onClick={() => toggleCommentActionMenu(comment.id)}
          />
        }
        isOpen={commentIdWithOpenActionMenu === comment.id}
        closePopover={closeCommentActionMenu}
        panelPaddingSize="none"
        anchorPosition="leftCenter">
        <EuiContextMenuPanel
          items={[
            <EuiContextMenuItem
              key="A"
              icon="pencil"
              onClick={() => onEditClick(comment, idx)}>
              Edit
            </EuiContextMenuItem>,
            <EuiContextMenuItem
              key="B"
              icon="trash"
              onClick={() => {
                deleteComment(comment.id);
              }}>
              Delete
            </EuiContextMenuItem>
          ]}
        />
      </EuiPopover>
    );

    return {
      username: comment.user || 'Unknown',
      event: `${comment.last_updated_time ? 'edited' : 'added'} comment on`,
      timestamp: moment.utc(comment.last_updated_time ?? comment.created_time).tz(getTimeZone()).format(),
      children: content,
      actions: customActions,
    }
  });

  return (
    <EuiFlyout onClose={closeFlyout}>
      <EuiFlyoutHeader hasBorder>
        <EuiTitle size="m">
          <h2>Comments</h2>
        </EuiTitle>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <EuiCallOut
          iconType='iInCircle'
          title='Experimental'>
          <span>The feature is experimental and should not be used in a production environment.
            The posted comments will be impacted if the feature is deactivated.
            For more information see <EuiLink href="https://opensearch.org/docs/latest/observing-your-data/alerting/index/" target="_blank">Documentation.</EuiLink>
            To leave feedback, visit <EuiLink href="https://github.com/opensearch-project/OpenSearch-Dashboards/issues/6999" target="_blank">github.com</EuiLink>.
          </span>
        </EuiCallOut>
        <EuiSpacer />
        <EuiTitle size="xs">
          <h4>Add comment</h4>
        </EuiTitle>
        <EuiSpacer size="m" />
        <CommentEditor
          isLoading={createPending}
          draftCommentContent={draftCommentContent}
          onContentChange={(event) => {
            setDraftCommentContent(event.target.value);
          }}
          onSave={createComment}
          saveDisabled={isACommentBeingEdited}
        />
        <EuiSpacer />
        <EuiTitle size="xs">
          <h4>Comments ({comments.length})</h4>
        </EuiTitle>
        <EuiSpacer />
        <EuiCommentList comments={commentListItems}/>
      </EuiFlyoutBody>
    </EuiFlyout>
  )
}
