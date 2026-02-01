from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('team_lead', 'Team Lead'),
        ('employee', 'Estimator'),
        ('qa', 'QA'),  # 🔥 NEW ROLE
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='employee')

    def __str__(self):
        return self.username


class Project(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('approval', 'Approval Pending'),
        ('revision', 'Revision'),
        ('completed', 'Completed'),
        ('qa', 'QA'),
    )

    project_name = models.CharField(max_length=255)
    project_id = models.CharField(max_length=50, unique=True)
    client_name = models.CharField(max_length=255, blank=True, null=True)
    assign_date = models.DateField()
    due_date = models.DateField()
    expected_date = models.DateField(blank=True, null=True)
    project_link = models.URLField(max_length=500, blank=True, null=True)
    team_lead = models.ForeignKey(
    User,
    on_delete=models.SET_NULL,
    null=True,
    related_name='led_projects',  # 🔥 ADD THIS LINE
    limit_choices_to={'role': 'team_lead'}
    )
        # 🔥 NEW FIELD - QA Person
    qa_person = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='qa_projects',
        limit_choices_to={'role': 'qa'}
    )
    progress = models.PositiveIntegerField(default=0)
    team_lead_approved = models.BooleanField(default=False)
    qa_approved = models.BooleanField(default=False)

    # 🔥 NEW FIELD (does NOT affect existing functionality)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active'
    )

    def __str__(self):
        return f"{self.project_name} ({self.project_id})"


class ProjectDetail(models.Model):
    project = models.OneToOneField(Project, on_delete=models.CASCADE)
    scope = models.TextField(blank=True, null=True)
    comments = models.TextField(blank=True, null=True)
    instructions = models.TextField(blank=True, null=True)
    revisions = models.TextField(blank=True, null=True)
    team_lead_revisions = models.TextField(blank=True, null=True)

    assign_person = models.ManyToManyField(
        User,
        limit_choices_to={'role': 'employee'},
        blank=True
    )

    time_estimated = models.FloatField(blank=True, null=True)

    comments_team_lead = models.TextField(blank=True, null=True)
    employee_questions = models.TextField(blank=True, null=True)
    client_remarks = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Details of {self.project.project_name}"


class ProjectFile(models.Model):
    project_detail = models.ForeignKey(
        ProjectDetail,
        on_delete=models.CASCADE,
        related_name='files'
    )
    file = models.FileField(upload_to='project_files/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.file.name


class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="notifications")
    message = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    def __str__(self):
        return self.message
    

class FinalSubmissionFile(models.Model):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name='final_files'
    )
    file = models.FileField(upload_to='final_submission/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        limit_choices_to={'role': 'employee'}  # 👈 Only employees can upload
    )

    def __str__(self):
        return f"Final file for {self.project.project_name}"

class EmployeeProjectProgress(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="employee_progresses")
    employee = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'role': 'employee'})
    progress = models.PositiveIntegerField(default=0)  # 0-100%
    working_hours = models.FloatField(blank=True, null=True)
    final_submission_link = models.URLField(blank=True, null=True)

    class Meta:
        unique_together = ('project', 'employee')

    def __str__(self):
        return f"{self.employee.username} - {self.project.project_name} ({self.progress}%)"

