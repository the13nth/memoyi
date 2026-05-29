/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Outlet } from "react-router";
// plane imports
import { AiIcon } from "@plane/propel/icons";
import { Breadcrumbs, Header } from "@plane/ui";
// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
// hooks
import { useRouterParams } from "@/hooks/store/use-router-params";

const AgentSessionDetailLayout = observer(() => {
  const { workspaceSlug, query } = useRouterParams();
  const sessionId = query?.sessionId?.toString() || "";

  return (
    <>
      <AppHeader
        header={
          <Header>
            <Header.LeftItem>
              <Breadcrumbs>
                <Breadcrumbs.Item
                  component={
                    <BreadcrumbLink
                      label="Agents"
                      icon={<AiIcon className="h-4 w-4 text-tertiary" />}
                      href={`/${workspaceSlug}/agents`}
                    />
                  }
                />
                <Breadcrumbs.Item
                  component={
                    <BreadcrumbLink
                      label={sessionId ? `Session ${sessionId.slice(0, 8)}` : "Session"}
                      isLast
                    />
                  }
                />
              </Breadcrumbs>
            </Header.LeftItem>
          </Header>
        }
      />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
});

export default AgentSessionDetailLayout;
