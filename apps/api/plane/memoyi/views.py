# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.views.base import BaseViewSet
from plane.app.permissions import allow_permission, ROLE
from plane.db.models import Workspace

from .models import AgentSession, AgentEvent, AgentMemory
from .serializers import (
    AgentSessionSerializer,
    AgentEventSerializer,
    AgentMemorySerializer,
)


class AgentSessionViewSet(BaseViewSet):
    serializer_class = AgentSessionSerializer
    model = AgentSession
    use_read_replica = True

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .select_related("workspace")
            .distinct()
        )

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def create(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = AgentSessionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(workspace_id=workspace.id, created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def list(self, request, slug):
        sessions = self.get_queryset().order_by("-started_at")
        return self.paginate(
            request=request,
            queryset=sessions,
            on_results=lambda sessions: AgentSessionSerializer(sessions, many=True).data,
            default_per_page=20,
        )

    def retrieve(self, request, slug, pk=None):
        session = self.get_object()
        serializer = AgentSessionSerializer(session)
        return Response(serializer.data)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def partial_update(self, request, slug, pk=None):
        session = self.get_object()
        serializer = AgentSessionSerializer(session, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def destroy(self, request, slug, pk=None):
        session = self.get_object()
        session.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AgentEventViewSet(BaseViewSet):
    serializer_class = AgentEventSerializer
    model = AgentEvent
    use_read_replica = True

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .select_related("session", "workspace")
            .distinct()
        )

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def create(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = AgentEventSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(workspace_id=workspace.id, created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def list(self, request, slug):
        events = self.get_queryset().order_by("created_at")
        return self.paginate(
            request=request,
            queryset=events,
            on_results=lambda events: AgentEventSerializer(events, many=True).data,
            default_per_page=50,
        )

    def retrieve(self, request, slug, pk=None):
        event = self.get_object()
        serializer = AgentEventSerializer(event)
        return Response(serializer.data)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def destroy(self, request, slug, pk=None):
        event = self.get_object()
        event.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AgentMemoryViewSet(BaseViewSet):
    serializer_class = AgentMemorySerializer
    model = AgentMemory
    use_read_replica = True

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .select_related("session", "workspace")
            .distinct()
        )

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def create(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = AgentMemorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(workspace_id=workspace.id, created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def list(self, request, slug):
        memories = self.get_queryset().order_by("-importance", "-created_at")
        return self.paginate(
            request=request,
            queryset=memories,
            on_results=lambda memories: AgentMemorySerializer(memories, many=True).data,
            default_per_page=20,
        )

    def retrieve(self, request, slug, pk=None):
        memory = self.get_object()
        serializer = AgentMemorySerializer(memory)
        return Response(serializer.data)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def destroy(self, request, slug, pk=None):
        memory = self.get_object()
        memory.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
