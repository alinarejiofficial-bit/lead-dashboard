from django.db import models
from datetime import datetime, timedelta
from django.utils import timezone
from django.contrib.auth.hashers import make_password


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


class UserProfile(models.Model):
    ROLE_CHOICES = [('admin', 'Admin'), ('agent', 'Agent')]
    STATUS_CHOICES = [('active', 'Active'), ('inactive', 'Inactive')]

    id = models.CharField(max_length=100, primary_key=True)
    name = models.CharField(max_length=255)
    email = models.EmailField(max_length=255, unique=True)
    password = models.CharField(max_length=255)   # plain-text in input/db (automatically hashed on save)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='agent')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    color = models.CharField(max_length=20, default='#6359E9')
    joinedDate = models.CharField(max_length=20, blank=True, null=True)
    last_activity = models.DateTimeField(null=True, blank=True)
    avatar = models.TextField(blank=True, null=True)

    @property
    def is_online(self):
        if self.status == 'inactive':
            return False
        if not self.last_activity:
            return False
        return timezone.now() - self.last_activity < timedelta(minutes=5)

    @property
    def is_authenticated(self):
        return True

    def save(self, *args, **kwargs):
        if not self.id:
            self.id = f"u-{int(datetime.now().timestamp() * 1000)}"
        if not self.joinedDate:
            self.joinedDate = datetime.now().strftime('%Y-%m-%d')
        
        # Hashing raw passwords securely
        if self.password and not (self.password.startswith('pbkdf2_sha256$') or self.password.startswith('bcrypt$') or self.password.startswith('argon2$')):
            self.password = make_password(self.password)
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.role})"


class UsedRefreshToken(models.Model):
    jti = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Used Refresh Token: {self.jti}"


