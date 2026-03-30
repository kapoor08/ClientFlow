import { ListPageLayout } from "@/components/layout/ListPageLayout";
import { NotificationFeed } from "./NotificationFeed";

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
