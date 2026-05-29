# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import AgentSessionViewSet, AgentEventViewSet, AgentMemoryViewSet

router = DefaultRouter()
router.register(r"agent-sessions", AgentSessionViewSet, basename="workspace-agent-sessions")
router.register(r"agent-events", AgentEventViewSet, basename="workspace-agent-events")
router.register(r"agent-memories", AgentMemoryViewSet, basename="workspace-agent-memories")

urlpatterns = [
    path("workspaces/<str:slug>/", include(router.urls)),
]
