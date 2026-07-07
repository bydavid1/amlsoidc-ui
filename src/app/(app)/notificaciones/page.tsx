"use client";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { BellOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  describeNotification,
  useMarkNotificationRead,
  useNotifications,
} from "@/features/notifications/api";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const query = useNotifications();
  const markRead = useMarkNotificationRead();
  const router = useRouter();

  return (
    <div className="mx-auto max-w-[720px] space-y-6 px-6 py-12">
      <h1 className="display-sm text-ink">Notificaciones</h1>

      {query.isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-[12px]" />
          ))}
        </div>
      )}

      {query.isSuccess && query.data.length === 0 && (
        <Card className="rounded-[24px] border-hairline shadow-none">
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-surface-strong">
              <BellOff className="size-6 text-muted-foreground" />
            </span>
            <p className="body-md text-body-text">No tienes notificaciones todavía.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {query.data?.map((n) => {
          const { text, href } = describeNotification(n);
          const unread = n.readAt === null;
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => {
                if (unread) markRead.mutate(n.id);
                router.push(href);
              }}
              className={cn(
                "flex w-full items-start justify-between gap-4 rounded-[12px] border px-5 py-4 text-left transition-colors",
                unread
                  ? "border-primary/30 bg-primary/5 hover:bg-primary/10"
                  : "border-hairline bg-background hover:bg-surface-soft",
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    unread ? "bg-primary" : "bg-transparent",
                  )}
                />
                <span className={cn("body-md", unread ? "font-semibold text-ink" : "text-body-text")}>
                  {text}
                </span>
              </div>
              <span className="caption shrink-0 text-muted-foreground">
                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es })}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
