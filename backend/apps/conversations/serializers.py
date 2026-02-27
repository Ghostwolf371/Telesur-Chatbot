from rest_framework import serializers


class SummarizeRequestSerializer(serializers.Serializer):
    session_id = serializers.CharField(required=True)
    force = serializers.BooleanField(required=False, default=False)


class FeedbackCreateSerializer(serializers.Serializer):
    session_id = serializers.CharField(required=True)
    tester_id = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    rating = serializers.IntegerField(required=True, min_value=1, max_value=5)
    success = serializers.BooleanField(required=True)
    is_synthetic = serializers.BooleanField(required=False, default=False)
    scenario = serializers.ChoiceField(
        choices=[
            "mobile",
            "fiber",
            "entertainment",
            "out_of_scope",
            "safety_probe",
            "other",
        ],
        required=True,
    )
    notes = serializers.CharField(required=False, allow_blank=True, allow_null=True, max_length=1000)


class FeedbackQuerySerializer(serializers.Serializer):
    session_id = serializers.CharField(required=False)
    tester_id = serializers.CharField(required=False)
    include_synthetic = serializers.BooleanField(required=False, default=False)
    limit = serializers.IntegerField(required=False, min_value=1, max_value=1000, default=200)
