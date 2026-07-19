"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageContainer } from "@/components/ui/page-container";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProtectedRoute } from "@/components/providers/protected-route";
import { profileService } from "@/services/profile";
import {
  User,
  Mail,
  Shield,
  Key,
  Calendar,
  Lock,
  Phone,
  Bookmark,
  Building,
  Upload,
} from "lucide-react";

export default function ProfilePage() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["user-profile-data"],
    queryFn: () => profileService.getProfile(),
  });

  // Edit details state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);

  // Change password state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [notif, setNotif] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setPhoneNumber(profile.phone_number || "");
      setDesignation(profile.designation || "");
      setDepartment(profile.department || "");
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: (formData: FormData) => profileService.updateProfile(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile-data"] });
      setNotif({ type: "success", msg: "Profile updated successfully!" });
    },
    onError: (err: any) => {
      setNotif({ type: "error", msg: err.response?.data?.detail || "Failed to update profile." });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: () =>
      profileService.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      }),
    onSuccess: () => {
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setNotif({ type: "success", msg: "Password updated successfully!" });
    },
    onError: (err: any) => {
      setNotif({ type: "error", msg: err.response?.data?.detail || "Failed to change password." });
    },
  });

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("first_name", firstName);
    fd.append("last_name", lastName);
    fd.append("phone_number", phoneNumber);
    fd.append("designation", designation);
    fd.append("department", department);
    if (profilePicFile) {
      fd.append("profile_picture", profilePicFile);
    }
    updateProfileMutation.mutate(fd);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setNotif({ type: "error", msg: "New passwords do not match." });
      return;
    }
    changePasswordMutation.mutate();
  };

  if (isLoading || !profile) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <PageContainer title="My Profile" subtitle="Loading profile data...">
            <div className="h-96 w-full bg-card rounded-xl animate-pulse" />
          </PageContainer>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <PageContainer
          title="User Profile Management"
          subtitle="View account information, edit contact details, or update security credentials."
        >
          <Breadcrumb items={[{ label: "Profile", active: true }]} />

          {notif && (
            <div
              className={`p-4 rounded-xl text-xs font-bold mb-6 border ${
                notif.type === "success"
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-600 border-rose-500/20"
              }`}
            >
              {notif.msg}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Account Overview card */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-xs h-fit space-y-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="h-24 w-24 rounded-full bg-accent/40 overflow-hidden flex items-center justify-center border border-border">
                  {profile.profile_picture ? (
                    <img
                      src={profile.profile_picture}
                      alt="Profile Avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-foreground text-base">
                    {profile.first_name || profile.last_name
                      ? `${profile.first_name} ${profile.last_name}`
                      : profile.username}
                  </h3>
                  <span className="inline-flex px-2 py-0.5 rounded-full text-2xs font-extrabold uppercase bg-primary/10 text-primary mt-1">
                    {profile.role}
                  </span>
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="font-semibold text-muted-foreground">Employee ID:</span>
                  <span className="font-bold text-foreground">{profile.employee_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-muted-foreground">Username:</span>
                  <span className="font-bold text-foreground">{profile.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-muted-foreground">Email:</span>
                  <span className="font-bold text-foreground">{profile.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-muted-foreground">Last Login:</span>
                  <span className="font-semibold text-muted-foreground">
                    {profile.last_login ? new Date(profile.last_login).toLocaleString() : "First login Session"}
                  </span>
                </div>
              </div>
            </div>

            {/* Middle: Edit Profile Details */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card border border-border rounded-xl p-6 shadow-xs">
                <h3 className="font-extrabold text-foreground text-base border-b border-border pb-3 mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Edit Profile Details
                </h3>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground">First Name</label>
                      <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground">Last Name</label>
                      <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground">Phone Number</label>
                      <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground">Profile Picture</label>
                      <Input
                        type="file"
                        onChange={(e) => setProfilePicFile(e.target.files?.[0] || null)}
                        accept="image/*"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground">Designation</label>
                      <Input value={designation} onChange={(e) => setDesignation(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground">Department</label>
                      <Input value={department} onChange={(e) => setDepartment(e.target.value)} />
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button type="submit" disabled={updateProfileMutation.isPending} className="w-full sm:w-auto">
                      Save Profile Updates
                    </Button>
                  </div>
                </form>
              </div>

              {/* Security: Change Password */}
              <div className="bg-card border border-border rounded-xl p-6 shadow-xs">
                <h3 className="font-extrabold text-foreground text-base border-b border-border pb-3 mb-4 flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  Security Credentials
                </h3>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground">Current Password</label>
                    <Input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground">New Password</label>
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-muted-foreground">Confirm New Password</label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button type="submit" disabled={changePasswordMutation.isPending} className="w-full sm:w-auto">
                      Update Password
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </PageContainer>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
