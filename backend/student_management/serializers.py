from rest_framework import serializers
from .models import Student, Attendance, Grade, Activity

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ['id', 'name', 'roll_number', 'class_name', 'email', 'created_at', 'updated_at']

class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    student_id = serializers.IntegerField(source='student.id', read_only=True)

    class Meta:
        model = Attendance
        fields = ['id', 'student_id', 'student_name', 'date', 'present', 'created_at', 'updated_at']

class GradeSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    student_id = serializers.IntegerField(source='student.id', read_only=True)

    class Meta:
        model = Grade
        fields = ['id', 'student_id', 'student_name', 'subject', 'grade', 'marks', 'created_at', 'updated_at']

class ActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = ['id', 'description', 'activity_type', 'created_at'] 