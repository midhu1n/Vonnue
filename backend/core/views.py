from rest_framework import generics
from .models import Decision, Option
from .serializers import DecisionSerializer, OptionSerializer

class DecisionCreateView(generics.CreateAPIView):
    queryset = Decision.objects.all()
    serializer_class = DecisionSerializer

class DecisionRetrieveView(generics.RetrieveAPIView):
    queryset = Decision.objects.all()
    serializer_class = DecisionSerializer

class OptionCreateView(generics.CreateAPIView):
    queryset = Option.objects.all()
    serializer_class = OptionSerializer
