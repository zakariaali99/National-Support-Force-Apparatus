from rest_framework import serializers

from apps.members.models import MemberEvaluation


class MemberEvaluationSerializer(serializers.ModelSerializer):
    evaluator_name = serializers.CharField(source="evaluator.get_full_name", read_only=True)

    class Meta:
        model = MemberEvaluation
        fields = [
            "id",
            "member",
            "period_start",
            "period_end",
            "body",
            "score",
            "evaluator",
            "evaluator_name",
            "evaluated_on",
            "created_at",
        ]
        read_only_fields = ["id", "evaluator", "evaluated_on", "created_at"]

    def validate(self, attrs):
        start = attrs.get("period_start", getattr(self.instance, "period_start", None))
        end = attrs.get("period_end", getattr(self.instance, "period_end", None))
        if start and end and start > end:
            raise serializers.ValidationError("تاريخ بداية الفترة يجب أن يسبق تاريخ نهايتها.")
        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            validated_data["evaluator"] = request.user
        return super().create(validated_data)
