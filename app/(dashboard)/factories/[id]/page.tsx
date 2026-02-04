"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Factory as FactoryIcon,
  MapPin,
  User,
  Mail,
  Phone,
  Edit,
  Package,
  Calendar,
  Loader2,
  Trash2,
} from "lucide-react";

type OrderStage = {
  id: string;
  progress: number;
  status: string;
};

type Order = {
  id: string;
  orderNumber: string;
  productName: string;
  quantity: number;
  unit: string;
  status: string;
  priority: string;
  expectedDate: string;
  overallProgress: number;
  stages: OrderStage[];
};

type Factory = {
  id: string;
  name: string;
  location: string;
  address: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  orders: Order[];
  createdAt: string;
  updatedAt: string;
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  DELAYED: "bg-orange-100 text-orange-800",
  DISRUPTED: "bg-red-100 text-red-800",
  COMPLETED: "bg-green-100 text-green-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-zinc-700 text-zinc-200",
  CANCELLED: "bg-zinc-700 text-zinc-400",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-zinc-700 text-zinc-300",
  NORMAL: "bg-blue-100 text-blue-800",
  HIGH: "bg-orange-100 text-orange-800",
  URGENT: "bg-red-100 text-red-800",
};

export default function FactoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [factory, setFactory] = useState<Factory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFactory() {
      try {
        const response = await fetch(`/api/factories/${params.id}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Failed to load factory");
          return;
        }

        if (data.success) {
          setFactory(data.data);
        }
      } catch (err) {
        setError("Failed to load factory");
      } finally {
        setIsLoading(false);
      }
    }

    if (params.id) {
      fetchFactory();
    }
  }, [params.id]);

  const handleDeleteClick = () => {
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!factory) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/factories/${factory.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setDeleteError(data.error || "Failed to delete factory");
        setIsDeleting(false);
        return;
      }

      // Success - redirect to factories list
      router.push("/factories");
    } catch (err) {
      setDeleteError("Failed to delete factory");
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDeleteError(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-600 dark:text-zinc-400" />
      </div>
    );
  }

  if (error || !factory) {
    return (
      <div className="space-y-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:text-zinc-100"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Card className="bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
          <CardContent className="flex flex-col items-center justify-center h-64 space-y-4">
            <FactoryIcon className="h-12 w-12 text-gray-500 dark:text-zinc-500" />
            <p className="text-gray-600 dark:text-zinc-400">{error || "Factory not found"}</p>
            <Link href="/factories">
              <Button variant="outline" className="border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-zinc-300">
                View All Factories
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:text-zinc-100"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{factory.name}</h1>
            <p className="text-gray-600 dark:text-zinc-400 flex items-center mt-1">
              <MapPin className="h-4 w-4 mr-1" />
              {factory.location}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleDeleteClick}
            className="border-red-600 text-red-600 hover:bg-red-600 hover:text-gray-900 dark:text-white"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <Link href={`/factories/${factory.id}/edit`}>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Edit className="mr-2 h-4 w-4" />
              Edit Factory
            </Button>
          </Link>
        </div>
      </div>

      {/* Factory Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Factory Information */}
        <Card className="bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Factory Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-zinc-400">
                  Factory Name
                </label>
                <p className="text-gray-900 dark:text-white mt-1">{factory.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-zinc-400">
                  Location
                </label>
                <p className="text-gray-900 dark:text-white mt-1">{factory.location}</p>
              </div>
            </div>

            {factory.address && (
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-zinc-400">
                  Address
                </label>
                <p className="text-gray-900 dark:text-white mt-1">{factory.address}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
          <CardHeader>
            <CardTitle className="text-gray-900 dark:text-white">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {factory.contactName && (
              <div className="flex items-start space-x-3">
                <User className="h-5 w-5 text-gray-600 dark:text-zinc-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-zinc-400">Contact Name</p>
                  <p className="text-gray-900 dark:text-white">{factory.contactName}</p>
                </div>
              </div>
            )}

            {factory.contactEmail && (
              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-gray-600 dark:text-zinc-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-zinc-400">Email</p>
                  <a
                    href={`mailto:${factory.contactEmail}`}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    {factory.contactEmail}
                  </a>
                </div>
              </div>
            )}

            {factory.contactPhone && (
              <div className="flex items-start space-x-3">
                <Phone className="h-5 w-5 text-gray-600 dark:text-zinc-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-zinc-400">Phone</p>
                  <a
                    href={`tel:${factory.contactPhone}`}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    {factory.contactPhone}
                  </a>
                </div>
              </div>
            )}

            {!factory.contactName &&
              !factory.contactEmail &&
              !factory.contactPhone && (
                <p className="text-gray-500 dark:text-zinc-500 text-sm">No contact information available</p>
              )}
          </CardContent>
        </Card>
      </div>

      {/* Orders from this Factory */}
      <Card className="bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-gray-900 dark:text-white">Orders</CardTitle>
              <CardDescription className="text-gray-600 dark:text-zinc-400">
                All orders from this factory
              </CardDescription>
            </div>
            <Badge variant="secondary" className="bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300">
              {factory.orders.length} {factory.orders.length === 1 ? "Order" : "Orders"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {factory.orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Package className="h-12 w-12 text-gray-400 dark:text-zinc-600" />
              <p className="text-gray-500 dark:text-zinc-500">No orders from this factory yet</p>
              <Link href="/orders/new">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Create First Order
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-zinc-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-zinc-400">
                      Order #
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-zinc-400">
                      Product
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-zinc-400">
                      Quantity
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-zinc-400">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-zinc-400">
                      Priority
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-zinc-400">
                      Progress
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-zinc-400">
                      Due Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {factory.orders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => router.push(`/orders/${order.id}`)}
                      className="border-b border-gray-200 dark:border-zinc-700/50 hover:bg-gray-100 dark:bg-zinc-700/30 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 text-gray-900 dark:text-white font-medium">
                        {order.orderNumber}
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-zinc-300">
                        {order.productName}
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-zinc-300">
                        {order.quantity} {order.unit}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant="secondary"
                          className={statusColors[order.status] || ""}
                        >
                          {order.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant="secondary"
                          className={priorityColors[order.priority] || ""}
                        >
                          {order.priority}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-100 dark:bg-zinc-700 rounded-full h-2 max-w-[100px]">
                            <div
                              className={`h-2 rounded-full ${
                                order.overallProgress === 100
                                  ? "bg-green-500"
                                  : order.overallProgress > 0
                                  ? "bg-blue-500"
                                  : "bg-zinc-600"
                              }`}
                              style={{ width: `${order.overallProgress}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 dark:text-zinc-400 min-w-[40px]">
                            {order.overallProgress}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-zinc-300">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1 text-gray-500 dark:text-zinc-500" />
                          {formatDate(order.expectedDate)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metadata */}
      <div className="text-sm text-gray-500 dark:text-zinc-500">
        Created {formatDateTime(factory.createdAt)} • Last updated{" "}
        {formatDateTime(factory.updatedAt)}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Delete Factory</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-zinc-400">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-900 dark:text-white">{factory.name}</span>?
              This action cannot be undone.
              {factory.orders.length > 0 && (
                <span className="block mt-2 text-red-400">
                  This factory has {factory.orders.length} order
                  {factory.orders.length === 1 ? "" : "s"}.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="rounded-lg bg-red-900/20 border border-red-800 p-3">
              <p className="text-sm text-red-400">{deleteError}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDeleteCancel}
              disabled={isDeleting}
              className="border-gray-300 dark:border-zinc-600 text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:bg-zinc-700"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Factory
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
