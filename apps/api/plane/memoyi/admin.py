# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.contrib import admin

# Module imports
from .models import AgentSession, AgentEvent, AgentMemory


class AgentSessionAdmin(admin.ModelAdmin):
    list_display = ("agent_id", "status", "started_at", "event_count")
    list_filter = ("status",)
    search_fields = ("agent_id", "label")
    readonly_fields = ("created_at", "updated_at")


class AgentEventAdmin(admin.ModelAdmin):
    list_display = ("event_type", "session", "created_at")
    list_filter = ("event_type",)
    search_fields = ("session__agent_id",)
    readonly_fields = ("created_at", "updated_at")


class AgentMemoryAdmin(admin.ModelAdmin):
    list_display = ("memory_type", "session", "importance", "created_at")
    list_filter = ("memory_type",)
    search_fields = ("content", "session__agent_id")
    readonly_fields = ("created_at", "updated_at")


admin.site.register(AgentSession, AgentSessionAdmin)
admin.site.register(AgentEvent, AgentEventAdmin)
admin.site.register(AgentMemory, AgentMemoryAdmin)
