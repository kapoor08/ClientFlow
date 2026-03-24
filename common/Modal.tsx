// Stub — full Modal implementation not used in this project
import type { ReactNode } from "react";

interface ModalProps {
  open?: boolean;
  onClose?: () => void;
  title?: string;
  children?: ReactNode;
  [key: string]: unknown;
}

export function Modal({ children }: ModalProps) {
  return <>{children}</>;
}
