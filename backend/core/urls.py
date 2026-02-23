from django.urls import path
from .views import (
    DecisionCreateView, DecisionRetrieveView,
    OptionCreateView, OptionRetrieveUpdateDestroyView,
    CriterionCreateView,
    ScoreBulkUpsertView,
    AIGuessTypeView,
)

urlpatterns = [
    path('decisions/', DecisionCreateView.as_view(), name='decision-create'),
    path('decisions/<uuid:pk>/', DecisionRetrieveView.as_view(), name='decision-detail'),
    path('decisions/<uuid:decision_id>/options/', OptionCreateView.as_view(), name='option-create'),
    path('options/<uuid:pk>/', OptionRetrieveUpdateDestroyView.as_view(), name='option-detail'),
    path('decisions/<uuid:decision_id>/criteria/', CriterionCreateView.as_view(), name='criterion-create'),
    path('decisions/<uuid:decision_id>/scores/', ScoreBulkUpsertView.as_view(), name='score-bulk-upsert'),
    path('ai/guess-type/', AIGuessTypeView.as_view(), name='ai-guess-type'),
]
