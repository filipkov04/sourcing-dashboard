"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Send } from "lucide-react";

const factoryRequestSchema = z.object({
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

type FactoryRequestData = z.infer<typeof factoryRequestSchema>;

export default function FactoryRequestPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FactoryRequestData>({
    resolver: zodResolver(factoryRequestSchema),
  });

  const onSubmit = async (data: FactoryRequestData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "FACTORY_REQUEST",
          data,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit request");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto mt-20 text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
          <Send className="h-8 w-8 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Request Submitted</h1>
        <p className="text-gray-500 dark:text-zinc-400">
          Your factory request has been submitted for admin review. You&apos;ll be notified once it&apos;s been processed.
        </p>
        <div className="flex justify-center gap-3 pt-4">
          <Link href="/factories">
            <Button variant="outline">Back to Factories</Button>
          </Link>
          <Button onClick={() => { setSubmitted(false); reset(); }}>
            Submit Another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/factories">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Request New Factory</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Submit a factory request for admin approval
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>Essential details about the factory</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1"
                  >
                    Factory Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("name")}
                    type="text"
                    id="name"
                    className="w-full rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g., Shenzhen Manufacturing Co."
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="location"
                    className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1"
                  >
                    Location <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("location")}
                    type="text"
                    id="location"
                    className="w-full rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g., Guangzhou, China"
                  />
                  {errors.location && (
                    <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="address"
                    className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1"
                  >
                    Full Address
                  </label>
                  <textarea
                    {...register("address")}
                    id="address"
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Street address, building number, etc."
                  />
                  {errors.address && (
                    <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Primary contact at the factory (optional)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label
                    htmlFor="contactName"
                    className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1"
                  >
                    Contact Name
                  </label>
                  <input
                    {...register("contactName")}
                    type="text"
                    id="contactName"
                    className="w-full rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g., Zhang Wei"
                  />
                  {errors.contactName && (
                    <p className="mt-1 text-sm text-red-600">{errors.contactName.message}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="contactEmail"
                    className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1"
                  >
                    Email
                  </label>
                  <input
                    {...register("contactEmail")}
                    type="email"
                    id="contactEmail"
                    className="w-full rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="contact@factory.com"
                  />
                  {errors.contactEmail && (
                    <p className="mt-1 text-sm text-red-600">{errors.contactEmail.message}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="contactPhone"
                    className="block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1"
                  >
                    Phone
                  </label>
                  <input
                    {...register("contactPhone")}
                    type="tel"
                    id="contactPhone"
                    className="w-full rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="+86 138 0000 0000"
                  />
                  {errors.contactPhone && (
                    <p className="mt-1 text-sm text-red-600">{errors.contactPhone.message}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ready to submit?</CardTitle>
                <CardDescription>
                  Your request will be reviewed by an admin
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && (
                  <div className="rounded-lg bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-700 p-3 text-sm text-red-600 dark:text-red-300">
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
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Submit Request
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/factories")}
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-gray-300 dark:border-zinc-600 bg-gray-100 dark:bg-zinc-800 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">About requests</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-500 dark:text-zinc-400">
                <ul className="space-y-2">
                  <li>• Your request will be reviewed by an admin</li>
                  <li>• Factory name and location are required</li>
                  <li>• Contact info is optional but helpful</li>
                  <li>• You&apos;ll be notified of the decision</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
