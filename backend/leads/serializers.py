from rest_framework import serializers
from .models import Lead

class LeadSerializer(serializers.ModelSerializer):
    id = serializers.CharField(required=False)

    class Meta:
        model = Lead
        fields = '__all__'
