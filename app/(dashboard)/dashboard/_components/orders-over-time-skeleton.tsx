import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function OrdersOverTimeSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-5 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
        <div className="mt-1 h-4 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
      </CardContent>
    </Card>
  );
}
