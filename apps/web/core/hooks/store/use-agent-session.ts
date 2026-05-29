/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useContext } from "react";
// mobx store
import { StoreContext } from "@/lib/store-context";
// types
import type { IAgentSessionStore } from "@/store/memoyi/agent-session.store";

export const useAgentSession = (): IAgentSessionStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useAgentSession must be used within StoreProvider");
  return context.agentSession;
};
