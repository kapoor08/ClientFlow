import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Upload,
  FileText,
  Image,
  FileSpreadsheet,
  MoreHorizontal,
  Download,
  Eye,
} from "lucide-react";

const mockFiles = [
  {
    id: "f1",
    name: "Q1-report.pdf",
    type: "pdf",
    size: "2.4 MB",
    project: "SEO Optimization",
    uploadedBy: "Lisa Wong",
    uploadedAt: "2 hours ago",
  },
  {
    id: "f2",
    name: "brand-guidelines-v3.pdf",
    type: "pdf",
    size: "8.1 MB",
    project: "Website Redesign",
    uploadedBy: "Jane Doe",
    uploadedAt: "1 day ago",
  },
  {
    id: "f3",
    name: "homepage-mockup.png",
    type: "image",
    size: "1.8 MB",
    project: "Website Redesign",
    uploadedBy: "Alex Smith",
    uploadedAt: "2 days ago",
  },
  {
    id: "f4",
    name: "budget-tracker.xlsx",
    type: "spreadsheet",
    size: "340 KB",
    project: "E-commerce Platform",
    uploadedBy: "Mike Chen",
    uploadedAt: "3 days ago",
  },
  {
    id: "f5",
    name: "app-wireframes.png",
    type: "image",
    size: "3.2 MB",
    project: "Mobile App MVP",
    uploadedBy: "Alex Smith",
    uploadedAt: "4 days ago",
  },
  {
    id: "f6",
    name: "client-brief.pdf",
    type: "pdf",
    size: "520 KB",
    project: "Brand Identity",
    uploadedBy: "Mike Chen",
    uploadedAt: "1 week ago",
  },
];

const typeIcon: Record<string, typeof FileText> = {
  pdf: FileText,
  image: Image,
  spreadsheet: FileSpreadsheet,
};

const FilesPage = () => {
  const [search, setSearch] = useState("");
  const filtered = mockFiles.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">
            Files
          </h1>
          <p className="text-sm text-muted-foreground">
            {mockFiles.length} files across all projects
          </p>
        </div>
        <Button>
          <Upload size={16} className="mr-1.5" /> Upload File
        </Button>
      </div>

      <div className="mb-4 relative max-w-sm">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Search files…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-card shadow-cf-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                File
              </th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">
                Project
              </th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">
                Size
              </th>
              <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">
                Uploaded By
              </th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                Date
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((file) => {
              const Icon = typeIcon[file.type] || FileText;
              return (
                <tr
                  key={file.id}
                  className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-primary">
                        <Icon size={16} />
                      </div>
                      <span className="font-medium text-foreground">
                        {file.name}
                      </span>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {file.project}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {file.size}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                    {file.uploadedBy}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {file.uploadedAt}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button className="rounded-lg p-1 text-muted-foreground hover:bg-secondary">
                        <Eye size={14} />
                      </button>
                      <button className="rounded-lg p-1 text-muted-foreground hover:bg-secondary">
                        <Download size={14} />
                      </button>
                      <button className="rounded-lg p-1 text-muted-foreground hover:bg-secondary">
                        <MoreHorizontal size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FilesPage;
