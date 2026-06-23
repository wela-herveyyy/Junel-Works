"use client";

import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils/cn";

type MarkdownPreviewProps = {
  content: string;
  className?: string;
};

export function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  if (!content) return null;

  return (
    <div className={cn("junel-markdown", className)}>
      <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
    </div>
  );
}
