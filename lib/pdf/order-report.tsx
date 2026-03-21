import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  header: { marginBottom: 20 },
  title: { fontSize: 20, fontWeight: "bold", color: "#EB5D2E", marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#6b7280" },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: "bold", color: "#1f2937", marginBottom: 8, borderBottom: "1 solid #e5e7eb", paddingBottom: 4 },
  row: { flexDirection: "row", marginBottom: 3 },
  label: { width: 130, color: "#6b7280", fontSize: 9 },
  value: { flex: 1, color: "#1f2937", fontSize: 9 },
  tableHeader: { flexDirection: "row", backgroundColor: "#f9fafb", padding: 6, borderBottom: "1 solid #e5e7eb" },
  tableHeaderCell: { fontSize: 8, fontWeight: "bold", color: "#374151" },
  tableRow: { flexDirection: "row", padding: 6, borderBottom: "0.5 solid #f3f4f6" },
  tableCell: { fontSize: 8, color: "#4b5563" },
  badge: { fontSize: 8, paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4 },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, fontSize: 7, color: "#9ca3af", flexDirection: "row", justifyContent: "space-between" },
});

const statusColors: Record<string, string> = {
  PENDING: "#f59e0b",
  IN_PROGRESS: "#3b82f6",
  BEHIND_SCHEDULE: "#eab308",
  DELAYED: "#EB5D2E",
  DISRUPTED: "#ef4444",
  COMPLETED: "#10b981",
  SHIPPED: "#8b5cf6",
  IN_TRANSIT: "#06b6d4",
  CUSTOMS: "#a855f7",
  DELIVERED: "#6b7280",
  CANCELLED: "#9ca3af",
};

type OrderData = {
  orderNumber: string | null;
  productName: string;
  productSKU: string | null;
  quantity: number;
  unit: string;
  status: string;
  priority: string;
  overallProgress: number;
  expectedStartDate: string;
  placedDate?: string | null;
  expectedDate: string;
  actualDate: string | null;
  notes: string | null;
  tags: string[];
  factory: { name: string; location: string };
  stages: Array<{
    name: string;
    sequence: number;
    progress: number;
    status: string;
    startedAt: string | null;
    completedAt: string | null;
  }>;
};

function formatDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Single order detail PDF */
export function SingleOrderPDF({ order }: { order: OrderData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>SourceTrack</Text>
          <Text style={styles.subtitle}>Order Report — {order.orderNumber ?? "No PO#"}</Text>
        </View>

        {/* Order Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Details</Text>
          <View style={styles.row}><Text style={styles.label}>Order Number</Text><Text style={styles.value}>{order.orderNumber ?? "No PO#"}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Product</Text><Text style={styles.value}>{order.productName}{order.productSKU ? ` (${order.productSKU})` : ""}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Quantity</Text><Text style={styles.value}>{order.quantity.toLocaleString()} {order.unit}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Status</Text><Text style={[styles.value, { color: statusColors[order.status] || "#1f2937" }]}>{order.status.replace(/_/g, " ")}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Priority</Text><Text style={styles.value}>{order.priority}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Progress</Text><Text style={styles.value}>{order.overallProgress}%</Text></View>
          <View style={styles.row}><Text style={styles.label}>Factory</Text><Text style={styles.value}>{order.factory.name} — {order.factory.location}</Text></View>
          <View style={styles.row}><Text style={styles.label}>Expected Start Date</Text><Text style={styles.value}>{formatDate(order.expectedStartDate)}</Text></View>
          {order.placedDate && <View style={styles.row}><Text style={styles.label}>Placed Date</Text><Text style={styles.value}>{formatDate(order.placedDate)}</Text></View>}
          <View style={styles.row}><Text style={styles.label}>Expected Date</Text><Text style={styles.value}>{formatDate(order.expectedDate)}</Text></View>
          {order.actualDate && <View style={styles.row}><Text style={styles.label}>Actual Date</Text><Text style={styles.value}>{formatDate(order.actualDate)}</Text></View>}
          {order.notes && <View style={styles.row}><Text style={styles.label}>Notes</Text><Text style={styles.value}>{order.notes}</Text></View>}
        </View>

        {/* Stages */}
        {order.stages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Production Stages</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: 30 }]}>#</Text>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Stage</Text>
              <Text style={[styles.tableHeaderCell, { width: 70 }]}>Status</Text>
              <Text style={[styles.tableHeaderCell, { width: 55 }]}>Progress</Text>
              <Text style={[styles.tableHeaderCell, { width: 75 }]}>Started</Text>
              <Text style={[styles.tableHeaderCell, { width: 75 }]}>Completed</Text>
            </View>
            {order.stages.map((stage, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: 30 }]}>{stage.sequence}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{stage.name}</Text>
                <Text style={[styles.tableCell, { width: 70 }]}>{stage.status.replace(/_/g, " ")}</Text>
                <Text style={[styles.tableCell, { width: 55 }]}>{stage.progress}%</Text>
                <Text style={[styles.tableCell, { width: 75 }]}>{stage.startedAt ? formatDate(stage.startedAt) : "—"}</Text>
                <Text style={[styles.tableCell, { width: 75 }]}>{stage.completedAt ? formatDate(stage.completedAt) : "—"}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Generated by SourceTrack</Text>
          <Text>{new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</Text>
        </View>
      </Page>
    </Document>
  );
}

/** Bulk summary PDF with list of orders */
export function BulkOrdersPDF({ orders, orgName }: { orders: OrderData[]; orgName: string }) {
  // Status summary
  const statusCounts: Record<string, number> = {};
  for (const o of orders) {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>SourceTrack</Text>
          <Text style={styles.subtitle}>Orders Summary Report — {orgName}</Text>
          <Text style={[styles.subtitle, { marginTop: 2 }]}>{orders.length} orders • Generated {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</Text>
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Summary</Text>
          {Object.entries(statusCounts).map(([status, count]) => (
            <View key={status} style={styles.row}>
              <Text style={styles.label}>{status.replace(/_/g, " ")}</Text>
              <Text style={[styles.value, { color: statusColors[status] || "#1f2937" }]}>{count}</Text>
            </View>
          ))}
        </View>

        {/* Orders Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Orders</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: 70 }]}>Order #</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Product</Text>
            <Text style={[styles.tableHeaderCell, { width: 80 }]}>Factory</Text>
            <Text style={[styles.tableHeaderCell, { width: 60 }]}>Status</Text>
            <Text style={[styles.tableHeaderCell, { width: 45 }]}>Progress</Text>
            <Text style={[styles.tableHeaderCell, { width: 65 }]}>Expected</Text>
          </View>
          {orders.map((order, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: 70, color: "#EB5D2E" }]}>{order.orderNumber ?? "No PO#"}</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>{order.productName}</Text>
              <Text style={[styles.tableCell, { width: 80 }]}>{order.factory.name}</Text>
              <Text style={[styles.tableCell, { width: 60, color: statusColors[order.status] || "#4b5563" }]}>{order.status.replace(/_/g, " ")}</Text>
              <Text style={[styles.tableCell, { width: 45 }]}>{order.overallProgress}%</Text>
              <Text style={[styles.tableCell, { width: 65 }]}>{formatDate(order.expectedDate)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer} fixed>
          <Text>Generated by SourceTrack</Text>
          <Text>Page 1</Text>
        </View>
      </Page>
    </Document>
  );
}
