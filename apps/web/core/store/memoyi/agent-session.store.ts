/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// services
import type { IAgentSessionResponse, IPaginatedResponse } from "@/services/memoyi";
import { AgentSessionService } from "@/services/memoyi/agent-session.service";
// store
import type { CoreRootStore } from "@/store/root.store";
// types
import type { TFetchStatus } from "@plane/types";

export interface IAgentSession extends IAgentSessionResponse {}

export interface IAgentSessionStore {
  // observables
  sessions: Record<string, IAgentSession>;
  sessionIds: string[];
  fetchStatus: TFetchStatus;
  loader: boolean;
  error: string | null;
  // pagination
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  // computed
  sessionList: IAgentSession[];
  // actions
  fetchSessions: (workspaceSlug: string) => Promise<void>;
  fetchMoreSessions: (workspaceSlug: string) => Promise<void>;
  fetchSessionById: (workspaceSlug: string, sessionId: string) => Promise<IAgentSession>;
  getSessionById: (sessionId: string) => IAgentSession | undefined;
  updateSession: (
    workspaceSlug: string,
    sessionId: string,
    data: Partial<IAgentSession>
  ) => Promise<IAgentSession>;
  deleteSession: (workspaceSlug: string, sessionId: string) => Promise<void>;
}

export class AgentSessionStore implements IAgentSessionStore {
  // observables
  sessions: Record<string, IAgentSession> = {};
  sessionIds: string[] = [];
  fetchStatus: TFetchStatus = "init";
  loader: boolean = false;
  error: string | null = null;
  // pagination
  totalCount: number = 0;
  totalPages: number = 0;
  currentPage: number = 1;
  pageSize: number = 20;

  // stores
  routerStore;
  // services
  agentSessionService;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      // observables
      sessions: observable,
      sessionIds: observable,
      fetchStatus: observable.ref,
      loader: observable.ref,
      error: observable.ref,
      totalCount: observable.ref,
      totalPages: observable.ref,
      currentPage: observable.ref,
      pageSize: observable.ref,
      // computed
      sessionList: computed,
      // actions
      fetchSessions: action,
      fetchMoreSessions: action,
      fetchSessionById: action,
      updateSession: action,
      deleteSession: action,
    });

    this.routerStore = _rootStore.router;
    this.agentSessionService = new AgentSessionService();
  }

  /**
   * @description get sorted list of sessions (newest first)
   */
  get sessionList(): IAgentSession[] {
    return this.sessionIds.map((id) => this.sessions[id]).filter(Boolean);
  }

  /**
   * @description get a session by its id
   */
  getSessionById = computedFn((sessionId: string): IAgentSession | undefined => this.sessions[sessionId]);

  /**
   * @description fetch paginated agent sessions
   * @param {string} workspaceSlug
   */
  fetchSessions = async (workspaceSlug: string): Promise<void> => {
    this.loader = true;
    this.error = null;

    try {
      const response: IPaginatedResponse<IAgentSession> =
        await this.agentSessionService.fetchSessions(workspaceSlug, {
          page: 1,
          page_size: this.pageSize,
        });

      runInAction(() => {
        const sessionMap: Record<string, IAgentSession> = {};
        const ids: string[] = [];
        for (const session of response.results) {
          sessionMap[session.id] = session;
          ids.push(session.id);
        }
        this.sessions = sessionMap;
        this.sessionIds = ids;
        this.totalCount = response.count;
        this.totalPages = response.total_pages;
        this.currentPage = response.page || 1;
        this.fetchStatus = "success";
        this.loader = false;
      });
    } catch (error) {
      runInAction(() => {
        this.fetchStatus = "error";
        this.loader = false;
        this.error = "Failed to fetch agent sessions";
      });
    }
  };

  /**
   * @description fetch next page of agent sessions (append to existing)
   * @param {string} workspaceSlug
   */
  fetchMoreSessions = async (workspaceSlug: string): Promise<void> => {
    if (this.currentPage >= this.totalPages || this.loader) return;

    this.loader = true;

    try {
      const nextPage = this.currentPage + 1;
      const response: IPaginatedResponse<IAgentSession> =
        await this.agentSessionService.fetchSessions(workspaceSlug, {
          page: nextPage,
          page_size: this.pageSize,
        });

      runInAction(() => {
        for (const session of response.results) {
          if (!this.sessions[session.id]) {
            this.sessions[session.id] = session;
            this.sessionIds.push(session.id);
          }
        }
        this.currentPage = response.page || nextPage;
        this.totalPages = response.total_pages;
        this.totalCount = response.count;
        this.loader = false;
      });
    } catch (error) {
      runInAction(() => {
        this.loader = false;
        this.error = "Failed to fetch more agent sessions";
      });
    }
  };

  /**
   * @description fetch a single session by id
   * @param {string} workspaceSlug
   * @param {string} sessionId
   * @returns {Promise<IAgentSession>}
   */
  fetchSessionById = async (workspaceSlug: string, sessionId: string): Promise<IAgentSession> => {
    try {
      const response: IAgentSession = await this.agentSessionService.fetchSession(workspaceSlug, sessionId);

      runInAction(() => {
        this.sessions[sessionId] = response;
        if (!this.sessionIds.includes(sessionId)) {
          this.sessionIds.push(sessionId);
        }
      });

      return response;
    } catch (error) {
      throw error;
    }
  };

  /**
   * @description update an agent session
   * @param {string} workspaceSlug
   * @param {string} sessionId
   * @param {Partial<IAgentSession>} data
   * @returns {Promise<IAgentSession>}
   */
  updateSession = async (
    workspaceSlug: string,
    sessionId: string,
    data: Partial<IAgentSession>
  ): Promise<IAgentSession> => {
    try {
      const response: IAgentSession = await this.agentSessionService.updateSession(workspaceSlug, sessionId, data);

      runInAction(() => {
        this.sessions[sessionId] = {
          ...this.sessions[sessionId],
          ...response,
        };
      });

      return response;
    } catch (error) {
      throw error;
    }
  };

  /**
   * @description delete an agent session
   * @param {string} workspaceSlug
   * @param {string} sessionId
   */
  deleteSession = async (workspaceSlug: string, sessionId: string): Promise<void> => {
    try {
      await this.agentSessionService.deleteSession(workspaceSlug, sessionId);

      runInAction(() => {
        delete this.sessions[sessionId];
        this.sessionIds = this.sessionIds.filter((id) => id !== sessionId);
      });
    } catch (error) {
      throw error;
    }
  };
}
