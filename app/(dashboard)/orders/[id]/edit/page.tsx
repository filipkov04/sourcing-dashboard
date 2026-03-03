"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Plus, Package, Upload, X, Repeat } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { SortableStageList } from "@/components/sortable-stage-list";
import { useBreadcrumb } from "@/lib/breadcrumb-context";

type Factory = {
  id: string;
  name: string;
  location: string;
};

type Stage = {
  id: string;
  name: string;
  sequence: number;
  progress: number;
  status: string;
};

const defaultStages = [
  "Material Sourcing",
  "Cutting",
  "Sewing",
  "Quality Check",
  "Packaging",
];

export default function EditOrderPage() {
  const params = useParams();
  const router = useRouter();
  const { setDetail } = useBreadcrumb();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState("");
  const [fetchError, setFetchError] = useState("");
  const [factories, setFactories] = useState<Factory[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [prevImagePreview, setPrevImagePreview] = useState<string | null>(null);

  // Form state
  const [orderNumber, setOrderNumber] = useState("");
  const [productName, setProductName] = useState("");
  const [productSKU, setProductSKU] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("pieces");
  const [factoryId, setFactoryId] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [status, setStatus] = useState("PENDING");
  const [notes, setNotes] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [productImage, setProductImage] = useState<string | null>(null);
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Recurrence state
  const [recurrenceEnabled, setRecurrenceEnabled] = useState(false);
  const [recurrenceInterval, setRecurrenceInterval] = useState("60");
  const [recurrenceCustomDays, setRecurrenceCustomDays] = useState("");
  const [recurrenceNextDate, setRecurrenceNextDate] = useState("");

  // Fetch factories
  useEffect(() => {
    async function fetchFactories() {
      try {
        const response = await fetch("/api/factories");
        const data = await response.json();
        if (data.success) {
          setFactories(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch factories:", error);
      }
    }
    fetchFactories();
  }, []);

  // Fetch existing order
  useEffect(() => {
    async function fetchOrder() {
      try {
        const response = await fetch(`/api/orders/${params.id}`);
        const data = await response.json();

        if (!response.ok) {
          setFetchError(data.error || "Failed to load order");
          return;
        }

        if (data.success) {
          const order = data.data;
          setDetail(`${order.orderNumber} — ${order.productName}`);
          setOrderNumber(order.orderNumber);
          setProductName(order.productName);
          setProductSKU(order.productSKU || "");
          setQuantity(order.quantity.toString());
          setUnit(order.unit);
          setFactoryId(order.factoryId);
          setOrderDate(order.orderDate.split("T")[0]);
          setExpectedDate(order.expectedDate.split("T")[0]);
          setPriority(order.priority);
          setStatus(order.status);
          setNotes(order.notes || "");
          setTagsInput(order.tags?.join(", ") || "");
          setProductImage(order.productImage || null);
          setProductImagePreview(order.productImage || null);
          setStages(
            order.stages.map((s: { id: string; name: string; sequence: number; progress: number; status: string }) => ({
              id: s.id,
              name: s.name,
              sequence: s.sequence,
              progress: s.progress,
              status: s.status,
            }))
          );
          // Populate recurrence fields
          setRecurrenceEnabled(order.recurrenceEnabled || false);
          if (order.recurrenceIntervalDays) {
            const days = String(order.recurrenceIntervalDays);
            if (["30", "60", "90", "120"].includes(days)) {
              setRecurrenceInterval(days);
            } else {
              setRecurrenceInterval("custom");
              setRecurrenceCustomDays(days);
            }
          }
          if (order.recurrenceNextDate) {
            setRecurrenceNextDate(order.recurrenceNextDate.split("T")[0]);
          }
        }
      } catch (err) {
        setFetchError("Failed to load order");
      } finally {
        setIsFetching(false);
      }
    }

    if (params.id) {
      fetchOrder();
    }
  }, [params.id, setDetail]);

  const addStage = () => {
    const newSequence = stages.length + 1;
    setStages([
      ...stages,
      {
        id: `new-${Date.now()}`,
        name: "",
        sequence: newSequence,
        progress: 0,
        status: "NOT_STARTED",
      },
    ]);
  };

  const removeStage = (id: string) => {
    const filtered = stages.filter((s) => s.id !== id);
    setStages(
      filtered.map((s, index) => ({
        ...s,
        sequence: index + 1,
      }))
    );
  };

  const updateStageName = (id: string, name: string) => {
    setStages(stages.map((s) => (s.id === id ? { ...s, name } : s)));
  };

  // Cleanup blob URL on unmount to prevent memory leak
  useEffect(() => {
    return () => {
      if (prevImagePreview && prevImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(prevImagePreview);
      }
    };
  }, [prevImagePreview]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Only PNG, JPG, and WEBP images are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be under 5MB");
      return;
    }
    // Revoke previous blob URL before creating new one
    if (productImagePreview && productImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(productImagePreview);
    }
    setProductImageFile(file);
    const newUrl = URL.createObjectURL(file);
    setProductImagePreview(newUrl);
    setPrevImagePreview(newUrl);
  };

  const removeImage = () => {
    setProductImageFile(null);
    setProductImage(null);
    if (productImagePreview && productImagePreview.startsWith("blob:")) {
      URL.revokeObjectURL(productImagePreview);
    }
    setProductImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validation
    if (!orderNumber.trim()) {
      setError("Order number is required");
      setIsLoading(false);
      return;
    }
    if (!productName.trim()) {
      setError("Product name is required");
      setIsLoading(false);
      return;
    }
    if (!quantity || parseInt(quantity) <= 0) {
      setError("Quantity must be greater than 0");
      setIsLoading(false);
      return;
    }
    if (!factoryId) {
      setError("Please select a factory");
      setIsLoading(false);
      return;
    }
    if (!expectedDate) {
      setError("Expected date is required");
      setIsLoading(false);
      return;
    }

    // Filter out empty stages
    const validStages = stages.filter((s) => s.name.trim());

    // Parse tags
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);

    try {
      // Upload new product image if changed
      let productImageUrl: string | null | undefined = undefined;
      if (productImageFile) {
        setIsUploadingImage(true);
        const imageFormData = new FormData();
        imageFormData.append("file", productImageFile);
        const imageRes = await fetch("/api/orders/product-image", {
          method: "POST",
          body: imageFormData,
        });
        const imageData = await imageRes.json();
        setIsUploadingImage(false);
        if (!imageRes.ok) {
          setError(imageData.error || "Failed to upload image");
          return;
        }
        productImageUrl = imageData.data.url;
      } else if (productImage === null && productImagePreview === null) {
        // Image was explicitly removed
        productImageUrl = null;
      }

      const response = await fetch(`/api/orders/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: orderNumber.trim(),
          productName: productName.trim(),
          productSKU: productSKU.trim() || null,
          ...(productImageUrl !== undefined && { productImage: productImageUrl }),
          quantity: parseInt(quantity),
          unit,
          factoryId,
          orderDate,
          expectedDate,
          priority,
          status,
          notes: notes.trim() || null,
          tags,
          stages: validStages.map((s) => ({
            ...(s.id && !s.id.startsWith("new-") ? { id: s.id } : {}),
            name: s.name,
            sequence: s.sequence,
            progress: s.progress,
            status: s.status,
          })),
          recurrenceEnabled,
          recurrenceIntervalDays: recurrenceEnabled
            ? parseInt(recurrenceInterval === "custom" ? recurrenceCustomDays : recurrenceInterval) || null
            : null,
          recurrenceNextDate: recurrenceEnabled && recurrenceNextDate ? recurrenceNextDate : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update order");
        return;
      }

      // Redirect to order detail on success
      router.push(`/orders/${params.id}`);
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-zinc-400">
          <Package className="h-12 w-12 mb-4 text-gray-400 dark:text-zinc-500" />
          <p className="text-lg font-medium">{fetchError}</p>
          <Link href="/orders" className="mt-4">
            <Button>View All Orders</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/orders/${params.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Order</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Update order {orderNumber}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-700 p-4 text-sm text-red-600 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
            <CardDescription>Basic information about the order</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orderNumber">Order Number *</Label>
                <Input
                  id="orderNumber"
                  placeholder="PO-2024-001"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="factory">Factory *</Label>
                <Select
                  value={factoryId}
                  onValueChange={setFactoryId}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a factory" />
                  </SelectTrigger>
                  <SelectContent>
                    {factories.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No factories available
                      </SelectItem>
                    ) : (
                      factories.map((factory) => (
                        <SelectItem key={factory.id} value={factory.id}>
                          {factory.name} - {factory.location}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productName">Product Name *</Label>
                <Input
                  id="productName"
                  placeholder="Summer T-Shirt Collection"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="productSKU">Product SKU</Label>
                <Input
                  id="productSKU"
                  placeholder="TSH-SUM-2024"
                  value={productSKU}
                  onChange={(e) => setProductSKU(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Product Image Upload */}
            <div className="space-y-2">
              <Label>Product Image</Label>
              {productImagePreview ? (
                <div className="relative inline-block">
                  <img
                    src={productImagePreview}
                    alt="Product preview"
                    className="w-24 h-24 rounded-lg object-cover border border-gray-200 dark:border-zinc-700"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label
                  className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-lg cursor-pointer hover:border-[#FF4D15] dark:hover:border-[#FF4D15] transition-colors"
                >
                  <div className="flex flex-col items-center justify-center py-2">
                    <Upload className="h-6 w-6 text-gray-400 dark:text-zinc-500 mb-1" />
                    <p className="text-xs text-gray-500 dark:text-zinc-400">
                      Click to upload (PNG, JPG, WEBP, max 5MB)
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageSelect}
                    disabled={isLoading}
                  />
                </label>
              )}
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  placeholder="1000"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select value={unit} onValueChange={setUnit} disabled={isLoading}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pieces">Pieces</SelectItem>
                    <SelectItem value="meters">Meters</SelectItem>
                    <SelectItem value="kg">Kilograms</SelectItem>
                    <SelectItem value="yards">Yards</SelectItem>
                    <SelectItem value="rolls">Rolls</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={priority}
                  onValueChange={setPriority}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={status}
                  onValueChange={setStatus}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="DELAYED">Delayed</SelectItem>
                    <SelectItem value="DISRUPTED">Disrupted</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="SHIPPED">Shipped</SelectItem>
                    <SelectItem value="DELIVERED">Delivered</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
            <CardDescription>Order and expected delivery dates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="orderDate">Order Date *</Label>
                <Input
                  id="orderDate"
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedDate">Expected Delivery *</Label>
                <Input
                  id="expectedDate"
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Production Stages */}
        <Card>
          <CardHeader>
            <CardTitle>Production Stages</CardTitle>
            <CardDescription>
              Define the production stages for tracking progress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SortableStageList
              stages={stages}
              onReorder={setStages}
              onNameChange={updateStageName}
              onRemove={removeStage}
              isLoading={isLoading}
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addStage}
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Stage
            </Button>

            {/* Quick add default stages */}
            <div className="pt-2 border-t">
              <p className="text-sm text-gray-500 dark:text-zinc-400 mb-2">
                Quick add common stages:
              </p>
              <div className="flex flex-wrap gap-2">
                {defaultStages.map((stageName) => (
                  <Button
                    key={stageName}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!stages.some((s) => s.name === stageName)) {
                        setStages([
                          ...stages,
                          {
                            id: `new-${Date.now()}`,
                            name: stageName,
                            sequence: stages.length + 1,
                            progress: 0,
                            status: "NOT_STARTED",
                          },
                        ]);
                      }
                    }}
                    disabled={
                      isLoading || stages.some((s) => s.name === stageName)
                    }
                    className="text-xs"
                  >
                    + {stageName}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
            <CardDescription>Optional notes and tags</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional notes about this order..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                placeholder="urgent, sample, summer-2024 (comma separated)"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 dark:text-zinc-400">
                Separate multiple tags with commas
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Recurrence */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Repeat className="h-5 w-5 text-indigo-500" />
              Recurrence
            </CardTitle>
            <CardDescription>Set up automatic reorder reminders</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="recurrenceEnabled" className="cursor-pointer">Repeat this order</Label>
              <Switch
                id="recurrenceEnabled"
                checked={recurrenceEnabled}
                onCheckedChange={setRecurrenceEnabled}
                disabled={isLoading}
              />
            </div>
            {recurrenceEnabled && (
              <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-zinc-800">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recurrenceInterval">Reorder Interval</Label>
                    <Select
                      value={recurrenceInterval}
                      onValueChange={(val) => {
                        setRecurrenceInterval(val);
                        if (val !== "custom" && orderDate) {
                          const d = new Date(orderDate);
                          d.setDate(d.getDate() + parseInt(val));
                          setRecurrenceNextDate(d.toISOString().split("T")[0]);
                        }
                      }}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">Every 30 days</SelectItem>
                        <SelectItem value="60">Every 60 days</SelectItem>
                        <SelectItem value="90">Every 90 days</SelectItem>
                        <SelectItem value="120">Every 120 days</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {recurrenceInterval === "custom" && (
                    <div className="space-y-2">
                      <Label htmlFor="recurrenceCustomDays">Custom Interval (days)</Label>
                      <Input
                        id="recurrenceCustomDays"
                        type="number"
                        min="1"
                        max="365"
                        placeholder="e.g. 45"
                        value={recurrenceCustomDays}
                        onChange={(e) => {
                          setRecurrenceCustomDays(e.target.value);
                          if (e.target.value && orderDate) {
                            const d = new Date(orderDate);
                            d.setDate(d.getDate() + parseInt(e.target.value));
                            setRecurrenceNextDate(d.toISOString().split("T")[0]);
                          }
                        }}
                        disabled={isLoading}
                      />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recurrenceNextDate">Next Order Date</Label>
                  <Input
                    id="recurrenceNextDate"
                    type="date"
                    value={recurrenceNextDate}
                    onChange={(e) => setRecurrenceNextDate(e.target.value)}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-gray-500 dark:text-zinc-400">
                    You&apos;ll receive a notification 7 days before this date to reorder.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-4">
          <Link href={`/orders/${params.id}`}>
            <Button type="button" variant="outline" disabled={isLoading}>
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isLoading}>
            {isUploadingImage ? "Uploading image..." : isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
