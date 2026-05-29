/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { PageHead } from "@/components/core/page-title";

function WorkspaceAgentSessionDetailPage() {
  return (
    <>
      <PageHead title="Agent Session - Timeline" />
      <div className="flex h-full w-full flex-col overflow-hidden">
        <div className="flex h-full w-full items-center justify-center">
          <p className="text-lg font-medium text-custom-text-300">Agent Timeline — coming soon</p>
        </div>
      </div>
    </>
  );
}

export default WorkspaceAgentSessionDetailPage;
