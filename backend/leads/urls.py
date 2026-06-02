from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LeadViewSet, UserViewSet, login_view, CustomTokenRefreshView

router = DefaultRouter()
router.register(r'leads', LeadViewSet, basename='lead')
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/', login_view, name='auth-login'),
    path('auth/refresh/', CustomTokenRefreshView.as_view(), name='auth-refresh'),
]


