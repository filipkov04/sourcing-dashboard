"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, X } from "lucide-react";
import { calcVolumeCBM, tagColor } from "@/lib/inventory-utils";

const INPUT_CLASS =
  "w-full rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

const LABEL_CLASS = "block text-sm font-medium text-gray-700 dark:text-zinc-300 mb-1";

const CURRENCIES = ["USD", "EUR", "GBP", "CNY"];

export function ProductForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [weight, setWeight] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [cogs, setCogs] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [hsCode, setHsCode] = useState("");
  const [originCountry, setOriginCountry] = useState("");
  const [minStock, setMinStock] = useState("");
  const [maxStock, setMaxStock] = useState("");
  const [safetyStock, setSafetyStock] = useState("");
  const [leadTimeProd, setLeadTimeProd] = useState("");
  const [leadTimeShip, setLeadTimeShip] = useState("");
  const [moq, setMoq] = useState("");
  const [dailySalesEstimate, setDailySalesEstimate] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Computed volume
  const volumeCBM = calcVolumeCBM(
    length ? parseFloat(length) : null,
    width ? parseFloat(width) : null,
    height ? parseFloat(height) : null
  );

  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Build body, converting empty strings to undefined for optional fields
    const body = {
      sku: sku.trim(),
      name: name.trim(),
      description: description.trim() || undefined,
      category: category.trim() || undefined,
      weight: weight ? parseFloat(weight) : undefined,
      length: length ? parseFloat(length) : undefined,
      width: width ? parseFloat(width) : undefined,
      height: height ? parseFloat(height) : undefined,
      cogs: cogs ? parseFloat(cogs) : undefined,
      currency,
      hsCode: hsCode.trim() || undefined,
      originCountry: originCountry.trim() || undefined,
      minStock: minStock ? parseInt(minStock) : undefined,
      maxStock: maxStock ? parseInt(maxStock) : undefined,
      safetyStock: safetyStock ? parseInt(safetyStock) : undefined,
      leadTimeProdDays: leadTimeProd ? parseInt(leadTimeProd) : undefined,
      leadTimeShipDays: leadTimeShip ? parseInt(leadTimeShip) : undefined,
      moq: moq ? parseInt(moq) : undefined,
      dailySalesEstimate: dailySalesEstimate ? parseFloat(dailySalesEstimate) : undefined,
      tags,
    };

    // Basic validation
    if (!body.sku) {
      setError("SKU is required");
      setIsSubmitting(false);
      return;
    }
    if (!body.name) {
      setError("Product name is required");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create product");
        setIsSubmitting(false);
        return;
      }
      router.push("/products");
      router.refresh();
    } catch {
      setError("Failed to create product");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Product Identity */}
          <Card>
            <CardHeader>
              <CardTitle>Product Identity</CardTitle>
              <CardDescription>Basic product information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* SKU */}
              <div>
                <label htmlFor="sku" className={LABEL_CLASS}>
                  SKU <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="sku"
                  autoComplete="off"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  disabled={isSubmitting}
                  className={INPUT_CLASS}
                  placeholder="e.g., SKU-001"
                />
              </div>

              {/* Name */}
              <div>
                <label htmlFor="name" className={LABEL_CLASS}>
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  autoComplete="off"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isSubmitting}
                  className={INPUT_CLASS}
                  placeholder="e.g., Classic Leather Boot"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className={LABEL_CLASS}>
                  Description
                </label>
                <textarea
                  id="description"
                  autoComplete="off"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isSubmitting}
                  rows={3}
                  className={INPUT_CLASS}
                  placeholder="Product description..."
                />
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className={LABEL_CLASS}>
                  Category
                </label>
                <input
                  type="text"
                  id="category"
                  autoComplete="off"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={isSubmitting}
                  className={INPUT_CLASS}
                  placeholder="e.g., Footwear"
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Physical Properties */}
          <Card>
            <CardHeader>
              <CardTitle>Physical Properties</CardTitle>
              <CardDescription>Weight and dimensions for shipping calculations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Weight */}
              <div>
                <label htmlFor="weight" className={LABEL_CLASS}>
                  Weight (kg)
                </label>
                <input
                  type="number"
                  id="weight"
                  step="0.01"
                  min="0"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  disabled={isSubmitting}
                  className={INPUT_CLASS}
                  placeholder="0.00"
                />
              </div>

              {/* Dimensions */}
              <div>
                <label className={LABEL_CLASS}>Dimensions (cm)</label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      disabled={isSubmitting}
                      className={INPUT_CLASS}
                      placeholder="Length"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      disabled={isSubmitting}
                      className={INPUT_CLASS}
                      placeholder="Width"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      disabled={isSubmitting}
                      className={INPUT_CLASS}
                      placeholder="Height"
                    />
                  </div>
                </div>
              </div>

              {/* Volume CBM (computed display) */}
              {volumeCBM !== null && (
                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-600 dark:text-zinc-400">
                    Volume: <span className="font-medium text-gray-900 dark:text-white">{volumeCBM.toFixed(4)} CBM</span>
                  </div>
                  {volumeCBM > 1 && (
                    <span className="inline-flex items-center rounded-full bg-orange-500/10 dark:bg-orange-500/20 px-2.5 py-0.5 text-xs font-medium text-orange-700 dark:text-orange-400">
                      Bulk Cargo
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 3: Procurement Data */}
          <Card>
            <CardHeader>
              <CardTitle>Procurement Data</CardTitle>
              <CardDescription>Cost and trade information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* COGS */}
              <div>
                <label htmlFor="cogs" className={LABEL_CLASS}>
                  COGS per Unit
                </label>
                <input
                  type="number"
                  id="cogs"
                  step="0.01"
                  min="0"
                  value={cogs}
                  onChange={(e) => setCogs(e.target.value)}
                  disabled={isSubmitting}
                  className={INPUT_CLASS}
                  placeholder="0.00"
                />
              </div>

              {/* Currency */}
              <div>
                <label htmlFor="currency" className={LABEL_CLASS}>
                  Currency
                </label>
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  disabled={isSubmitting}
                  className={INPUT_CLASS}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* HS Code */}
              <div>
                <label htmlFor="hsCode" className={LABEL_CLASS}>
                  HS Code
                </label>
                <input
                  type="text"
                  id="hsCode"
                  autoComplete="off"
                  value={hsCode}
                  onChange={(e) => setHsCode(e.target.value)}
                  disabled={isSubmitting}
                  className={INPUT_CLASS}
                  placeholder="e.g., 6403.99"
                />
              </div>

              {/* Origin Country */}
              <div>
                <label htmlFor="originCountry" className={LABEL_CLASS}>
                  Origin Country
                </label>
                <input
                  type="text"
                  id="originCountry"
                  autoComplete="off"
                  value={originCountry}
                  onChange={(e) => setOriginCountry(e.target.value)}
                  disabled={isSubmitting}
                  className={INPUT_CLASS}
                  placeholder="e.g., China"
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Inventory Thresholds */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory Thresholds</CardTitle>
              <CardDescription>Stock level triggers for alerts and reordering</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="minStock" className={LABEL_CLASS}>
                  Min Stock / Reorder Point
                </label>
                <input
                  type="number"
                  id="minStock"
                  min="0"
                  step="1"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                  disabled={isSubmitting}
                  className={INPUT_CLASS}
                  placeholder="0"
                />
              </div>

              <div>
                <label htmlFor="maxStock" className={LABEL_CLASS}>
                  Max Stock
                </label>
                <input
                  type="number"
                  id="maxStock"
                  min="0"
                  step="1"
                  value={maxStock}
                  onChange={(e) => setMaxStock(e.target.value)}
                  disabled={isSubmitting}
                  className={INPUT_CLASS}
                  placeholder="0"
                />
              </div>

              <div>
                <label htmlFor="safetyStock" className={LABEL_CLASS}>
                  Safety Stock
                </label>
                <input
                  type="number"
                  id="safetyStock"
                  min="0"
                  step="1"
                  value={safetyStock}
                  onChange={(e) => setSafetyStock(e.target.value)}
                  disabled={isSubmitting}
                  className={INPUT_CLASS}
                  placeholder="0"
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 5: Sourcing Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Sourcing Metadata</CardTitle>
              <CardDescription>Lead times and minimum order quantities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="leadTimeProd" className={LABEL_CLASS}>
                  Lead Time — Production
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="leadTimeProd"
                    min="0"
                    step="1"
                    value={leadTimeProd}
                    onChange={(e) => setLeadTimeProd(e.target.value)}
                    disabled={isSubmitting}
                    className={INPUT_CLASS}
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-zinc-500">
                    days
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="leadTimeShip" className={LABEL_CLASS}>
                  Lead Time — Shipping
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="leadTimeShip"
                    min="0"
                    step="1"
                    value={leadTimeShip}
                    onChange={(e) => setLeadTimeShip(e.target.value)}
                    disabled={isSubmitting}
                    className={INPUT_CLASS}
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-zinc-500">
                    days
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="moq" className={LABEL_CLASS}>
                  MOQ (Minimum Order Quantity)
                </label>
                <input
                  type="number"
                  id="moq"
                  min="1"
                  step="1"
                  value={moq}
                  onChange={(e) => setMoq(e.target.value)}
                  disabled={isSubmitting}
                  className={INPUT_CLASS}
                  placeholder="1"
                />
              </div>

              <div>
                <label htmlFor="dailySalesEstimate" className={LABEL_CLASS}>
                  Daily Sales Estimate
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="dailySalesEstimate"
                    min="0"
                    step="0.1"
                    value={dailySalesEstimate}
                    onChange={(e) => setDailySalesEstimate(e.target.value)}
                    disabled={isSubmitting}
                    className={INPUT_CLASS}
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-zinc-500">
                    units/day
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-400 dark:text-zinc-500">
                  Used for runway forecasting until real sales data accumulates
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tags Card */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>Organize products with tags</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  disabled={isSubmitting}
                  className={INPUT_CLASS}
                  placeholder="Add a tag..."
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  disabled={isSubmitting || !tagInput.trim()}
                  className="flex-shrink-0 inline-flex items-center justify-center rounded-lg border border-gray-300 dark:border-zinc-600 bg-gray-100 dark:bg-zinc-700 px-3 py-2 text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => {
                    const color = tagColor(tag);
                    return (
                      <span
                        key={tag}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${color.bg} ${color.text}`}
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:opacity-70"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {tags.length === 0 && (
                <p className="text-xs text-gray-400 dark:text-zinc-500">No tags added yet</p>
              )}
            </CardContent>
          </Card>

          {/* Submit Card */}
          <Card>
            <CardHeader>
              <CardTitle>Ready to create?</CardTitle>
              <CardDescription>Review the information and submit</CardDescription>
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
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#FF4D15] hover:bg-[#e5440f] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Product"
                )}
              </button>

              <button
                type="button"
                onClick={() => router.push("/products")}
                disabled={isSubmitting}
                className="w-full rounded-lg border border-gray-300 dark:border-zinc-600 bg-gray-100 dark:bg-zinc-800 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <CardContent className="text-sm text-gray-500 dark:text-zinc-400">
              <ul className="space-y-2">
                <li>&#8226; SKU and product name are required</li>
                <li>&#8226; Dimensions auto-calculate volume in CBM</li>
                <li>&#8226; Tags help organize and filter products</li>
                <li>&#8226; You can edit all details later</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
