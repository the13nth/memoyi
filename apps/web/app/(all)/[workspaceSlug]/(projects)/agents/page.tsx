/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState, useCallback } from "react";
import { observer } from "mobx-react";
import { useNavigate } from "react-router";
// components
import { PageHead } from "@/components/core/page-title";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useAgentSession } from "@/hooks/store/use-agent-session";
import { useRouterParams } from "@/hooks/store/use-router-params";
// icons
import { AiIcon } from "@plane/propel/icons";
// ui
import { Button } from "@plane/ui";

type TSessionStatus = "all" | "active" | "paused" | "completed" | "error";

const STATUS_CONFIG: Record<TSessionStatus, { label: string; bg: string; dot: string }> = {
  all: { label: "All", bg: "", dot: "" },
  active: { label: "Active", bg: "bg-emerald-500/10", dot: "bg-emerald-500" },
  paused: { label: "Paused", bg: "bg-amber-500/10", dot: "bg-amber-500" },
  completed: { label: "Completed", bg: "bg-custom-primary-500/10", dot: "bg-custom-primary-500" },
  error: { label: "Error", bg: "bg-red-500/10", dot: "bg-red-500" },
};

const StatusBadge = ({ status }: { status: TSessionStatus }) => {
  if (status === "all") return null;
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.bg}`}
    >
      <span className={`inline-block h-2 w-2 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

const SessionCard = observer(
  ({
    session,
    onClick,
  }: {
    session: {
      id: string;
      agent_id: string;
      label?: string;
      status: TSessionStatus;
      event_count: number;
      total_tokens_in: number;
      total_tokens_out: number;
      total_cost: string;
      started_at: string;
    };
    onClick: () => void;
  }) => {
    const displayName = session.label?.trim() || session.agent_id;
    const date = new Date(session.started_at);
    const costNum = parseFloat(session.total_cost || "0");

    return (
      <button
        type="button"
        onClick={onClick}
        className="group/card flex w-full cursor-pointer items-center gap-x-4 rounded-lg border-[0.5px] border-custom-border-200 bg-custom-background-100 px-4 py-3 text-left shadow-sm transition-all hover:bg-custom-background-80"
      >
        {/* Status dot */}
        <span className={`flex-shrink-0 h-2.5 w-2.5 rounded-full ${STATUS_CONFIG[session.status]?.dot || "bg-custom-border-400"}`} />

        {/* Info */}
        <div className="flex flex-1 flex-col gap-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-medium text-custom-text-100">
              {displayName}
            </span>
            <StatusBadge status={session.status} />
          </div>
          <span className="text-xs text-custom-text-400">
            {date.toLocaleDateString()} {date.toLocaleTimeString()}
          </span>
        </div>

        {/* Stats */}
        <div className="flex flex-shrink-0 items-center gap-x-4 text-xs text-custom-text-400">
          <span>{session.event_count} events</span>
          <span>{(session.total_tokens_in + session.total_tokens_out).toLocaleString()} tokens</span>
          {costNum > 0 && <span>${costNum.toFixed(4)}</span>}
        </div>
      </button>
    );
  }
);

const AgentsPage = observer(() => {
  const { currentWorkspace } = useWorkspace();
  const { workspaceSlug } = useRouterParams();
  const { sessions, sessionIds, fetchStatus, loader, fetchSessions, fetchMoreSessions } = useAgentSession();
  const navigate = useNavigate();

  // local UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<TSessionStatus>("all");

  const pageTitle = currentWorkspace?.name ? `${currentWorkspace?.name} - Agents` : undefined;

  useEffect(() => {
    if (workspaceSlug && fetchStatus === "init") {
      fetchSessions(workspaceSlug);
    }
  }, [workspaceSlug, fetchStatus, fetchSessions]);

  // Filter sessions based on search + status
  const filteredSessionIds = sessionIds
    .map((id) => sessions[id])
    .filter((s) => {
      if (!s) return false;
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const label = s.label?.toLowerCase() || "";
        const agent = s.agent_id?.toLowerCase() || "";
        if (!label.includes(q) && !agent.includes(q)) return false;
      }
      return true;
    })
    .map((s) => s.id);

  const handleSessionClick = useCallback(
    (sessionId: string) => {
      navigate(`/${workspaceSlug}/agents/${sessionId}`);
    },
    [navigate, workspaceSlug]
  );

  const handleRefresh = useCallback(() => {
    if (workspaceSlug) fetchSessions(workspaceSlug);
  }, [workspaceSlug, fetchSessions]);

  const filters: { key: TSessionStatus; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "paused", label: "Paused" },
    { key: "completed", label: "Completed" },
    { key: "error", label: "Error" },
  ];

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="flex h-full w-full flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-shrink-0 items-center gap-3 border-b border-custom-border-200 px-6 py-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search by agent ID or label..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border-[0.5px] border-custom-border-200 bg-custom-background-90 px-3 py-2 pr-8 text-sm text-custom-text-100 placeholder-custom-text-400 outline-none focus:border-custom-primary-100"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-custom-text-400 hover:text-custom-text-200"
              >
                &times;
              </button>
            )}
          </div>

          {/* Status filter pills */}
          <div className="flex items-center gap-1">
            {filters.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setStatusFilter(f.key)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  statusFilter === f.key
                    ? "bg-custom-primary-100 text-white"
                    : "bg-custom-background-90 text-custom-text-400 hover:text-custom-text-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loader}
            className="rounded-md bg-custom-background-90 px-3 py-1.5 text-xs font-medium text-custom-text-400 hover:text-custom-text-200 transition-all disabled:opacity-50"
          >
            {loader ? "Loading..." : "Refresh"}
          </button>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto p-6">
          {loader && fetchStatus === "init" ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-custom-text-400">Loading agent sessions...</p>
            </div>
          ) : filteredSessionIds.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3">
              <AiIcon className="h-12 w-12 text-custom-text-300" />
              <p className="text-lg font-medium text-custom-text-300">No agent sessions found</p>
              <p className="text-sm text-custom-text-400">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Agent sessions will appear here when agents are running"}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredSessionIds.map((id) => (
                <SessionCard
                  key={id}
                  session={sessions[id]}
                  onClick={() => handleSessionClick(id)}
                />
              ))}

              {/* Load more */}
              {sessionIds.length > 0 && sessionIds.length < (sessions as any).totalCount && (
                <div className="flex justify-center pt-3">
                  <button
                    type="button"
                    onClick={() => workspaceSlug && fetchMoreSessions(workspaceSlug)}
                    disabled={loader}
                    className="rounded-md bg-custom-background-90 px-4 py-2 text-xs font-medium text-custom-text-400 hover:text-custom-text-200 transition-all disabled:opacity-50"
                  >
                    {loader ? "Loading..." : "Load more"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
});

export default AgentsPage;
