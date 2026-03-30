import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ListPageLayout } from "@/components/layout/ListPageLayout";
import { PreferencesContent } from "./PreferencesContent";

const NotificationPreferencesPage = () => {
  return (
    <ListPageLayout
      title="Notification Preferences"
      description="Choose how you want to be notified for each event type."
      action={
        <Link
          href="/notifications"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft size={14} />
          Back to Notifications
        </Link>
      }
    >
      <PreferencesContent />
    </ListPageLayout>
  );
};

export default NotificationPreferencesPage;
