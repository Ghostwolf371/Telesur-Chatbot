from django.urls import path

from .views import FeedbackView, HistoryView, SummarizeView

urlpatterns = [
    path("history/<str:session_id>", HistoryView.as_view(), name="history"),
    path("summarize", SummarizeView.as_view(), name="summarize"),
    path("feedback", FeedbackView.as_view(), name="feedback"),
]
