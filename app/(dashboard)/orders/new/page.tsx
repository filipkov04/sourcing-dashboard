"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Upload, X, ImageIcon } from "lucide-react";
import { SortableStageList } from "@/components/sortable-stage-list";

type Factory = {
  id: string;
  name: string;
  location: string;
};

type Stage = {
  id: string;
  name: string;
  sequence: number;
};

const defaultStages = [
  "Material Sourcing",
  "Cutting",
  "Sewing",
  "Quality Check",
  "Packaging",
];

export default function NewOrderPage() {
  return (
    <Suspense>
      <NewOrderForm />
    </Suspense>
  );
}

function NewOrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [factories, setFactories] = useState<Factory[]>([]);
  const [stages, setStages] = useState<Stage[]>([
    { id: "1", name: "Cutting", sequence: 1 },
    { id: "2", name: "Sewing", sequence: 2 },
    { id: "3", name: "Quality Check", sequence: 3 },
    { id: "4", name: "Packaging", sequence: 4 },
  ]);

  // Form state
  const [orderNumber, setOrderNumber] = useState("");
  const [productName, setProductName] = useState("");
  const [productSKU, setProductSKU] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("pieces");
  const [factoryId, setFactoryId] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split("T")[0]);
  const [expectedDate, setExpectedDate] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [notes, setNotes] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Cleanup blob URL on unmount to prevent memory leak
  useEffect(() => {
    return () => {
      if (productImagePreview && productImagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(productImagePreview);
      }
    };
  }, [productImagePreview]);

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

  // Pre-fill from reorder (fetch full order data)
  useEffect(() => {
    const reorderId = searchParams.get("reorderId");
    if (!reorderId) return;

    async function fetchOriginalOrder() {
      try {
        const response = await fetch(`/api/orders/${reorderId}`);
        const data = await response.json();
        if (data.success) {
          const order = data.data;
          setProductName(order.productName);
          setProductSKU(order.productSKU || "");
          setQuantity(String(order.quantity));
          setUnit(order.unit);
          setFactoryId(order.factoryId);
          setPriority(order.priority);
          setNotes(order.notes || "");
          setTagsInput(order.tags?.join(", ") || "");
          if (order.productImage) {
            setExistingImageUrl(order.productImage);
            setProductImagePreview(order.productImage);
          }
          if (order.stages && order.stages.length > 0) {
            setStages(
              order.stages.map((s: { id?: string; name: string; sequence: number }) => ({
                id: s.id || String(s.sequence),
                name: s.name,
                sequence: s.sequence,
              }))
            );
          }
        }
      } catch (error) {
        console.error("Failed to fetch order for reorder:", error);
      }
    }
    fetchOriginalOrder();
  }, [searchParams]);

  const addStage = () => {
    const newSequence = stages.length + 1;
    setStages([
      ...stages,
      {
        id: Date.now().toString(),
        name: "",
        sequence: newSequence,
      },
    ]);
  };

  const removeStage = (id: string) => {
    const filtered = stages.filter((s) => s.id !== id);
    // Resequence
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
    setProductImageFile(file);
    setProductImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setProductImageFile(null);
    setExistingImageUrl(null);
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
      // Upload product image if new file selected, or reuse existing URL from reorder
      let productImageUrl: string | null = existingImageUrl;
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
      }

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderNumber: orderNumber.trim(),
          productName: productName.trim(),
          productSKU: productSKU.trim() || null,
          productImage: productImageUrl,
          quantity: parseInt(quantity),
          unit,
          factoryId,
          orderDate,
          expectedDate,
          priority,
          notes: notes.trim() || null,
          tags,
          stages: validStages.map((s) => ({
            name: s.name,
            sequence: s.sequence,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create order");
        return;
      }

      // Redirect to orders list on success
      router.push("/orders");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/orders">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Order</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400">Create a new production order</p>
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
                <Select value={factoryId} onValueChange={setFactoryId} disabled={isLoading}>
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
                  className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-zinc-600 rounded-lg cursor-pointer hover:border-[#FF8C1A] dark:hover:border-[#FF8C1A] transition-colors"
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

            <div className="grid grid-cols-3 gap-4">
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
                <Select value={priority} onValueChange={setPriority} disabled={isLoading}>
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
                  min={orderDate}
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
              <p className="text-sm text-gray-500 dark:text-zinc-400 mb-2">Quick add common stages:</p>
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
                            id: Date.now().toString(),
                            name: stageName,
                            sequence: stages.length + 1,
                          },
                        ]);
                      }
                    }}
                    disabled={isLoading || stages.some((s) => s.name === stageName)}
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

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-4">
          <Link href="/orders">
            <Button type="button" variant="outline" disabled={isLoading}>
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isLoading}>
            {isUploadingImage ? "Uploading image..." : isLoading ? "Creating..." : "Create Order"}
          </Button>
        </div>
      </form>
    </div>
  );
}
