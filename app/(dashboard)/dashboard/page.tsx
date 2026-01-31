import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
          Dashboard
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-1">
          Welcome back, {session.user.name || session.user.email}
        </p>
      </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader>
              <CardDescription>Total Orders</CardDescription>
              <CardTitle className="text-3xl">0</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-500">No orders yet</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Active Orders</CardDescription>
              <CardTitle className="text-3xl">0</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-500">In progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Factories</CardDescription>
              <CardTitle className="text-3xl">0</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-500">Connected</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription>Delayed Orders</CardDescription>
              <CardTitle className="text-3xl">0</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-500">Needs attention</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 p-6 bg-white dark:bg-zinc-900 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Session Info</h2>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-zinc-500">User ID</dt>
              <dd className="font-mono">{session.user.id}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Email</dt>
              <dd>{session.user.email}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Role</dt>
              <dd>{session.user.role}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Organization</dt>
              <dd>{session.user.organizationName}</dd>
            </div>
          </dl>
      </div>
    </>
  );
}
