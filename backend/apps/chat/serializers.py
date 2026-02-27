from rest_framework import serializers


class ChatRequestSerializer(serializers.Serializer):
    session_id = serializers.CharField(required=False, allow_blank=False)
    user_id = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    message = serializers.CharField(required=True, allow_blank=False)
