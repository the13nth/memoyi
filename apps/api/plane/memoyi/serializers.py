# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Module imports
from rest_framework import serializers
from plane.app.serializers import BaseSerializer

from .models import AgentSession, AgentEvent, AgentMemory


class AgentSessionSerializer(BaseSerializer):
    class Meta:
        model = AgentSession
        fields = "__all__"
        read_only_fields = ["workspace", "created_by", "updated_by"]


class AgentEventSerializer(BaseSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = AgentEvent
        fields = "__all__"
        read_only_fields = ["workspace", "created_by", "updated_by"]

    def get_children(self, obj):
        children = obj.children.all()
        if children:
            return AgentEventSerializer(children, many=True).data
        return []


class AgentMemorySerializer(BaseSerializer):
    class Meta:
        model = AgentMemory
        fields = "__all__"
        read_only_fields = ["workspace", "created_by", "updated_by"]
