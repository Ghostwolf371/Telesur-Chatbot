from django.urls import path

from .views import DashboardView, TelemetryListView

urlpatterns = [
    path("telemetry", TelemetryListView.as_view(), name="telemetry"),
    path("dashboard", DashboardView.as_view(), name="dashboard"),
]
