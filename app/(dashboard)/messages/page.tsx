import { Suspense } from "react";
import { MessagesPage } from "@/components/messages/messages-page";

export const metadata = {
  title: "Messages - SourceTrack",
};

export default function Page() {
  return (
    <Suspense>
      <MessagesPage />
    </Suspense>
  );
}
