import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function OrdersByFactorySkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Orders by factory</CardTitle>
        <CardDescription>Top performing factories</CardDescription>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full" />
      </CardContent>
    </Card>
  );
}
