from rest_framework import serializers
from .models import Decision, Option

class OptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Option
        fields = ['id', 'decision', 'title', 'created_at']
        read_only_fields = ['id', 'created_at']

class DecisionSerializer(serializers.ModelSerializer):
    options = OptionSerializer(many=True, read_only=True)

    class Meta:
        model = Decision
        fields = ['id', 'query', 'created_at', 'options']
        read_only_fields = ['id', 'created_at', 'options']
