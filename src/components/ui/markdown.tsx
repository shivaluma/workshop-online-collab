"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState, useId } from "react";
import mermaid from "mermaid";

// Initialize mermaid with dark theme
mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  themeVariables: {
    primaryColor: "#8b5cf6",
    primaryTextColor: "#f4f4f5",
    primaryBorderColor: "#6d28d9",
    lineColor: "#a78bfa",
    secondaryColor: "#1e1e2e",
    tertiaryColor: "#27272a",
    background: "#18181b",
    mainBkg: "#27272a",
    nodeBorder: "#6d28d9",
    clusterBkg: "#1e1e2e",
    titleColor: "#f4f4f5",
    edgeLabelBackground: "#27272a",
  },
  flowchart: {
    curve: "basis",
    padding: 20,
  },
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
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
        const { svg: renderedSvg } = await mermaid.render(`mermaid-${id}`, chart);
        setSvg(renderedSvg);
        setError(null);
      } catch (err) {
        console.error("Mermaid rendering error:", err);
        setError(err instanceof Error ? err.message : "Failed to render diagram");
      }
    };

    renderDiagram();
  }, [chart, id]);

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-4 mb-4">
        <p className="text-red-400 text-sm">Mermaid Error: {error}</p>
        <pre className="mt-2 text-xs text-zinc-400 overflow-x-auto">{chart}</pre>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="my-6 flex justify-center bg-zinc-900/50 rounded-2xl p-6 border border-zinc-700/50 overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

interface MarkdownProps {
  children: string;
  className?: string;
  compact?: boolean;
}

export function Markdown({ children, className, compact = false }: MarkdownProps) {
  return (
    <div className={cn("prose prose-invert max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
        // Headings
        h1: ({ children }) => (
          <h1 className={cn("text-3xl font-bold text-foreground mb-4", compact && "text-2xl mb-2")}>
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className={cn("text-2xl font-semibold text-foreground mb-3", compact && "text-xl mb-2")}>
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className={cn("text-xl font-semibold text-foreground mb-2", compact && "text-lg mb-1")}>
            {children}
          </h3>
        ),
        // Paragraphs
        p: ({ children }) => (
          <p className={cn("text-muted-foreground leading-relaxed mb-4", compact && "mb-2 text-base")}>
            {children}
          </p>
        ),
        // Lists
        ul: ({ children }) => (
          <ul className={cn("space-y-2 mb-4 list-none", compact && "space-y-1 mb-2")}>
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className={cn("space-y-2 mb-4 list-decimal list-inside", compact && "space-y-1 mb-2")}>
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="flex items-start gap-2 text-muted-foreground">
            <span className="text-violet-400 mt-1.5">•</span>
            <span>{children}</span>
          </li>
        ),
        // Code - with Mermaid support
        code: ({ className, children, ...props }) => {
          const isMermaid = className?.includes("language-mermaid");
          const isInline = !className;
          
          if (isMermaid) {
            const chart = String(children).replace(/\n$/, "");
            return <MermaidDiagram chart={chart} />;
          }
          
          if (isInline) {
            return (
              <code className="px-1.5 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono text-sm">
                {children}
              </code>
            );
          }
          return (
            <code className={cn("font-mono text-sm", className)} {...props}>
              {children}
            </code>
          );
        },
        pre: ({ children, ...props }) => {
          // Check if child is a mermaid diagram (already rendered)
          const child = children as React.ReactElement<{ className?: string }>;
          if (child?.props?.className?.includes("language-mermaid")) {
            return <>{children}</>;
          }
          return (
            <pre className="bg-zinc-900 rounded-xl p-4 overflow-x-auto border border-zinc-700/50 mb-4" {...props}>
              {children}
            </pre>
          );
        },
        // Blockquote
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-violet-500/50 pl-4 italic text-muted-foreground my-4">
            {children}
          </blockquote>
        ),
        // Strong and emphasis
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-violet-300">{children}</em>
        ),
        // Links
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-violet-400 hover:text-violet-300 underline underline-offset-2"
          >
            {children}
          </a>
        ),
        // Tables
        table: ({ children }) => (
          <div className="overflow-x-auto mb-4">
            <table className="w-full border-collapse">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-zinc-800/50">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="border border-zinc-700 px-4 py-2 text-left font-semibold">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-zinc-700 px-4 py-2">{children}</td>
        ),
        // Horizontal rule
        hr: () => <hr className="border-zinc-700 my-6" />,
        // Images (for diagrams)
        img: ({ src, alt }) => (
          <div className="my-6 rounded-2xl overflow-hidden border border-zinc-700/50 bg-zinc-900/50 p-4">
            <img 
              src={src} 
              alt={alt || ""} 
              className="w-full max-w-2xl mx-auto rounded-lg"
              loading="lazy"
            />
            {alt && (
              <p className="text-center text-sm text-muted-foreground mt-2 italic">{alt}</p>
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

