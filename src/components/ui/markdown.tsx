"use client";

import mermaid from "mermaid";
import { useEffect, useId, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

// Import Catppuccin Latte theme for highlight.js
import "@catppuccin/highlightjs/css/catppuccin-latte.css"

// Initialize mermaid with editorial theme
mermaid.initialize({
  startOnLoad: false,
  theme: "base",
  themeVariables: {
    // Editorial warm palette
    primaryColor: "#e8d5cf",
    primaryTextColor: "#1a1a1a",
    primaryBorderColor: "#c45a3b",
    lineColor: "#64748b",
    secondaryColor: "#f5f3ef",
    tertiaryColor: "#faf9f7",
    background: "#faf9f7",
    mainBkg: "#f5f3ef",
    nodeBorder: "#c45a3b",
    clusterBkg: "#f5f3ef",
    titleColor: "#1a1a1a",
    edgeLabelBackground: "#faf9f7",
    // Node colors
    nodeTextColor: "#1a1a1a",
    // Arrow
    arrowheadColor: "#64748b",
  },
  flowchart: {
    curve: "basis",
    padding: 20,
    nodeSpacing: 50,
    rankSpacing: 50,
  },
  fontFamily:
    "var(--font-libre-franklin), ui-sans-serif, system-ui, sans-serif",
});

// Mermaid Diagram Component
function MermaidDiagram({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const id = useId().replace(/:/g, "_");

  useEffect(() => {
    const renderDiagram = async () => {
      if (!containerRef.current) return;

      try {
        const { svg: renderedSvg } = await mermaid.render(
          `mermaid-${id}`,
          chart,
        );
        setSvg(renderedSvg);
        setError(null);
      } catch (err) {
        console.error("Mermaid rendering error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to render diagram",
        );
      }
    };

    renderDiagram();
  }, [chart, id]);

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 md:p-4 mb-4">
        <p className="text-destructive text-xs md:text-sm">
          Mermaid Error: {error}
        </p>
        <pre className="mt-2 text-xs text-muted-foreground overflow-x-auto">
          {chart}
        </pre>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="my-4 md:my-6 flex justify-center bg-cream rounded-lg p-4 md:p-6 border border-border overflow-x-auto [&_svg]:max-w-full [&_svg]:h-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

interface MarkdownProps {
  children: string;
  className?: string;
  compact?: boolean;
}

export function Markdown({
  children,
  className,
  compact = false,
}: MarkdownProps) {
  return (
    <div className={cn("prose max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Headings - Editorial serif
          h1: ({ children }) => (
            <h1
              className={cn(
                "editorial-display text-2xl md:text-3xl text-foreground mb-3 md:mb-4",
                compact && "text-xl md:text-2xl mb-2",
              )}
            >
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2
              className={cn(
                "editorial-display text-xl md:text-2xl text-foreground mb-2 md:mb-3",
                compact && "text-lg md:text-xl mb-1 md:mb-2",
              )}
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              className={cn(
                "font-semibold text-lg md:text-xl text-foreground mb-2",
                compact && "text-base md:text-lg mb-1",
              )}
            >
              {children}
            </h3>
          ),
          // Paragraphs
          p: ({ children }) => (
            <p
              className={cn(
                "text-sm md:text-base text-muted-foreground leading-relaxed mb-3 md:mb-4",
                compact && "mb-2 text-sm",
              )}
            >
              {children}
            </p>
          ),
          // Lists - Editorial dash style
          ul: ({ children }) => (
            <ul
              className={cn(
                "space-y-1.5 md:space-y-2 mb-3 md:mb-4 list-none",
                compact && "space-y-1 mb-2",
              )}
            >
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol
              className={cn(
                "space-y-1.5 md:space-y-2 mb-3 md:mb-4 list-decimal list-inside",
                compact && "space-y-1 mb-2",
              )}
            >
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="flex items-start gap-2 md:gap-3 text-sm md:text-base text-muted-foreground">
              <span className="text-primary mt-1 shrink-0">—</span>
              <span>{children}</span>
            </li>
          ),
          // Code - with Mermaid support and syntax highlighting
          code: ({ className, children, ...props }) => {
            const isMermaid = className?.includes("language-mermaid");
            const isHighlighted = className?.includes("hljs");
            const isInline = !className && !isHighlighted;

            if (isMermaid) {
              const chart = String(children).replace(/\n$/, "");
              return <MermaidDiagram chart={chart} />;
            }

            if (isInline) {
              return (
                <code className="px-1.5 py-0.5 rounded bg-[#eff1f5] text-[#4c4f69] font-mono text-xs md:text-sm border border-[#ccd0da]">
                  {children}
                </code>
              );
            }

            // For highlighted code blocks, let highlight.js handle the styling
            return (
              <code
                className={cn("font-mono text-xs md:text-sm", className)}
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ children, ...props }) => {
            // Check if child is a mermaid diagram (already rendered)
            const child = children as React.ReactElement<{
              className?: string;
            }>;
            if (child?.props?.className?.includes("language-mermaid")) {
              return <>{children}</>;
            }
            return (
              <pre
                className="rounded-lg p-4 md:p-5 overflow-x-auto border border-[#ccd0da] mb-3 md:mb-4 text-xs md:text-sm !bg-[#eff1f5]"
                {...props}
              >
                {children}
              </pre>
            );
          },
          // Blockquote - Editorial accent
          blockquote: ({ children }) => (
            <blockquote className="border-l-3 md:border-l-4 border-primary pl-4 md:pl-5 text-sm md:text-base text-muted-foreground my-3 md:my-4 italic">
              {children}
            </blockquote>
          ),
          // Strong and emphasis
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-primary">{children}</em>
          ),
          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
            >
              {children}
            </a>
          ),
          // Tables - Editorial minimal styling
          table: ({ children }) => (
            <div className="overflow-x-auto mb-3 md:mb-4 -mx-2 px-2">
              <table className="w-full border-collapse text-xs md:text-sm min-w-[400px]">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border border-border px-3 md:px-4 py-2 text-left font-semibold text-muted-foreground uppercase text-xs tracking-wide whitespace-nowrap">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-border px-3 md:px-4 py-2 text-muted-foreground">
              {children}
            </td>
          ),
          // Horizontal rule
          hr: () => <hr className="border-border my-4 md:my-6" />,
          // Images (for diagrams)
          img: ({ src, alt }) => (
            <div className="my-4 md:my-6 rounded-lg overflow-hidden border border-border bg-cream p-3 md:p-4">
              <img
                src={src}
                alt={alt || ""}
                className="w-full max-w-2xl mx-auto rounded-lg"
                loading="lazy"
              />
              {alt && (
                <p className="text-center text-xs md:text-sm text-muted-foreground mt-2 italic">
                  {alt}
                </p>
              )}
            </div>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
