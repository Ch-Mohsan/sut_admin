from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Student, Attendance, Grade, Activity
from .serializers import StudentSerializer, AttendanceSerializer, GradeSerializer, ActivitySerializer

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer

    def perform_create(self, serializer):
        student = serializer.save()
        Activity.objects.create(
            description=f"New student registered: {student.name}",
            activity_type="student"
        )

    def perform_update(self, serializer):
        student = serializer.save()
        Activity.objects.create(
            description=f"Student information updated: {student.name}",
            activity_type="student"
        )

    def perform_destroy(self, instance):
        Activity.objects.create(
            description=f"Student removed: {instance.name}",
            activity_type="student"
        )
        instance.delete()

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer

    def get_queryset(self):
        queryset = Attendance.objects.all()
        date = self.request.query_params.get('date', None)
        if date:
            queryset = queryset.filter(date=date)
        return queryset

    def create(self, request, *args, **kwargs):
        attendance_data = request.data
        date = attendance_data.get('date')
        attendance_records = attendance_data.get('attendance', [])

        created_records = []
        for record in attendance_records:
            student_id = record.get('student_id')
            present = record.get('present', False)

            attendance, created = Attendance.objects.update_or_create(
                student_id=student_id,
                date=date,
                defaults={'present': present}
            )
            created_records.append(attendance)

            # Create activity record
            student = Student.objects.get(id=student_id)
            status = "present" if present else "absent"
            Activity.objects.create(
                description=f"Attendance marked for {student.name}: {status}",
                activity_type="attendance"
            )

        serializer = self.get_serializer(created_records, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class GradeViewSet(viewsets.ModelViewSet):
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer

    def perform_create(self, serializer):
        grade = serializer.save()
        Activity.objects.create(
            description=f"Grade added for {grade.student.name} in {grade.subject}: {grade.grade}",
            activity_type="grade"
        )

    def perform_update(self, serializer):
        grade = serializer.save()
        Activity.objects.create(
            description=f"Grade updated for {grade.student.name} in {grade.subject}: {grade.grade}",
            activity_type="grade"
        )

class ActivityViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Activity.objects.all().order_by('-created_at')[:10]  # Get last 10 activities
    serializer_class = ActivitySerializer 