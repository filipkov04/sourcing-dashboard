import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProductForm } from "./product-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NewProductPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/products"
        className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Products
      </Link>

      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Add New Product</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
          Create a new product in your catalog
        </p>
      </div>

      {/* Form */}
      <ProductForm />
    </div>
  );
}
