import type { ApiSection, ApiEndpoint } from "./api-docs-data";
import { EndpointCard } from "./EndpointCard";

// ─── ApiSection ───────────────────────────────────────────────────────────────

type ApiSectionProps = {
  section: ApiSection;
};

export function ApiSection({ section }: ApiSectionProps) {
  return (
    <div key={section.id}>
      <div className="mb-4">
        <h2 className="font-display text-xl font-semibold text-foreground">{section.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
      </div>
      <div className="space-y-2">
        {section.endpoints.map((endpoint: ApiEndpoint) => (
          <EndpointCard key={`${endpoint.method}-${endpoint.path}`} endpoint={endpoint} />
        ))}
      </div>
    </div>
  );
}
