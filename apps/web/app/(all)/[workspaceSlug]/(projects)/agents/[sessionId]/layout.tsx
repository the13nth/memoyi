/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Outlet } from "react-router";
// components
import { AppHeader, ContentWrapper } from "@/components/core";

export default function AgentSessionDetailLayout() {
  return (
    <>
      <AppHeader>
        {/* header content can go here when we build the full timeline */}
      </AppHeader>
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
