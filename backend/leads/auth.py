from rest_framework import authentication, exceptions
from rest_framework_simplejwt.tokens import AccessToken
from .models import UserProfile

class UserProfileJWTAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return None
        
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return None
        
        token = parts[1]
        try:
            # Decode and validate token using SimpleJWT's AccessToken wrapper
            validated_token = AccessToken(token)
            user_id = validated_token.get('user_id')
            if not user_id:
                raise exceptions.AuthenticationFailed('Invalid token payload: missing user_id.')
            
            try:
                user = UserProfile.objects.get(id=user_id)
            except UserProfile.DoesNotExist:
                raise exceptions.AuthenticationFailed('User profile associated with this token does not exist.')
                
            if user.status == 'inactive':
                raise exceptions.AuthenticationFailed('This user account is inactive.')
                
            # Update user's last activity on every authenticated request
            from django.utils import timezone
            user.last_activity = timezone.now()
            user.save(update_fields=['last_activity'])

            # Return authenticated user and token
            return (user, token)
        except Exception as e:
            raise exceptions.AuthenticationFailed(f"Invalid token: {str(e)}")

    def authenticate_header(self, request):
        return 'Bearer'
