# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
from django.db import models

# Module imports
from plane.db.models import BaseModel, WorkspaceBaseModel


class AgentSession(WorkspaceBaseModel):
    agent_id = models.CharField(max_length=255)
    label = models.CharField(max_length=255, blank=True, default="")
    status = models.CharField(
        max_length=20,
        choices=[
            ("active", "Active"),
            ("paused", "Paused"),
            ("completed", "Completed"),
            ("error", "Error"),
        ],
        default="active",
    )
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    event_count = models.IntegerField(default=0)
    total_tokens_in = models.IntegerField(default=0)
    total_tokens_out = models.IntegerField(default=0)
    total_cost = models.DecimalField(max_digits=12, decimal_places=6, default=0.0)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = "Agent Session"
        verbose_name_plural = "Agent Sessions"
        db_table = "memoyi_agent_sessions"
        ordering = ("-started_at",)

    def __str__(self):
        return f"{self.agent_id} - {self.status}"


class AgentEvent(WorkspaceBaseModel):
    session = models.ForeignKey(
        AgentSession, on_delete=models.CASCADE, related_name="events"
    )
    event_type = models.CharField(
        max_length=50,
        choices=[
            ("llm_call", "LLM Call"),
            ("tool_call", "Tool Call"),
            ("tool_result", "Tool Result"),
            ("memory_write", "Memory Write"),
            ("memory_read", "Memory Read"),
            ("decision", "Decision"),
            ("error", "Error"),
            ("system_prompt", "System Prompt"),
            ("user_message", "User Message"),
            ("agent_message", "Agent Message"),
        ],
    )
    payload = models.JSONField(default=dict)
    parent_event = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="children",
    )
    tokens_in = models.IntegerField(default=0)
    tokens_out = models.IntegerField(default=0)
    latency_ms = models.IntegerField(null=True, blank=True)

    class Meta:
        verbose_name = "Agent Event"
        verbose_name_plural = "Agent Events"
        db_table = "memoyi_agent_events"
        ordering = ("created_at",)
        indexes = [
            models.Index(fields=["session", "event_type"]),
            models.Index(fields=["session", "created_at"]),
        ]

    def __str__(self):
        return f"{self.event_type} - {self.session_id}"


class AgentMemory(WorkspaceBaseModel):
    session = models.ForeignKey(
        AgentSession, on_delete=models.CASCADE, related_name="memories"
    )
    content = models.TextField()
    memory_type = models.CharField(
        max_length=50,
        choices=[
            ("fact", "Fact"),
            ("preference", "Preference"),
            ("conversation", "Conversation"),
            ("project", "Project"),
            ("task", "Task"),
        ],
        default="fact",
    )
    tags = models.JSONField(default=list, blank=True)
    importance = models.FloatField(default=1.0)
    embedding = models.JSONField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "Agent Memory"
        verbose_name_plural = "Agent Memories"
        db_table = "memoyi_agent_memories"
        ordering = ("-importance", "-created_at",)
        indexes = [
            models.Index(fields=["session", "memory_type"]),
        ]

    def __str__(self):
        return f"{self.memory_type}: {self.content[:50]}"
