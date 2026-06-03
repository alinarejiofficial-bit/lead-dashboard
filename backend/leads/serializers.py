from rest_framework import serializers
from .models import Lead, UserProfile


class LeadSerializer(serializers.ModelSerializer):
    id = serializers.CharField(required=False)

    class Meta:
        model = Lead
        fields = '__all__'


class UserProfileSerializer(serializers.ModelSerializer):
    id = serializers.CharField(required=False)
    is_online = serializers.ReadOnlyField()

    class Meta:
        model = UserProfile
        fields = ['id', 'name', 'email', 'role', 'status', 'color', 'joinedDate', 'is_online']
        # password is intentionally excluded from responses
