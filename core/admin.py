# admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Project, ProjectDetail


# =======================
# Custom User Admin
# =======================
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    model = User

    list_display = ('username', 'email', 'role', 'is_staff', 'is_superuser', 'is_active')
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active')
    search_fields = ('username', 'email')
    ordering = ('username',)

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Role Information', {'fields': ('role',)}),
    )

    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Role Information', {'fields': ('role',)}),
    )


# =======================
# ProjectDetail Inline
# =======================
class ProjectDetailInline(admin.StackedInline):
    model = ProjectDetail
    extra = 1
    filter_horizontal = ('assign_person',)


# =======================
# Project Admin
# =======================
@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = (
        'project_name',
        'project_id',
        'client_name',
        'team_lead',
        'assign_date',
        'due_date',
        'progress',
    )
    list_filter = ('team_lead', 'assign_date', 'due_date')
    search_fields = ('project_name', 'project_id', 'client_name', 'team_lead__username')
    inlines = [ProjectDetailInline]


# =======================
# ProjectDetail Standalone Admin
# =======================
@admin.register(ProjectDetail)
class ProjectDetailAdmin(admin.ModelAdmin):
    list_display = ('project', 'time_estimated')
    search_fields = ('project__project_name',)
    filter_horizontal = ('assign_person',)
