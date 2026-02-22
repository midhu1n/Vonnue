from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Decision, Option, Criterion
from .serializers import DecisionSerializer, OptionSerializer, CriterionSerializer
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
        
        # fallback parsing
        guessed_type = 'benefit'
        if 'cost' in ai_analysis:
            guessed_type = 'cost'
            
        return Response({'status': 'success', 'analysis': guessed_type})
