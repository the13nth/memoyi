/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { API_BASE_URL } from "@plane/constants";
// services
import { APIService } from "@/services/api.service";

export interface IAgentSessionResponse {
  id: string;
  agent_id: string;
  label: string;
  status: "active" | "paused" | "completed" | "error";
  started_at: string;
  ended_at: string | null;
  event_count: number;
  total_tokens_in: number;
  total_tokens_out: number;
  total_cost: string;
  metadata: Record<string, unknown>;
  workspace: string;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface IAgentEventResponse {
  id: string;
  session: string;
  event_type: string;
  payload: Record<string, unknown>;
  parent_event: string | null;
  tokens_in: number;
  tokens_out: number;
  latency_ms: number | null;
  workspace: string;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  children: IAgentEventResponse[];
}

export interface IAgentMemoryResponse {
  id: string;
  session: string;
  content: string;
  memory_type: string;
  tags: string[];
  importance: number;
  embedding: Record<string, unknown> | null;
  expires_at: string | null;
  workspace: string;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface IPaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
  total_pages: number;
  page: number;
  page_size: number;
}

export class AgentSessionService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchSessions(
    workspaceSlug: string,
    params?: {
      page?: number;
      page_size?: number;
      search?: string;
      status?: string;
    }
  ): Promise<IPaginatedResponse<IAgentSessionResponse>> {
    return this.get(`/api/v1/memoyi/workspaces/${workspaceSlug}/agent-sessions/`, {
      params,
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchSession(
    workspaceSlug: string,
    sessionId: string
  ): Promise<IAgentSessionResponse> {
    return this.get(`/api/v1/memoyi/workspaces/${workspaceSlug}/agent-sessions/${sessionId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchSessionEvents(
    workspaceSlug: string,
    sessionId: string,
    params?: {
      page?: number;
      page_size?: number;
    }
  ): Promise<IPaginatedResponse<IAgentEventResponse>> {
    return this.get(`/api/v1/memoyi/workspaces/${workspaceSlug}/agent-events/`, {
      params: {
        ...params,
        session: sessionId,
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updateSession(
    workspaceSlug: string,
    sessionId: string,
    data: Partial<IAgentSessionResponse>
  ): Promise<IAgentSessionResponse> {
    return this.patch(`/api/v1/memoyi/workspaces/${workspaceSlug}/agent-sessions/${sessionId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deleteSession(
    workspaceSlug: string,
    sessionId: string
  ): Promise<void> {
    return this.delete(`/api/v1/memoyi/workspaces/${workspaceSlug}/agent-sessions/${sessionId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
