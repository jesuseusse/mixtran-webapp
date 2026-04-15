/**
 * Central re-export for all UI primitives.
 * Import from here in all feature and page components:
 *   import { Button, Input, Modal } from "@/components/ui";
 */

export { Button } from "./Button";
export type { ButtonProps, ButtonVariant, ButtonSize } from "./Button";

export { Input } from "./Input";
export type { InputProps } from "./Input";

export { Textarea } from "./Textarea";
export type { TextareaProps } from "./Textarea";

export { Select } from "./Select";
export type { SelectProps, SelectOption } from "./Select";

export { Modal } from "./Modal";
export type { ModalProps } from "./Modal";

export { Snackbar } from "./Snackbar";
export type { SnackbarProps, SnackbarType } from "./Snackbar";

export { Toggle } from "./Toggle";
export type { ToggleProps } from "./Toggle";

export { Badge } from "./Badge";
export type { BadgeProps, BadgeVariant, BadgeSize } from "./Badge";

export { Card } from "./Card";
export type { CardProps, CardPadding } from "./Card";

export { Spinner } from "./Spinner";
export type { SpinnerProps, SpinnerSize } from "./Spinner";

export { Rating } from "./Rating";
export type { RatingProps, RatingSize } from "./Rating";

export { AnimateInView } from "./AnimateInView";
export type { AnimateInViewProps, RevealVariant } from "./AnimateInView";

export { DataTable } from "./DataTable";
export type { DataTableProps, ColumnDef, HideBelow } from "./DataTable";

export { WhatsappContact } from "./WhatsappContact";
export type { WhatsappContactProps } from "./WhatsappContact";

export { PhoneInput } from "./PhoneInput";
export type { PhoneInputProps } from "./PhoneInput";

export { ImageUploader } from "./ImageUploader";
export type { ImageUploaderProps } from "./ImageUploader";
