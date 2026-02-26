from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Decision, Option, Criterion, Score
from .serializers import DecisionSerializer, OptionSerializer, CriterionSerializer, ScoreSerializer
from .utils import get_gemini_response

class DecisionCreateView(generics.CreateAPIView):
    queryset = Decision.objects.all()
    serializer_class = DecisionSerializer

class DecisionRetrieveView(generics.RetrieveAPIView):
    queryset = Decision.objects.all()
    serializer_class = DecisionSerializer

class OptionCreateView(generics.CreateAPIView):
    queryset = Option.objects.all()
    serializer_class = OptionSerializer

class OptionRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Option.objects.all()
    serializer_class = OptionSerializer

class CriterionCreateView(generics.CreateAPIView):
    queryset = Criterion.objects.all()
    serializer_class = CriterionSerializer

class CriterionRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Criterion.objects.all()
    serializer_class = CriterionSerializer

class CriterionBulkUpsertView(APIView):
    def post(self, request, decision_id, *args, **kwargs):
        criteria_data = request.data
        if not isinstance(criteria_data, list):
            return Response({'error': 'Expected a list of criteria.'}, status=status.HTTP_400_BAD_REQUEST)

        results = []
        for item in criteria_data:
            c_id = item.get('id')
            name = item.get('name')
            weight = item.get('weight')
            c_type = item.get('type')

            if name is None or weight is None or c_type is None:
                continue

            try:
                crit, _ = Criterion.objects.update_or_create(
                    id=c_id if c_id else None,
                    decision_id=decision_id,
                    defaults={'name': name, 'weight': weight, 'type': c_type}
                )
                results.append(CriterionSerializer(crit).data)
            except Exception as e:
                pass # Usually invalid UUID or constraint

        return Response(results, status=status.HTTP_200_OK)

class ScoreBulkUpsertView(APIView):
    """
    POST /api/decisions/<decision_id>/scores/
    Body: [{ option, criterion, value }, ...]
    Creates or updates each (option, criterion) score.
    """
    def post(self, request, decision_id, *args, **kwargs):
        scores_data = request.data  # expect a list
        if not isinstance(scores_data, list):
            return Response({'error': 'Expected a list of scores.'}, status=status.HTTP_400_BAD_REQUEST)

        results = []
        for item in scores_data:
            option_id = item.get('option')
            criterion_id = item.get('criterion')
            value = item.get('value')

            if option_id is None or criterion_id is None or value is None:
                continue

            score, _ = Score.objects.update_or_create(
                option_id=option_id,
                criterion_id=criterion_id,
                defaults={'value': value}
            )
            results.append(ScoreSerializer(score).data)

        return Response(results, status=status.HTTP_200_OK)

class AIGuessTypeView(APIView):
    def post(self, request, *args, **kwargs):
        criterion_name = request.data.get('q', '').strip()
        if not criterion_name:
            return Response({'status': 'error', 'message': 'No input provided'}, status=400)
            
        prompt = (
            f"Is the criterion '{criterion_name}' generally a 'benefit' (where a higher value is better) "
            f"or a 'cost' (where a lower value is better) when making a decision? "
            f"Reply with exactly 'benefit' or 'cost' and nothing else."
        )
        
        ai_analysis = get_gemini_response(prompt)
        
        guessed_type = 'benefit'
        if 'cost' in ai_analysis:
            guessed_type = 'cost'
            
        return Response({'status': 'success', 'analysis': guessed_type})
