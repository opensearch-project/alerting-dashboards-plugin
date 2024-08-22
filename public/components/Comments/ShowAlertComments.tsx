/*
* Copyright OpenSearch Contributors
* SPDX-License-Identifier: Apache-2.0
*/

import React, { useCallback, useEffect, useState } from "react";
import { Comment } from "../../models/Comments";
import { EuiSmallButtonIcon, EuiToolTip } from "@elastic/eui";
import { AlertCommentsFlyout } from "./AlertCommentsFlyout";

export interface ShowAlertCommentsProps {
  alert: any;
  httpClient: any;
}

export const ShowAlertComments: React.FC<ShowAlertCommentsProps> = ({ alert, httpClient }) => {
  const [commentsFlyout, setCommentsFlyout] = useState<React.ReactNode | null>(null);

  const showCommentsFlyout = useCallback(() => {
    setCommentsFlyout(<AlertCommentsFlyout
      alertId={alert.id}
      httpClient={httpClient}
      closeFlyout={() => setCommentsFlyout(null)}
    />);
  }, [setCommentsFlyout]);

  return (
    <>
      <EuiToolTip content={'Show comments'}>
        <EuiSmallButtonIcon
          aria-label={'Show comments'}
          data-test-subj={`show-comments-icon`}
          iconType={'editorComment'}
          onClick={showCommentsFlyout}
        />
      </EuiToolTip>
      {commentsFlyout}
    </>
  )
}
