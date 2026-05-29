/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useNavigate } from "react-router";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useAgentSession } from "@/hooks/store/use-agent-session";
import { useRouterParams } from "@/hooks/store/use-router-params";
// components
import { PageHead } from "@/components/core/page-title";
// services
import { AgentSessionService } from "@/services/memoyi/agent-session.service";
// types
import type { IAgentEventResponse } from "@/services/memoyi";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TEventType =
  | "llm_call"
  | "tool_call"
  | "tool_result"
  | "memory_write"
  | "memory_read"
  | "decision"
  | "error"
  | "system_prompt"
  | "user_message"
  | "agent_message";

const EVENT_TYPES: TEventType[] = [
  "llm_call",
  "tool_call",
  "tool_result",
  "memory_write",
  "memory_read",
  "decision",
  "error",
  "system_prompt",
  "user_message",
  "agent_message",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const agentSessionService = new AgentSessionService();

function formatDuration(ms: number | null | undefined): string {
  if (ms == null) return "-";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function truncate(str: string, max = 120): string {
  if (str.length <= max) return str;
  return str.slice(0, max) + "...";
}

function getEventTypeIcon(type: TEventType): string {
  const icons: Record<string, string> = {
    llm_call: "🤖",
    tool_call: "🔧",
    tool_result: "📋",
    memory_write: "💾",
    memory_read: "🔍",
    decision: "🧠",
    error: "⚠️",
    system_prompt: "⚙️",
    user_message: "👤",
    agent_message: "🤖",
  };
  return icons[type] || "📄";
}

function getEventTypeLabel(type: TEventType): string {
  const labels: Record<string, string> = {
    llm_call: "LLM Call",
    tool_call: "Tool Call",
    tool_result: "Tool Result",
    memory_write: "Memory Write",
    memory_read: "Memory Read",
    decision: "Decision",
    error: "Error",
    system_prompt: "System Prompt",
    user_message: "User Message",
    agent_message: "Agent Message",
  };
  return labels[type] || type;
}

// ---------------------------------------------------------------------------
// Status Badge
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<string, { label: string; bg: string; dot: string }> = {
  active: { label: "Active", bg: "bg-emerald-500/10", dot: "bg-emerald-500" },
  paused: { label: "Paused", bg: "bg-amber-500/10", dot: "bg-amber-500" },
  completed: { label: "Completed", bg: "bg-custom-primary-500/10", dot: "bg-custom-primary-500" },
  error: { label: "Error", bg: "bg-red-500/10", dot: "bg-red-500" },
};

const StatusBadge = observer(function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status];
  if (!config) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${config.bg}`}>
      <span className={`inline-block h-2 w-2 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
});

// ---------------------------------------------------------------------------
// Event Detail Components
// ---------------------------------------------------------------------------

const LLMCallDetail = observer(function LLMCallDetail({
  payload,
}: {
  payload: Record<string, unknown>;
}) {
  const model = (payload.model as string) || "unknown";
  const prompt = (payload.prompt as string) || "";
  const response = (payload.response as string) || "";

  return (
    <div className="mt-2 space-y-2 text-xs">
      <div className="flex items-center gap-2 text-custom-text-300">
        <span>Model:</span>
        <span className="font-medium text-custom-text-200">{model}</span>
      </div>
      {prompt && (
        <div>
          <div className="mb-1 text-custom-text-400">Prompt:</div>
          <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded border border-custom-border-200 bg-custom-background-90 p-2 text-custom-text-200">
            {prompt}
          </pre>
        </div>
      )}
      {response && (
        <div>
          <div className="mb-1 text-custom-text-400">Response:</div>
          <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded border border-custom-border-200 bg-custom-background-90 p-2 text-custom-text-200">
            {response}
          </pre>
        </div>
      )}
    </div>
  );
});

const ToolCallDetail = observer(function ToolCallDetail({
  payload,
}: {
  payload: Record<string, unknown>;
}) {
  const toolName = (payload.tool_name as string) || (payload.name as string) || "unknown";
  const args = (payload.args as Record<string, unknown>) || (payload.arguments as Record<string, unknown>) || payload;

  return (
    <div className="mt-2 space-y-2 text-xs">
      <div className="flex items-center gap-2 text-custom-text-300">
        <span>Tool:</span>
        <span className="font-medium text-custom-text-200">{toolName}</span>
      </div>
      <div>
        <div className="mb-1 text-custom-text-400">Arguments:</div>
        <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded border border-custom-border-200 bg-custom-background-90 p-2 text-custom-text-200">
          {JSON.stringify(args, null, 2)}
        </pre>
      </div>
    </div>
  );
});

const ToolResultDetail = observer(function ToolResultDetail({
  payload,
}: {
  payload: Record<string, unknown>;
}) {
  const output = (payload.output as string) || (payload.result as string) || JSON.stringify(payload, null, 2);

  return (
    <div className="mt-2 text-xs">
      <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded border border-custom-border-200 bg-custom-background-90 p-2 text-custom-text-200">
        {typeof output === "string" ? output : JSON.stringify(output, null, 2)}
      </pre>
    </div>
  );
});

const MemoryWriteDetail = observer(function MemoryWriteDetail({
  payload,
}: {
  payload: Record<string, unknown>;
}) {
  const content = (payload.content as string) || "";
  const memoryType = (payload.memory_type as string) || (payload.type as string) || "general";
  const importance = (payload.importance as number) ?? null;

  return (
    <div className="mt-2 space-y-2 text-xs">
      <div className="flex items-center gap-3 text-custom-text-300">
        <span>
          Type: <span className="font-medium text-custom-text-200">{memoryType}</span>
        </span>
        {importance !== null && (
          <span>
            Importance: <span className="font-medium text-custom-text-200">{importance.toFixed(2)}</span>
          </span>
        )}
      </div>
      <div>
        <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded border border-custom-border-200 bg-custom-background-90 p-2 text-custom-text-200">
          {content}
        </pre>
      </div>
    </div>
  );
});

const MemoryReadDetail = observer(function MemoryReadDetail({
  payload,
}: {
  payload: Record<string, unknown>;
}) {
  const query = (payload.query as string) || "";
  const results = (payload.results as unknown[]) || [];

  return (
    <div className="mt-2 space-y-2 text-xs">
      {query && (
        <div>
          <div className="mb-1 text-custom-text-400">Query:</div>
          <div className="rounded border border-custom-border-200 bg-custom-background-90 p-2 text-custom-text-200">
            {query}
          </div>
        </div>
      )}
      {results.length > 0 && (
        <div>
          <div className="mb-1 text-custom-text-400">
            Results ({results.length}):
          </div>
          <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded border border-custom-border-200 bg-custom-background-90 p-2 text-custom-text-200">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
});

const ErrorDetail = observer(function ErrorDetail({
  payload,
}: {
  payload: Record<string, unknown>;
}) {
  const errorMessage = (payload.message as string) || (payload.error as string) || "Unknown error";
  const stackTrace = (payload.stack_trace as string) || (payload.stack as string) || "";

  return (
    <div className="mt-2 space-y-2 text-xs">
      <div className="rounded border border-red-500/30 bg-red-500/10 p-2 text-red-400">
        {errorMessage}
      </div>
      {stackTrace && (
        <div>
          <div className="mb-1 text-custom-text-400">Stack Trace:</div>
          <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded border border-custom-border-200 bg-custom-background-90 p-2 font-mono text-red-400">
            {stackTrace}
          </pre>
        </div>
      )}
    </div>
  );
});

const GenericDetail = observer(function GenericDetail({
  payload,
}: {
  payload: Record<string, unknown>;
}) {
  return (
    <div className="mt-2 text-xs">
      <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded border border-custom-border-200 bg-custom-background-90 p-2 text-custom-text-200">
        {JSON.stringify(payload, null, 2)}
      </pre>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Event Row
// ---------------------------------------------------------------------------

const EventRow = observer(function EventRow({
  event,
  isExpanded,
  onToggle,
}: {
  event: IAgentEventResponse;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const eventType = event.event_type as TEventType;

  const payloadSummary = useMemo(() => {
    if (eventType === "llm_call") {
      return truncate((event.payload.model as string) || "LLM call");
    }
    if (eventType === "tool_call") {
      return truncate((event.payload.tool_name as string) || (event.payload.name as string) || "Tool call");
    }
    if (eventType === "tool_result") {
      const out = (event.payload.output as string) || (event.payload.result as string);
      return out ? truncate(out) : "Tool result";
    }
    if (eventType === "error") {
      return truncate((event.payload.message as string) || (event.payload.error as string) || "Error");
    }
    if (eventType === "memory_write") {
      const content = event.payload.content as string;
      return content ? truncate(content) : "Memory write";
    }
    if (eventType === "memory_read") {
      const q = event.payload.query as string;
      return q ? truncate(q) : "Memory read";
    }
    if (eventType === "system_prompt" || eventType === "user_message" || eventType === "agent_message") {
      const content = event.payload.content as string;
      return content ? truncate(content) : `${getEventTypeLabel(eventType)}`;
    }
    return truncate(JSON.stringify(event.payload));
  }, [event, eventType]);

  const isError = eventType === "error";
  const hasLatency = eventType === "llm_call" && event.latency_ms != null;
  const hasTokens = (event.tokens_in || 0) + (event.tokens_out || 0) > 0;

  return (
    <div
      className={`rounded-lg border-[0.5px] transition-all ${
        isError
          ? "border-red-500/30 bg-red-500/[0.03]"
          : isExpanded
            ? "border-custom-primary-100 bg-custom-background-80"
            : "border-custom-border-200 bg-custom-background-100 hover:bg-custom-background-80"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left"
      >
        {/* Icon */}
        <span className="mt-0.5 flex-shrink-0 text-base">{getEventTypeIcon(eventType)}</span>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-custom-text-200">
              {getEventTypeLabel(eventType)}
            </span>
            {isError && (
              <span className="rounded bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-400">
                ERROR
              </span>
            )}
          </div>
          <p className={`text-xs leading-relaxed ${isError ? "text-red-400" : "text-custom-text-400"}`}>
            {payloadSummary}
          </p>
          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-custom-text-500">
            <span>{formatTimestamp(event.created_at)}</span>
            {hasLatency && <span>{formatDuration(event.latency_ms)}</span>}
            {hasTokens && (
              <span>
                {(event.tokens_in || 0) + (event.tokens_out || 0)} tokens
              </span>
            )}
            {eventType === "tool_call" && (
              <span>
                in: {(event.tokens_in || 0).toLocaleString()} | out: {(event.tokens_out || 0).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Expand indicator */}
        <div className="flex-shrink-0 pt-0.5">
          <svg
            className={`h-3.5 w-3.5 text-custom-text-400 transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="border-t border-custom-border-200 px-4 pb-3">
          {eventType === "llm_call" && <LLMCallDetail payload={event.payload} />}
          {eventType === "tool_call" && <ToolCallDetail payload={event.payload} />}
          {eventType === "tool_result" && <ToolResultDetail payload={event.payload} />}
          {eventType === "memory_write" && <MemoryWriteDetail payload={event.payload} />}
          {eventType === "memory_read" && <MemoryReadDetail payload={event.payload} />}
          {eventType === "error" && <ErrorDetail payload={event.payload} />}
          {(eventType === "system_prompt" ||
            eventType === "user_message" ||
            eventType === "agent_message" ||
            eventType === "decision") && <GenericDetail payload={event.payload} />}
        </div>
      )}
    </div>
  );
});

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

const WorkspaceAgentSessionDetailPage = observer(() => {
  const { currentWorkspace } = useWorkspace();
  const { workspaceSlug, query } = useRouterParams();
  const { sessions, fetchSessionById } = useAgentSession();
  const navigate = useNavigate();

  const sessionId = query?.sessionId?.toString() || "";

  // Local state
  const [events, setEvents] = useState<IAgentEventResponse[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState<TEventType | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sessionLoading, setSessionLoading] = useState(true);

  // Derive session from store
  const session = sessionId ? sessions[sessionId] : undefined;

  // Fetch session and events
  useEffect(() => {
    if (!workspaceSlug || !sessionId) return;

    const load = async () => {
      setSessionLoading(true);
      setEventsLoading(true);
      setEventsError(null);

      try {
        await fetchSessionById(workspaceSlug, sessionId);
      } catch {
        // session fetch failed - handled by empty state
      } finally {
        setSessionLoading(false);
      }

      try {
        const eventResponse = await agentSessionService.fetchSessionEvents(workspaceSlug, sessionId, {
          page_size: 200,
        });
        setEvents(eventResponse.results || []);
      } catch {
        setEventsError("Failed to load events");
      } finally {
        setEventsLoading(false);
      }
    };

    load();
  }, [workspaceSlug, sessionId, fetchSessionById]);

  // Toggle event expansion
  const toggleExpanded = useCallback((eventId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  }, []);

  // Filter events
  const filteredEvents = useMemo(() => {
    let result = [...events];

    // Filter by type
    if (typeFilter !== "all") {
      result = result.filter((e) => e.event_type === typeFilter);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((e) => {
        const summary = JSON.stringify(e.payload).toLowerCase();
        return summary.includes(q) || e.event_type.toLowerCase().includes(q);
      });
    }

    // Sort newest first
    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return result;
  }, [events, typeFilter, searchQuery]);

  // Compute session duration
  const duration = useMemo(() => {
    if (!session?.started_at) return null;
    const start = new Date(session.started_at).getTime();
    const end = session.ended_at ? new Date(session.ended_at).getTime() : Date.now();
    const diffMs = end - start;
    if (diffMs < 1000) return `${diffMs}ms`;
    if (diffMs < 60000) return `${(diffMs / 1000).toFixed(1)}s`;
    const mins = Math.floor(diffMs / 60000);
    const secs = Math.floor((diffMs % 60000) / 1000);
    return `${mins}m ${secs}s`;
  }, [session]);

  const totalTokens = session
    ? (session.total_tokens_in || 0) + (session.total_tokens_out || 0)
    : 0;

  const costNum = session ? parseFloat(session.total_cost || "0") : 0;

  // Page title
  const pageTitle = session?.label
    ? `${session.label} - ${currentWorkspace?.name || ""} - Agent Timeline`
    : "Agent Timeline";

  // Loading state
  const isLoading = sessionLoading || eventsLoading;

  // Back handler
  const handleBack = useCallback(() => {
    navigate(`/${workspaceSlug}/agents`);
  }, [navigate, workspaceSlug]);

  return (
    <>
      <PageHead title={pageTitle} />

      <div className="flex h-full w-full flex-col overflow-hidden">
        {/* Session Header */}
        <div className="flex-shrink-0 border-b border-custom-border-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="flex-shrink-0 rounded p-1 text-custom-text-400 hover:bg-custom-background-80 hover:text-custom-text-200 transition-colors"
              title="Back to agents list"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex flex-1 flex-col gap-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-lg font-semibold text-custom-text-100">
                  {session?.label?.trim() || session?.agent_id || "Session"}
                </h2>
                {session && <StatusBadge status={session.status} />}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-custom-text-400">
                {session && (
                  <>
                    <span>Agent: {session.agent_id}</span>
                    <span>
                      Started: {formatDate(session.started_at)} {formatTimestamp(session.started_at)}
                    </span>
                    {duration && <span>Duration: {duration}</span>}
                    <span>Events: {session.event_count}</span>
                    {totalTokens > 0 && <span>Tokens: {totalTokens.toLocaleString()}</span>}
                    {costNum > 0 && <span>Cost: ${costNum.toFixed(6)}</span>}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex-shrink-0 border-b border-custom-border-200 px-6 py-2.5">
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border-[0.5px] border-custom-border-200 bg-custom-background-90 px-3 py-1.5 pr-7 text-xs text-custom-text-100 placeholder-custom-text-400 outline-none focus:border-custom-primary-100"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-custom-text-400 hover:text-custom-text-200 text-xs"
                >
                  &times;
                </button>
              )}
            </div>

            {/* Type filter pills */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {(["all", ...EVENT_TYPES] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTypeFilter(type)}
                  className={`whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
                    typeFilter === type
                      ? "bg-custom-primary-100 text-white"
                      : "bg-custom-background-90 text-custom-text-400 hover:text-custom-text-200"
                  }`}
                >
                  {type === "all" ? "All" : getEventTypeLabel(type as TEventType)}
                </button>
              ))}
            </div>

            {/* Event count */}
            <span className="flex-shrink-0 text-[11px] text-custom-text-500">
              {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Timeline Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            /* Loading state */
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <svg
                  className="h-5 w-5 animate-spin text-custom-primary-100"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                <p className="text-sm text-custom-text-400">Loading timeline...</p>
              </div>
            </div>
          ) : !session && !isLoading ? (
            /* Session not found */
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6">
              <span className="text-4xl">🔍</span>
              <p className="text-lg font-medium text-custom-text-300">Session not found</p>
              <p className="text-sm text-custom-text-400">
                This agent session does not exist or may have been deleted.
              </p>
              <button
                type="button"
                onClick={handleBack}
                className="mt-2 rounded-md bg-custom-primary-100 px-4 py-2 text-xs font-medium text-white hover:bg-custom-primary-200 transition-colors"
              >
                Back to Agents
              </button>
            </div>
          ) : eventsError && events.length === 0 ? (
            /* Events fetch error */
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6">
              <span className="text-4xl">⚠️</span>
              <p className="text-lg font-medium text-custom-text-300">Failed to load events</p>
              <p className="text-sm text-custom-text-400">{eventsError}</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            /* Empty state */
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6">
              <span className="text-4xl">📭</span>
              <p className="text-lg font-medium text-custom-text-300">No events found</p>
              <p className="text-sm text-custom-text-400">
                {searchQuery || typeFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "This session has no recorded events yet."}
              </p>
            </div>
          ) : (
            /* Timeline */
            <div className="space-y-1.5 p-6">
              {filteredEvents.map((event, index) => (
                <div key={event.id} className="relative">
                  {/* Vertical timeline line */}
                  {index < filteredEvents.length - 1 && (
                    <div className="absolute left-[19px] top-10 bottom-0 w-px bg-custom-border-200" />
                  )}
                  <EventRow
                    event={event}
                    isExpanded={expandedIds.has(event.id)}
                    onToggle={() => toggleExpanded(event.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
});

export default WorkspaceAgentSessionDetailPage;
