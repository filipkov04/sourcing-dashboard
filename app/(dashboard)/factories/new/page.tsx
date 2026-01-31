import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { FactoryForm } from "./factory-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NewFactoryPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/factories"
        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Factories
      </Link>

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Add New Factory</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Create a new manufacturing partner or supplier
        </p>
      </div>

      {/* Form */}
      <FactoryForm />
    </div>
  );
}
