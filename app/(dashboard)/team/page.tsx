"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserPlus, Trash2, Crown, Shield, User, Eye } from "lucide-react";
import { useSession } from "next-auth/react";

interface TeamMember {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
  createdAt: string;
  updatedAt: string;
}

export default function TeamPage() {
  const { data: session } = useSession();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [userToRemove, setUserToRemove] = useState<TeamMember | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const currentUserRole = session?.user?.role;
  const isAdminOrOwner = currentUserRole === "ADMIN" || currentUserRole === "OWNER";

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  async function fetchTeamMembers() {
    try {
      const response = await fetch("/api/team");
      const result = await response.json();

      if (result.success) {
        setMembers(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch team members:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId: string, newRole: string) {
    try {
      const response = await fetch(`/api/team/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      const result = await response.json();

      if (result.success) {
        // Update local state
        setMembers((prev) =>
          prev.map((member) =>
            member.id === userId ? { ...member, role: newRole as TeamMember["role"] } : member
          )
        );
      } else {
        alert(result.error || "Failed to update role");
      }
    } catch (error) {
      console.error("Failed to update role:", error);
      alert("Failed to update role");
    }
  }

  async function handleRemoveUser() {
    if (!userToRemove) return;

    setIsRemoving(true);
    try {
      const response = await fetch(`/api/team/${userToRemove.id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        // Remove from local state
        setMembers((prev) => prev.filter((member) => member.id !== userToRemove.id));
        setUserToRemove(null);
      } else {
        alert(result.error || "Failed to remove user");
      }
    } catch (error) {
      console.error("Failed to remove user:", error);
      alert("Failed to remove user");
    } finally {
      setIsRemoving(false);
    }
  }

  function getRoleIcon(role: string) {
    switch (role) {
      case "OWNER":
        return <Crown className="h-4 w-4" />;
      case "ADMIN":
        return <Shield className="h-4 w-4" />;
      case "MEMBER":
        return <User className="h-4 w-4" />;
      case "VIEWER":
        return <Eye className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  }

  function getRoleBadgeColor(role: string) {
    switch (role) {
      case "OWNER":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800";
      case "ADMIN":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800";
      case "MEMBER":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800";
      case "VIEWER":
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-700";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-700";
    }
  }

  function getRoleDescription(role: string) {
    switch (role) {
      case "OWNER":
        return "Full access, can manage billing and delete organization";
      case "ADMIN":
        return "Can manage users, factories, and all orders";
      case "MEMBER":
        return "Can view and edit orders";
      case "VIEWER":
        return "Read-only access to orders and factories";
      default:
        return "";
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card className="bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Team Members</h1>
          <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
            Manage your organization's team members and their roles
          </p>
        </div>
        <Button
          disabled={!isAdminOrOwner}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Member
        </Button>
      </div>

      {/* Team Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-zinc-400">Total Members</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{members.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-zinc-400">Owners</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {members.filter((m) => m.role === "OWNER").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-zinc-400">Admins</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {members.filter((m) => m.role === "ADMIN").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-sm text-gray-600 dark:text-zinc-400">Members</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {members.filter((m) => m.role === "MEMBER").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members Table */}
      <Card className="bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">All Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-zinc-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-zinc-400">
                    Member
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-zinc-400">
                    Role
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-zinc-400">
                    Joined
                  </th>
                  {isAdminOrOwner && (
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-zinc-400">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  const isCurrentUser = member.id === session?.user?.id;
                  const joinedDate = new Date(member.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <tr
                      key={member.id}
                      className="border-b border-gray-200 dark:border-zinc-700 last:border-0"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                            {(member.name || member.email).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {member.name || member.email}
                              {isCurrentUser && (
                                <span className="ml-2 text-xs text-gray-500 dark:text-zinc-500">
                                  (You)
                                </span>
                              )}
                            </p>
                            {member.name && (
                              <p className="text-sm text-gray-600 dark:text-zinc-400">
                                {member.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {isAdminOrOwner && !isCurrentUser ? (
                          <Select
                            value={member.role}
                            onValueChange={(value) => handleRoleChange(member.id, value)}
                          >
                            <SelectTrigger className="w-[140px] bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="OWNER">
                                <div className="flex items-center gap-2">
                                  <Crown className="h-4 w-4" />
                                  Owner
                                </div>
                              </SelectItem>
                              <SelectItem value="ADMIN">
                                <div className="flex items-center gap-2">
                                  <Shield className="h-4 w-4" />
                                  Admin
                                </div>
                              </SelectItem>
                              <SelectItem value="MEMBER">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  Member
                                </div>
                              </SelectItem>
                              <SelectItem value="VIEWER">
                                <div className="flex items-center gap-2">
                                  <Eye className="h-4 w-4" />
                                  Viewer
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="outline" className={getRoleBadgeColor(member.role)}>
                            <span className="flex items-center gap-1.5">
                              {getRoleIcon(member.role)}
                              {member.role}
                            </span>
                          </Badge>
                        )}
                        <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">
                          {getRoleDescription(member.role)}
                        </p>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600 dark:text-zinc-400">
                        {joinedDate}
                      </td>
                      {isAdminOrOwner && (
                        <td className="py-4 px-4">
                          {!isCurrentUser && (
                            <div className="flex justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setUserToRemove(member)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Remove User Confirmation Dialog */}
      <AlertDialog open={!!userToRemove} onOpenChange={() => setUserToRemove(null)}>
        <AlertDialogContent className="bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-white">
              Remove Team Member
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-zinc-400">
              Are you sure you want to remove{" "}
              <span className="font-medium text-gray-900 dark:text-white">
                {userToRemove?.name || userToRemove?.email}
              </span>{" "}
              from your organization? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-700 text-gray-900 dark:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveUser}
              disabled={isRemoving}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isRemoving ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
