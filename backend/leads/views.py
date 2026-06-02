from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Lead
from .serializers import LeadSerializer
from datetime import datetime

INITIAL_LEADS = []

class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.all().order_by('-id')
    serializer_name = 'lead'
    serializer_class = LeadSerializer

    @action(detail=False, methods=['post'])
    def reset(self, request):
        """
        Custom endpoint to clear the database and seed it with initial leads.
        """
        Lead.objects.all().delete()
        
        seeded_leads = []
        for lead_data in INITIAL_LEADS:
            lead = Lead(
                id=lead_data["id"],
                name=lead_data["name"],
                email=lead_data["email"],
                phone=lead_data["phone"],
                company=lead_data["company"],
                budget=lead_data["budget"],
                source=lead_data["source"],
                status=lead_data["status"],
                assignedTo=lead_data["assignedTo"],
                assignedToName=lead_data["assignedToName"],
                notes=lead_data["notes"],
                createdAt=lead_data["createdAt"],
                updatedAt=lead_data["updatedAt"]
            )
            lead.save()
            seeded_leads.append(lead)
            
        serializer = self.get_serializer(seeded_leads, many=True)
        return Response({
            "status": "success",
            "message": f"Successfully reset and seeded {len(seeded_leads)} leads.",
            "leads": serializer.data
        }, status=status.HTTP_200_OK)
