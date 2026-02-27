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

class AIOptionSuggestView(APIView):
    def post(self, request, *args, **kwargs):
        query = request.data.get('q', '').strip()
        if not query:
            return Response({'status': 'error', 'message': 'No input provided'}, status=400)
            
        prompt = (
            f"Suggest 5 popular, specific, real-world options (e.g. products, models, or choices) "
            f"that perfectly match the decision context: '{query}'. "
            f"Pay strict attention to any constraints mentioned (e.g., budget limits like 'under 15k', specific types, or use cases). "
            f"Only return a comma-separated list of the 5 text options. Do not include quotes, numbering, introductory text, or descriptions."
        )
        
        ai_analysis = get_gemini_response(prompt)
        
        if ai_analysis == "error" or ai_analysis == "error: missing api key":
             return Response({'status': 'error', 'message': 'AI service unavailable'}, status=503)

        # Split and clean the results list
        options = [opt.strip().title() for opt in ai_analysis.split(',') if opt.strip()]
        
        return Response({'status': 'success', 'options': options[:5]})

class AIOptionSummaryView(APIView):
    def post(self, request, *args, **kwargs):
        decision_query = request.data.get('decision', '').strip()
        option_name = request.data.get('option', '').strip()
        
        if not option_name or not decision_query:
            return Response({'status': 'error', 'message': 'Missing decision or option input'}, status=400)
            
        prompt = (
            f"Provide an ultra-fast, strictly factual summary of '{option_name}' "
            f"in the context of: '{decision_query}'.\n"
            f"Keep all strings as short as humanly possible to optimize generation speed.\n"
            f"Return a strict JSON object with EXACTLY these keys:\n"
            f"- \"price\": Current estimated price range\n"
            f"- \"variants\": 1-5 words describing variants\n"
            f"- \"offers\": 1-5 words describing best offer\n"
            f"- \"features\": Array of 3 short bullet points\n"
            f"- \"pros_cons\": Array of 2 very brief pros/cons\n"
            f"ONLY output valid JSON without any markdown formatting."
        )
        
        ai_analysis = get_gemini_response(prompt)
        
        if ai_analysis == "error" or ai_analysis == "error: missing api key":
             return Response({'status': 'error', 'message': 'AI service unavailable'}, status=503)

        try:
            import json
            # Clean up potential markdown code block markers
            cleaned_json = ai_analysis.strip()
            if cleaned_json.startswith("```json"):
                cleaned_json = cleaned_json[7:]
            if cleaned_json.startswith("```"):
                cleaned_json = cleaned_json[3:]
            if cleaned_json.endswith("```"):
                cleaned_json = cleaned_json[:-3]
                
            parsed_data = json.loads(cleaned_json.strip())
            return Response({'status': 'success', 'summary': parsed_data})
        except Exception as e:
            # Fallback if json parsing fails
            return Response({'status': 'success', 'summary': {'features': [ai_analysis], 'price': 'N/A', 'variants': 'N/A', 'offers': 'N/A', 'pros_cons': []}})
