"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// Validation schema (matches API schema)
const factorySchema = z.object({
  name: z.string().min(1, "Factory name is required").max(100, "Name too long"),
  location: z.string().min(1, "Location is required").max(100, "Location too long"),
  address: z.string().max(500, "Address too long").optional(),
  contactName: z.string().max(100, "Name too long").optional(),
  contactEmail: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
  contactPhone: z.string().max(50, "Phone too long").optional(),
});

type FactoryFormData = z.infer<typeof factorySchema>;

export function FactoryForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FactoryFormData>({
    resolver: zodResolver(factorySchema),
  });

  const onSubmit = async (data: FactoryFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/factories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create factory");
      }

      // Success - redirect to factories list
      router.push("/factories");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Essential details about the factory
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Factory Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-zinc-300 mb-1"
                >
                  Factory Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("name")}
                  type="text"
                  id="name"
                  className="w-full rounded-lg border border-zinc-600 bg-zinc-800 text-zinc-100 placeholder-zinc-500 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g., Shenzhen Manufacturing Co."
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* Location */}
              <div>
                <label
                  htmlFor="location"
                  className="block text-sm font-medium text-zinc-300 mb-1"
                >
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("location")}
                  type="text"
                  id="location"
                  className="w-full rounded-lg border border-zinc-600 bg-zinc-800 text-zinc-100 placeholder-zinc-500 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g., Guangzhou, China"
                />
                {errors.location && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.location.message}
                  </p>
                )}
              </div>

              {/* Address */}
              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-zinc-300 mb-1"
                >
                  Full Address
                </label>
                <textarea
                  {...register("address")}
                  id="address"
                  rows={3}
                  className="w-full rounded-lg border border-zinc-600 bg-zinc-800 text-zinc-100 placeholder-zinc-500 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Street address, building number, etc."
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.address.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                Primary contact at the factory (optional)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Contact Name */}
              <div>
                <label
                  htmlFor="contactName"
                  className="block text-sm font-medium text-zinc-300 mb-1"
                >
                  Contact Name
                </label>
                <input
                  {...register("contactName")}
                  type="text"
                  id="contactName"
                  className="w-full rounded-lg border border-zinc-600 bg-zinc-800 text-zinc-100 placeholder-zinc-500 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g., Zhang Wei"
                />
                {errors.contactName && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.contactName.message}
                  </p>
                )}
              </div>

              {/* Contact Email */}
              <div>
                <label
                  htmlFor="contactEmail"
                  className="block text-sm font-medium text-zinc-300 mb-1"
                >
                  Email
                </label>
                <input
                  {...register("contactEmail")}
                  type="email"
                  id="contactEmail"
                  className="w-full rounded-lg border border-zinc-600 bg-zinc-800 text-zinc-100 placeholder-zinc-500 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="contact@factory.com"
                />
                {errors.contactEmail && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.contactEmail.message}
                  </p>
                )}
              </div>

              {/* Contact Phone */}
              <div>
                <label
                  htmlFor="contactPhone"
                  className="block text-sm font-medium text-zinc-300 mb-1"
                >
                  Phone
                </label>
                <input
                  {...register("contactPhone")}
                  type="tel"
                  id="contactPhone"
                  className="w-full rounded-lg border border-zinc-600 bg-zinc-800 text-zinc-100 placeholder-zinc-500 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="+86 138 0000 0000"
                />
                {errors.contactPhone && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.contactPhone.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Submit Card */}
          <Card>
            <CardHeader>
              <CardTitle>Ready to create?</CardTitle>
              <CardDescription>
                Review the information and submit
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-900/50 border border-red-700 p-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Factory"
                )}
              </button>

              <button
                type="button"
                onClick={() => router.push("/factories")}
                disabled={isSubmitting}
                className="w-full rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </CardContent>
          </Card>

          {/* Help Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Need help?</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-zinc-400">
              <ul className="space-y-2">
                <li>• Factory name and location are required</li>
                <li>• Contact info is optional but recommended</li>
                <li>• You can edit details later</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
