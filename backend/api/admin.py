from django.contrib import admin
from .models import Student, Attendance, Grade, Activity

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('name', 'roll_number', 'class_name', 'email', 'created_at')
    search_fields = ('name', 'roll_number', 'email')
    list_filter = ('class_name',)

@admin.register(Attendance)
class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('student', 'date', 'is_present', 'created_at')
    list_filter = ('date', 'is_present')
    search_fields = ('student__name', 'student__roll_number')
    date_hierarchy = 'date'

@admin.register(Grade)
class GradeAdmin(admin.ModelAdmin):
    list_display = ('student', 'subject', 'grade', 'marks', 'created_at')
    list_filter = ('subject', 'grade')
    search_fields = ('student__name', 'student__roll_number')

@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ('activity_type', 'description', 'created_at')
    list_filter = ('activity_type', 'created_at')
    search_fields = ('description',)
    date_hierarchy = 'created_at'
