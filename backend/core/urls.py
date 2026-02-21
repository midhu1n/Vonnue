from django.urls import path
from .views import DecisionCreateView, DecisionRetrieveView, OptionCreateView

urlpatterns = [
    path('decisions/', DecisionCreateView.as_view(), name='decision-create'),
    path('decisions/<uuid:pk>/', DecisionRetrieveView.as_view(), name='decision-detail'),
    path('decisions/<uuid:decision_id>/options/', OptionCreateView.as_view(), name='option-create'),
]
