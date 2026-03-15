type AuthNoticeProps = {
  tone: "error" | "success" | "info";
  message: string;
};

const toneClasses: Record<AuthNoticeProps["tone"], string> = {
  error: "border-destructive/20 bg-destructive/5 text-destructive",
  success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700",
  info: "border-primary/20 bg-primary/5 text-foreground",
};

export default function AuthNotice({ tone, message }: AuthNoticeProps) {
  return (
    <div className={`rounded-lg border px-3 py-2 text-sm ${toneClasses[tone]}`}>
      {message}
    </div>
  );
}
