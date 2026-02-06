"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Factory as FactoryIcon, Loader2 } from "lucide-react";

type Factory = {
  id: string;
  name: string;
  location: string;
  address: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
};

export default function EditFactoryPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState("");
  const [fetchError, setFetchError] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [address, setAddress] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  // Fetch existing factory
  useEffect(() => {
    async function fetchFactory() {
      try {
        const response = await fetch(`/api/factories/${params.id}`);
        const data = await response.json();

        if (!response.ok) {
          setFetchError(data.error || "Failed to load factory");
          return;
        }

        if (data.success) {
          const factory: Factory = data.data;
          setName(factory.name);
          setLocation(factory.location);
          setAddress(factory.address || "");
          setContactName(factory.contactName || "");
          setContactEmail(factory.contactEmail || "");
          setContactPhone(factory.contactPhone || "");
        }
      } catch (err) {
        setFetchError("Failed to load factory");
      } finally {
        setIsFetching(false);
      }
    }

    if (params.id) {
      fetchFactory();
    }
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validation
    if (!name.trim()) {
      setError("Factory name is required");
      setIsLoading(false);
      return;
    }
    if (!location.trim()) {
      setError("Location is required");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/factories/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          location: location.trim(),
          address: address.trim() || null,
          contactName: contactName.trim() || null,
          contactEmail: contactEmail.trim() || null,
          contactPhone: contactPhone.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update factory");
        return;
      }

      // Redirect to factory detail on success
      router.push(`/factories/${params.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="text-zinc-400 hover:text-zinc-100">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex flex-col items-center justify-center h-64 text-zinc-400">
          <FactoryIcon className="h-12 w-12 mb-4 text-zinc-500" />
          <p className="text-lg font-medium">{fetchError}</p>
          <Link href="/factories" className="mt-4">
            <Button>View All Factories</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/factories/${params.id}`}>
          <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-100">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Factory
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Edit Factory</h1>
          <p className="text-sm text-zinc-400">Update factory information</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="rounded-md bg-red-900/50 border border-red-700 p-4 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Basic Information */}
            <Card className="bg-zinc-800 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Basic Information</CardTitle>
                <CardDescription className="text-zinc-400">
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
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    className="w-full rounded-lg border border-zinc-600 bg-zinc-800 text-zinc-100 placeholder-zinc-500 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g., Shenzhen Manufacturing Co."
                  />
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
                    type="text"
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    disabled={isLoading}
                    className="w-full rounded-lg border border-zinc-600 bg-zinc-800 text-zinc-100 placeholder-zinc-500 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g., Guangzhou, China"
                  />
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
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={isLoading}
                    rows={3}
                    className="w-full rounded-lg border border-zinc-600 bg-zinc-800 text-zinc-100 placeholder-zinc-500 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Street address, building number, etc."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="bg-zinc-800 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Contact Information</CardTitle>
                <CardDescription className="text-zinc-400">
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
                    type="text"
                    id="contactName"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    disabled={isLoading}
                    className="w-full rounded-lg border border-zinc-600 bg-zinc-800 text-zinc-100 placeholder-zinc-500 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g., Zhang Wei"
                  />
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
                    type="email"
                    id="contactEmail"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    disabled={isLoading}
                    className="w-full rounded-lg border border-zinc-600 bg-zinc-800 text-zinc-100 placeholder-zinc-500 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="contact@factory.com"
                  />
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
                    type="tel"
                    id="contactPhone"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    disabled={isLoading}
                    className="w-full rounded-lg border border-zinc-600 bg-zinc-800 text-zinc-100 placeholder-zinc-500 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="+86 138 0000 0000"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Submit Card */}
            <Card className="bg-zinc-800 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Save Changes?</CardTitle>
                <CardDescription className="text-zinc-400">
                  Review the information and submit
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>

                <Link href={`/factories/${params.id}`}>
                  <button
                    type="button"
                    disabled={isLoading}
                    className="w-full rounded-lg border border-zinc-600 bg-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-300 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </Link>
              </CardContent>
            </Card>

            {/* Help Card */}
            <Card className="bg-zinc-800 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-base text-white">Need help?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-zinc-400">
                <ul className="space-y-2">
                  <li>• Factory name and location are required</li>
                  <li>• Contact info is optional but recommended</li>
                  <li>• Changes will be saved immediately</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
