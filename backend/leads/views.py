from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.hashers import check_password, make_password
from .models import Lead, UserProfile
from .serializers import LeadSerializer, UserProfileSerializer
from datetime import datetime

INITIAL_LEADS = []

# ── Default seed users (created once on first run) ──────────────────────────
SEED_USERS = [
    {
        "id": "u-1",
        "name": "Alina Reji",
        "email": "alina@leadflow.com",
        "password": "admin",
        "role": "admin",
        "status": "active",
        "color": "#aa3bff",
        "joinedDate": "2026-01-15",
    },
    {
        "id": "u-test",
        "name": "Test Agent",
        "email": "test@leadflow.com",
        "password": "password",
        "role": "agent",
        "status": "active",
        "color": "#00d2fc",
        "joinedDate": "2026-06-01",
    },
]


def seed_users_if_empty():
    """Create default users only if the table is empty. Also upgrade any plain-text passwords to hashed ones."""
    if UserProfile.objects.count() == 0:
        for u in SEED_USERS:
            UserProfile.objects.get_or_create(id=u["id"], defaults=u)
    else:
        # Check if existing database users have plain text passwords, and update them to hashed if so
        for user in UserProfile.objects.all():
            if user.password and not (user.password.startswith('pbkdf2_sha256$') or user.password.startswith('bcrypt$') or user.password.startswith('argon2$')):
                user.password = make_password(user.password)
                user.save()


# ── Auth endpoints ───────────────────────────────────────────────────────────

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    POST /api/auth/login/
    Body: { "email": "...", "password": "...", "loginType": "agent"|"admin" }
    Returns the user object (without password) and JWT tokens on success.
    """
    seed_users_if_empty()

    email = request.data.get('email', '').strip().lower()
    password = request.data.get('password', '')
    login_type = request.data.get('loginType', 'agent')

    if not email or not password:
        return Response(
            {"error": "Email and password are required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = UserProfile.objects.get(email__iexact=email)
    except UserProfile.DoesNotExist:
        return Response(
            {"error": "Invalid email or password."},
            status=status.HTTP_401_UNAUTHORIZED
        )

    # Use check_password for secure verification
    if not check_password(password, user.password):
        return Response(
            {"error": "Invalid email or password."},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if user.role != login_type:
        portal = user.role.capitalize()
        return Response(
            {"error": f"Access Denied. Please use the {portal} Portal."},
            status=status.HTTP_403_FORBIDDEN
        )

    if user.status == 'inactive':
        return Response(
            {"error": "This account is deactivated. Contact Admin."},
            status=status.HTTP_403_FORBIDDEN
        )

    # Generate JWT Refresh and Access Tokens
    refresh = RefreshToken()
    refresh['user_id'] = user.id
    refresh['email'] = user.email
    refresh['role'] = user.role

    serializer = UserProfileSerializer(user)
    return Response({
        "user": serializer.data,
        "access": str(refresh.access_token),
        "refresh": str(refresh)
    }, status=status.HTTP_200_OK)


# ── Users CRUD ───────────────────────────────────────────────────────────────

class UserViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all().order_by('joinedDate')
    serializer_class = UserProfileSerializer

    def get_queryset(self):
        seed_users_if_empty()
        return super().get_queryset()

    def create(self, request, *args, **kwargs):
        """Create a new user — password must be supplied in body."""
        data = request.data.copy()
        if not data.get('password'):
            return Response(
                {"error": "Password is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        user_id = f"u-{int(datetime.now().timestamp() * 1000)}"
        user = UserProfile(
            id=user_id,
            name=data.get('name', ''),
            email=data.get('email', ''),
            password=data.get('password', ''),
            role=data.get('role', 'agent'),
            status=data.get('status', 'active'),
            color=data.get('color', '#6359E9'),
        )
        user.save()
        serializer = UserProfileSerializer(user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """Update user fields. Password only updated if supplied."""
        instance = self.get_object()
        data = request.data
        instance.name = data.get('name', instance.name)
        instance.email = data.get('email', instance.email)
        instance.role = data.get('role', instance.role)
        instance.status = data.get('status', instance.status)
        instance.color = data.get('color', instance.color)
        if data.get('password'):
            instance.password = data['password']
        instance.save()
        serializer = UserProfileSerializer(instance)
        return Response(serializer.data)


# ── Leads CRUD ───────────────────────────────────────────────────────────────

class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.all().order_by('-id')
    serializer_class = LeadSerializer

    def get_permissions(self):
        """Allow public anonymous user to submit/create leads, require authentication for all other actions."""
        if self.action == 'create':
            return [AllowAny()]
        return super().get_permissions()

    def create(self, request, *args, **kwargs):
        """Submit a new lead with duplicate email check."""
        email = request.data.get('email', '').strip().lower()
        if email:
            if Lead.objects.filter(email__iexact=email).exists():
                return Response(
                    {"error": "Details are already collected for this email address."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        return super().create(request, *args, **kwargs)

    @action(detail=False, methods=['post'])
    def reset(self, request):
        Lead.objects.all().delete()
        seeded_leads = []
        for lead_data in INITIAL_LEADS:
            lead = Lead(**lead_data)
            lead.save()
            seeded_leads.append(lead)
        serializer = self.get_serializer(seeded_leads, many=True)
        return Response({
            "status": "success",
            "message": f"Reset and seeded {len(seeded_leads)} leads.",
            "leads": serializer.data
        }, status=status.HTTP_200_OK)


# ── Custom Token Refresh View ──────────────────────────────────────────────────

from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

class CustomTokenRefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token_str = request.data.get('refresh')
        if not refresh_token_str:
            return Response(
                {"error": "Refresh token is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Decode and cryptographically validate incoming refresh token
            refresh = RefreshToken(refresh_token_str)
            jti = refresh.get('jti')
            
            # Check if this token was already rotated and blacklisted
            from .models import UsedRefreshToken
            if UsedRefreshToken.objects.filter(jti=jti).exists():
                raise InvalidToken("This refresh token has already been used and rotated.")
            
            user_id = refresh.get('user_id')
            email = refresh.get('email')
            role = refresh.get('role')
            
            if not user_id:
                raise InvalidToken("Token payload is missing user identity claims.")
            
            # Record old token as rotated / blacklisted
            UsedRefreshToken.objects.create(jti=jti)
            
            # Generate a new rotated token pair
            new_refresh = RefreshToken()
            new_refresh['user_id'] = user_id
            new_refresh['email'] = email
            new_refresh['role'] = role
            
            return Response({
                "access": str(new_refresh.access_token),
                "refresh": str(new_refresh)
            }, status=status.HTTP_200_OK)
            
        except TokenError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_401_UNAUTHORIZED
            )

