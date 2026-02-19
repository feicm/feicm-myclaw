"use client";

import { useMemo } from "react";
import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

type Props = {
  content: string;
  className?: string;
};

export default function MarkdownRenderer({ content, className }: Props) {
  const html = useMemo(() => {
    const raw = marked.parse(content, { async: false });
    return DOMPurify.sanitize(raw, {
      ALLOWED_TAGS: ["h1", "h2", "h3", "p", "strong", "em", "ul", "ol", "li", "blockquote", "code", "pre", "a"],
      ALLOWED_ATTR: ["href", "title", "target", "rel"],
    });
  }, [content]);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
