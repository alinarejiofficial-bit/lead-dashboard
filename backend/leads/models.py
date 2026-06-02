from django.db import models
from datetime import datetime

class Lead(models.Model):
    id = models.CharField(max_length=100, primary_key=True)
    name = models.CharField(max_length=255)
    email = models.EmailField(max_length=255)
    phone = models.CharField(max_length=100)
    address = models.TextField(blank=True, null=True)
    company = models.CharField(max_length=255, default="N/A", blank=True, null=True)
    budget = models.IntegerField(default=0)
    source = models.CharField(max_length=100, default="Website")
    status = models.CharField(max_length=50, default="open")
    assignedTo = models.CharField(max_length=100, blank=True, null=True)
    assignedToName = models.CharField(max_length=255, blank=True, null=True)
    notes = models.JSONField(default=list, blank=True)
    createdAt = models.CharField(max_length=50, blank=True, null=True)
    updatedAt = models.CharField(max_length=50, blank=True, null=True)

    def save(self, *args, **kwargs):
        # Generate id if not present
        if not self.id:
            self.id = f"lead-{int(datetime.now().timestamp() * 1000)}"
        
        # Populate dates if not present
        now_str = datetime.now().strftime('%Y-%m-%d %H:%M')
        if not self.createdAt:
            self.createdAt = now_str
        if not self.updatedAt:
            self.updatedAt = now_str
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.company})"
