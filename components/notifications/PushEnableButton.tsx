"use client";

import { useEffect, useState } from "react";
import { BellRing, BellOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  requestPushPermissionAndSubscribe,
  unsubscribeFromPushAndRemove,
} from "@/core/notifications/useCase";

export function PushEnableButton() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) return;
    setSupported(true);

    // Register service worker
    navigator.serviceWorker
      .register("/sw.js")
      .catch((err) => console.warn("SW registration failed:", err));

    // Check current subscription state
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setSubscribed(!!sub);
      });
    });
  }, []);

  if (!supported) return null;

  const toggle = async () => {
    setLoading(true);
    try {
      if (subscribed) {
        await unsubscribeFromPushAndRemove();
        setSubscribed(false);
      } else {
        const endpoint = await requestPushPermissionAndSubscribe();
        setSubscribed(!!endpoint);
      }
    } catch (err) {
      console.error("Push toggle failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={subscribed ? "default" : "outline"}
      size="sm"
      onClick={toggle}
      disabled={loading}
      className="gap-2 cursor-pointer"
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : subscribed ? (
        <BellRing size={14} />
      ) : (
        <BellOff size={14} />
      )}
      {subscribed ? "Push enabled" : "Enable push notifications"}
    </Button>
  );
}
