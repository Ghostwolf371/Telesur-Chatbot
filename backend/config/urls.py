from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("apps.chat.urls")),
    path("api/", include("apps.conversations.urls")),
    path("api/", include("apps.telemetry.urls")),
]
