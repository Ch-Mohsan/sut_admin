from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from .models import Student, Attendance, Grade, Activity
from .serializers import StudentSerializer, AttendanceSerializer, GradeSerializer, ActivitySerializer
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework import serializers
from django.contrib.auth import authenticate, login, logout
from rest_framework.permissions import AllowAny
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect
from django.utils.decorators import method_decorator
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken

# CSRF Token view
@method_decorator(ensure_csrf_cookie, name='dispatch')
class GetCSRFToken(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        return Response({'message': 'CSRF cookie set'})

# User registration serializer
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    class Meta:
        model = User
        fields = ('username', 'password', 'email')
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user

# User registration API view
@method_decorator(ensure_csrf_cookie, name='dispatch')
class RegisterView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'message': 'User created successfully',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email
                },
                'access': str(refresh.access_token),
                'refresh': str(refresh)
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Login view
@method_decorator(csrf_protect, name='dispatch')
class LoginView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response(
                {'error': 'Please provide both username and password'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = authenticate(username=username, password=password)
        
        if user is not None:
            login(request, user)
            refresh = RefreshToken.for_user(user)
            return Response({
                'message': 'Login successful',
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email
                },
                'access': str(refresh.access_token),
                'refresh': str(refresh)
            })
        else:
            return Response(
                {'error': 'Invalid username or password'},
                status=status.HTTP_401_UNAUTHORIZED
            )

# Logout view
class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response({'message': 'Logout successful'})

# Check authentication status
class CheckAuthView(APIView):
    def get(self, request):
        if request.user.is_authenticated:
            return Response({
                'authenticated': True,
                'user': {
                    'id': request.user.id,
                    'username': request.user.username,
                    'email': request.user.email
                }
            })
        return Response({'authenticated': False}, status=status.HTTP_401_UNAUTHORIZED)

# Create your views here.

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]

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

    @action(detail=True, methods=['get'])
    def attendance(self, request, pk=None):
        student = self.get_object()
        attendance = Attendance.objects.filter(student=student)
        serializer = AttendanceSerializer(attendance, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def grades(self, request, pk=None):
        student = self.get_object()
        grades = Grade.objects.filter(student=student)
        serializer = GradeSerializer(grades, many=True)
        return Response(serializer.data)

class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all()
    serializer_class = AttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Attendance.objects.all().order_by('date', 'student__name')
        date = self.request.query_params.get('date', None)
        student_id = self.request.query_params.get('student_id', None)

        if date:
            queryset = queryset.filter(date=date)
        if student_id:
            queryset = queryset.filter(student_id=student_id)

        return queryset

    def create(self, request, *args, **kwargs):
        attendance_data = request.data
        date = attendance_data.get('date')
        attendance_records = attendance_data.get('attendance', [])

        created_records = []
        for record in attendance_records:
            student_id = record.get('student_id')
            is_present = record.get('is_present', False)

            attendance, created = Attendance.objects.update_or_create(
                student_id=student_id,
                date=date,
                defaults={'is_present': is_present}
            )
            created_records.append(attendance)

            # Create activity record
            student = Student.objects.get(id=student_id)
            attendance_status = "present" if is_present else "absent"
            Activity.objects.create(
                description=f"Attendance marked for {student.name}: {attendance_status}",
                activity_type="attendance"
            )

        serializer = self.get_serializer(created_records, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class GradeViewSet(viewsets.ModelViewSet):
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Grade.objects.all().order_by('student__name', 'subject', '-created_at')
        student_id = self.request.query_params.get('student_id', None)
        subject = self.request.query_params.get('subject', None)
        
        if student_id is not None:
            queryset = queryset.filter(student_id=student_id)
        if subject is not None:
            queryset = queryset.filter(subject=subject)
            
        return queryset

    def create(self, request, *args, **kwargs):
        student_id = request.data.get('student_id')
        subject = request.data.get('subject')
        
        # Check if grade already exists for this student and subject
        existing_grade = Grade.objects.filter(
            student_id=student_id,
            subject=subject
        ).first()
        
        if existing_grade:
            return Response({
                'error': 'Grade already exists for this student and subject',
                'existing_grade': {
                    'id': existing_grade.id,
                    'marks': existing_grade.marks,
                    'grade': existing_grade.grade,
                    'created_at': existing_grade.created_at
                }
            }, status=status.HTTP_400_BAD_REQUEST)
            
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

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

    def perform_destroy(self, instance):
        # Create activity record before deleting
        Activity.objects.create(
            description=f"Grade deleted for {instance.student.name} in {instance.subject}",
            activity_type="grade"
        )
        instance.delete()

class ActivityViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Activity.objects.all().order_by('-created_at')[:10]  # Get last 10 activities
    serializer_class = ActivitySerializer
