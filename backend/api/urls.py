from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'students', views.StudentViewSet)
router.register(r'attendance', views.AttendanceViewSet)
router.register(r'grades', views.GradeViewSet)
router.register(r'activities', views.ActivityViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('check-auth/', views.CheckAuthView.as_view(), name='check-auth'),
    path('csrf-token/', views.GetCSRFToken.as_view(), name='csrf-token'),
] 