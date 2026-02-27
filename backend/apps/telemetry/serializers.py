from rest_framework import serializers


class TelemetryItemSerializer(serializers.Serializer):
    endpoint = serializers.CharField()
    ttft_ms = serializers.IntegerField()
    total_tokens_est = serializers.IntegerField()
    status = serializers.CharField()
    created_at = serializers.DateTimeField()
    error_message = serializers.CharField(required=False, allow_blank=True, allow_null=True)
