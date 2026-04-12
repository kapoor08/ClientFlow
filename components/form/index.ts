// ─── Controlled inputs (text / number / phone) ──────────────────────────────
export { ControlledInput, type ControlledInputProps } from "./controlled/input/ControlledInput";
export { ControlledPhoneInput } from "./controlled/input/ControlledPhoneInput";
export {
  ControlledTextarea,
  type ControlledTextareaProps,
} from "./controlled/input/ControlledTextarea";

// ─── Controlled selects ─────────────────────────────────────────────────────
export {
  ControlledSelect,
  type ControlledSelectOption,
  type ControlledSelectProps,
} from "./controlled/select/ControlledSelect";
export {
  ControlledMultiSelect,
  type ControlledMultiSelectOption,
  type ControlledMultiSelectProps,
} from "./controlled/select/ControlledMultiSelect";

// ─── Controlled date / time ─────────────────────────────────────────────────
export { ControlledDatePicker } from "./controlled/date/ControlledDatePicker";
export { ControlledDateRangePicker } from "./controlled/date/ControlledDateRangePicker";
export { ControlledDateTimePicker } from "./controlled/date/ControlledDateTimePicker";
export { ControlledTimePicker } from "./controlled/date/ControlledTimePicker";

// ─── Controlled media / uploads ─────────────────────────────────────────────
export { ControlledAvatarInput } from "./controlled/media/ControlledAvatarInput";
export { ControlledLogoUpload } from "./controlled/media/ControlledLogoUpload";
export { ControlledThumbnailInput } from "./controlled/media/ControlledThumbnailInput";
export {
  ControlledFileUpload,
  type ControlledFileUploadProps,
  type FileItem,
} from "./controlled/media/ControlledFileUpload";

// ─── Controlled toggles ─────────────────────────────────────────────────────
export {
  ControlledCheckbox,
  type ControlledCheckboxProps,
} from "./controlled/toggle/ControlledCheckbox";
export {
  ControlledSwitch,
  type ControlledSwitchProps,
} from "./controlled/toggle/ControlledSwitch";

// ─── Controlled content (cards / FAQs / links / testimonials / steps) ──────
export {
  ControlledCards,
  type ControlledCardsProps,
  type FeatureCard,
} from "./controlled/content/ControlledCards";
export {
  ControlledCardsWithInfo,
  type ControlledCardsWithInfoProps,
  type CardWithInfo,
} from "./controlled/content/ControlledCardsWithInfo";
export {
  ControlledFAQs,
  type ControlledFAQsProps,
  type FAQ,
} from "./controlled/content/ControlledFAQs";
export {
  ControlledFooterLinkSections,
  type ControlledFooterLinkSectionsProps,
  type FooterLinkSection,
} from "./controlled/content/ControlledFooterLinkSections";
export {
  ControlledLinksWithType,
  type ControlledLinksWithTypeProps,
  type LinkWithType,
} from "./controlled/content/ControlledLinksWithType";
export {
  ControlledProcessSteps,
  type ControlledProcessStepsProps,
  type ProcessStep,
} from "./controlled/content/ControlledProcessSteps";
export {
  ControlledSimpleLinks,
  type ControlledSimpleLinksProps,
  type SimpleLink,
} from "./controlled/content/ControlledSimpleLinks";
export {
  ControlledTestimonials,
  type ControlledTestimonialsProps,
  type Testimonial,
} from "./controlled/content/ControlledTestimonials";

// ─── Uncontrolled pickers ───────────────────────────────────────────────────
export { DatePicker } from "./uncontrolled/DatePicker";
export { DateTimePicker } from "./uncontrolled/DateTimePicker";
export { TimePicker } from "./uncontrolled/TimePicker";

// ─── Layout helpers ─────────────────────────────────────────────────────────
export { FormGrid } from "./layout/FormGrid";
export { FormSection } from "./layout/FormSection";

// ─── Utilities ──────────────────────────────────────────────────────────────
export { DynamicKeyValueInput } from "./utilities/DynamicKeyValueInput";
export { SwitchField } from "./utilities/SwitchField";
export {
  TimeEstimateInput,
  minutesToEstimate,
  parseEstimate,
  MINS_PER_WEEK,
  MINS_PER_DAY,
  MINS_PER_HOUR,
} from "./utilities/TimeEstimateInput";
