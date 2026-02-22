from rest_framework import serializers
from .models import Decision, Option, Criterion

class OptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Option
        fields = ['id', 'decision', 'title', 'created_at']
        read_only_fields = ['id', 'created_at']

class CriterionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Criterion
        fields = ['id', 'decision', 'name', 'weight', 'type', 'created_at']
        read_only_fields = ['id', 'created_at']

class DecisionSerializer(serializers.ModelSerializer):
    options = OptionSerializer(many=True, read_only=True)
    criteria = CriterionSerializer(many=True, read_only=True)

    class Meta:
        model = Decision
        fields = ['id', 'query', 'created_at', 'options', 'criteria']
        read_only_fields = ['id', 'created_at', 'options', 'criteria']
