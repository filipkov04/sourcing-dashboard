"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Users,
  UserPlus,
  Trash2,
  Crown,
  Shield,
  User,
  Eye,
  Mail,
  Clock,
  Copy,
  Check,
  Loader2,
  XCircle,
} from "lucide-react";
import { useSession, signIn } from "next-auth/react";

interface TeamMember {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
  createdAt: string;
  updatedAt: string;
}

interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  token: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  invitedBy: {
    name: string | null;
    email: string;
  };
}

export default function TeamPage() {
  const { data: session } = useSession();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [userToRemove, setUserToRemove] = useState<TeamMember | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Invite dialog state
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("MEMBER");
  const [inviteError, setInviteError] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Revoke state
  const [invitationToRevoke, setInvitationToRevoke] = useState<PendingInvitation | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  const currentUserRole = session?.user?.role;
  const isAdminOrOwner = currentUserRole === "ADMIN" || currentUserRole === "OWNER";

  // Dev role switcher
  const [switchingRole, setSwitchingRole] = useState(false);

  async function handleDevRoleSwitch(newRole: string) {
    if (newRole === currentUserRole) return;
    setSwitchingRole(true);
    try {
      const response = await fetch("/api/dev/set-role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const result = await response.json();
      if (result.success) {
        // Force full page reload so session picks up new role
        window.location.reload();
      }
    } catch (err) {
      console.error("Failed to switch role:", err);
    } finally {
      setSwitchingRole(false);
    }
  }

  useEffect(() => {
    fetchTeamMembers();
    if (isAdminOrOwner) {
      fetchPendingInvitations();
    }
  }, [isAdminOrOwner]);

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

  async function fetchPendingInvitations() {
    try {
      const response = await fetch("/api/invitations");
      const result = await response.json();

      if (result.success) {
        setInvitations(result.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch invitations:", error);
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

  async function handleSendInvitation(e: React.FormEvent) {
    e.preventDefault();
    setInviteError("");
    setIsInviting(true);

    try {
      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setInviteError(result.error || "Failed to send invitation.");
        return;
      }

      const inviteLink = `${window.location.origin}/invite/${result.data.token}`;
      setInviteSuccess(inviteLink);
      fetchPendingInvitations();
    } catch {
      setInviteError("Something went wrong. Please try again.");
    } finally {
      setIsInviting(false);
    }
  }

  function handleCloseInviteDialog() {
    setInviteDialogOpen(false);
    setInviteEmail("");
    setInviteRole("MEMBER");
    setInviteError("");
    setInviteSuccess(null);
    setCopied(false);
  }

  async function handleCopyLink() {
    if (!inviteSuccess) return;
    try {
      await navigator.clipboard.writeText(inviteSuccess);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text
    }
  }

  async function handleRevokeInvitation() {
    if (!invitationToRevoke) return;

    setIsRevoking(true);
    try {
      const response = await fetch(`/api/invitations/${invitationToRevoke.token}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        setInvitations((prev) => prev.filter((inv) => inv.id !== invitationToRevoke.id));
        setInvitationToRevoke(null);
      } else {
        alert(result.error || "Failed to revoke invitation");
      }
    } catch (error) {
      console.error("Failed to revoke invitation:", error);
      alert("Failed to revoke invitation");
    } finally {
      setIsRevoking(false);
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
        <Card className="bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800">
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
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Team Members</h1>
          <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
            Manage your organization&apos;s team members and their roles
          </p>
        </div>
        <Button
          onClick={() => setInviteDialogOpen(true)}
          disabled={!isAdminOrOwner}
          className="bg-gray-900 hover:bg-gray-800 text-white dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Member
        </Button>
      </div>

      {/* DEV: Role Switcher */}
      {process.env.NODE_ENV !== "production" && (
        <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Dev: Switch My Role
              </span>
              {(["OWNER", "ADMIN", "MEMBER", "VIEWER"] as const).map((role) => (
                <Button
                  key={role}
                  size="sm"
                  variant={currentUserRole === role ? "default" : "outline"}
                  disabled={switchingRole}
                  onClick={() => handleDevRoleSwitch(role)}
                  className={`h-7 px-3 text-xs ${
                    currentUserRole === role
                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                      : "border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                  }`}
                >
                  {getRoleIcon(role)}
                  <span className="ml-1.5">{role}</span>
                </Button>
              ))}
              {switchingRole && <Loader2 className="h-4 w-4 animate-spin text-amber-600" />}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800">
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

        <Card className="bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800">
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

        <Card className="bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800">
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

        <Card className="bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800">
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
      <Card className="bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">All Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 dark:border-zinc-800">
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
                      className="border-b border-gray-100 dark:border-zinc-800 last:border-0"
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
                            <SelectTrigger className="w-[140px] bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800">
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

      {/* Pending Invitations */}
      {isAdminOrOwner && invitations.filter((inv) => inv.status === "PENDING").length > 0 && (
        <Card className="bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
              <Mail className="h-5 w-5 text-orange-500" />
              Pending Invitations ({invitations.filter((inv) => inv.status === "PENDING").length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-zinc-800">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-zinc-400">
                      Email
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-zinc-400">
                      Role
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-zinc-400">
                      Invited
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-zinc-400">
                      Expires
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-zinc-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.filter((inv) => inv.status === "PENDING").map((invitation) => {
                    const invitedDate = new Date(invitation.createdAt).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric" }
                    );
                    const expiresDate = new Date(invitation.expiresAt).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric" }
                    );
                    const isExpired = new Date(invitation.expiresAt) < new Date();

                    return (
                      <tr
                        key={invitation.id}
                        className="border-b border-gray-100 dark:border-zinc-800 last:border-0"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-zinc-700 flex items-center justify-center">
                              <Mail className="h-4 w-4 text-gray-500 dark:text-zinc-400" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {invitation.email}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-zinc-500">
                                Invited by {invitation.invitedBy.name || invitation.invitedBy.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant="outline" className={getRoleBadgeColor(invitation.role)}>
                            <span className="flex items-center gap-1.5">
                              {getRoleIcon(invitation.role)}
                              {invitation.role}
                            </span>
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600 dark:text-zinc-400">
                          {invitedDate}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`text-sm flex items-center gap-1 ${
                              isExpired
                                ? "text-red-600 dark:text-red-400"
                                : "text-gray-600 dark:text-zinc-400"
                            }`}
                          >
                            <Clock className="h-3 w-3" />
                            {isExpired ? "Expired" : expiresDate}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setInvitationToRevoke(invitation)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invite Member Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={handleCloseInviteDialog}>
        <DialogContent className="bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              Invite Team Member
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-zinc-400">
              Send an invitation link to add a new member to your organization.
            </DialogDescription>
          </DialogHeader>

          {inviteSuccess ? (
            <div className="space-y-4">
              <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4 text-center">
                <Check className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                  Invitation sent successfully!
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-zinc-300">Invitation Link</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={inviteSuccess}
                    className="bg-gray-50 dark:bg-zinc-900 text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="shrink-0 border-gray-100 dark:border-zinc-800"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-zinc-500">
                  Share this link with the invited person. It expires in 7 days.
                </p>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCloseInviteDialog}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
                >
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={handleSendInvitation}>
              <div className="space-y-4 py-2">
                {inviteError && (
                  <div className="rounded-md bg-red-50 dark:bg-red-950 p-3 text-sm text-red-600 dark:text-red-400">
                    {inviteError}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="invite-email" className="text-gray-700 dark:text-zinc-300">
                    Email Address
                  </Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                    disabled={isInviting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-role" className="text-gray-700 dark:text-zinc-300">
                    Role
                  </Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger className="w-full bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Admin - Can manage users, factories, and all orders
                        </div>
                      </SelectItem>
                      <SelectItem value="MEMBER">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Member - Can view and edit orders
                        </div>
                      </SelectItem>
                      <SelectItem value="VIEWER">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Viewer - Read-only access
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseInviteDialog}
                  disabled={isInviting}
                  className="border-gray-100 dark:border-zinc-800 text-gray-900 dark:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isInviting}
                  className="bg-gray-900 hover:bg-gray-800 text-white dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
                >
                  {isInviting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Invitation"
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Remove User Confirmation Dialog */}
      <AlertDialog open={!!userToRemove} onOpenChange={() => setUserToRemove(null)}>
        <AlertDialogContent className="bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800">
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
            <AlertDialogCancel className="bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 text-gray-900 dark:text-white">
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

      {/* Revoke Invitation Confirmation Dialog */}
      <AlertDialog open={!!invitationToRevoke} onOpenChange={() => setInvitationToRevoke(null)}>
        <AlertDialogContent className="bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900 dark:text-white">
              Revoke Invitation
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-zinc-400">
              Are you sure you want to revoke the invitation for{" "}
              <span className="font-medium text-gray-900 dark:text-white">
                {invitationToRevoke?.email}
              </span>
              ? They will no longer be able to use the invitation link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 text-gray-900 dark:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeInvitation}
              disabled={isRevoking}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isRevoking ? "Revoking..." : "Revoke"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
