from rest_framework import serializers
from .models import Student, Attendance, Grade, Activity

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ['id', 'name', 'roll_number', 'class_name', 'email', 'created_at', 'updated_at']

class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    
    class Meta:
        model = Attendance
        fields = ['id', 'student', 'student_name', 'date', 'is_present', 'created_at']

class GradeSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    student_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Grade
        fields = ['id', 'student_id', 'student_name', 'subject', 'grade', 'marks', 'created_at', 'updated_at']

    def create(self, validated_data):
        student_id = validated_data.pop('student_id')
        student = Student.objects.get(id=student_id)
        return Grade.objects.create(student=student, **validated_data)

    def update(self, instance, validated_data):
        if 'student_id' in validated_data:
            student_id = validated_data.pop('student_id')
            instance.student = Student.objects.get(id=student_id)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

class ActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Activity
        fields = ['id', 'description', 'activity_type', 'created_at'] 