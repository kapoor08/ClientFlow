import { ListPageLayout } from "@/components/layout/templates/ListPageLayout";
import { NotificationFeed } from "@/components/notifications";

const NotificationsPage = () => {
  return (
    <ListPageLayout
      title="Notifications"
      description="Stay updated on activity across your organization"
    >
      <NotificationFeed />
    </ListPageLayout>
  );
};

export default NotificationsPage;
