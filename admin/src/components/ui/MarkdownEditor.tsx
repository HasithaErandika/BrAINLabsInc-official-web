/* eslint-disable react-hooks/refs */
import { useRef, useCallback, useEffect, useState, useMemo } from "react";
import {
  Bold, Italic, Code, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Minus, Link2, Eye, Edit3,
  AlignLeft, CornerDownLeft,
} from "lucide-react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  /** Number of visible lines in editor, default 20 */
  minLines?: number;
}

// ─── Syntax highlighting classes (lightweight, no deps) ──────────────────────
function highlight(raw: string): { html: string } {
  if (!raw) return { html: "" };
  const escaped = raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const html = escaped
    // Headings
    .replace(/^(#{1,6}) (.+)$/gm, (_, hashes, text) =>
      `<span class="md-h">${hashes} ${text}</span>`)
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<span class=\"md-bold\">**$1**</span>")
    // Italic
    .replace(/\*(.+?)\*/g, "<span class=\"md-em\">*$1*</span>")
    // Inline code
    .replace(/`([^`]+)`/g, "<span class=\"md-code\">`$1`</span>")
    // Blockquote
    .replace(/^(&gt; .+)$/gm, "<span class=\"md-quote\">$1</span>")
    // Horizontal rule
    .replace(/^---$/gm, "<span class=\"md-hr\">---</span>")
    // Unordered list
    .replace(/^([-*+] .+)$/gm, "<span class=\"md-li\">$1</span>")
    // Ordered list
    .replace(/^(\d+\. .+)$/gm, "<span class=\"md-li\">$1</span>")
    // Links
    .replace(/\[(.+?)\]\((.+?)\)/g, "<span class=\"md-link\">[$1]($2)</span>");

  return { html };
}

// ─── Toolbar action ───────────────────────────────────────────────────────────
function wrap(
  textarea: HTMLTextAreaElement,
  value: string,
  onChange: (v: string) => void,
  prefix: string,
  suffix = "",
  placeholder = "text"
) {
  const { selectionStart: s, selectionEnd: e } = textarea;
  const selected = value.slice(s, e) || placeholder;
  const newVal = value.slice(0, s) + prefix + selected + suffix + value.slice(e);
  onChange(newVal);
  // Restore cursor after state update
  requestAnimationFrame(() => {
    textarea.focus();
    const newStart = s + prefix.length;
    const newEnd = newStart + selected.length;
    textarea.setSelectionRange(newStart, newEnd);
  });
}

function prependLine(
  textarea: HTMLTextAreaElement,
  value: string,
  onChange: (v: string) => void,
  linePrefix: string
) {
  const { selectionStart: s } = textarea;
  const lineStart = value.lastIndexOf("\n", s - 1) + 1;
  const newVal = value.slice(0, lineStart) + linePrefix + value.slice(lineStart);
  onChange(newVal);
  requestAnimationFrame(() => {
    textarea.focus();
    const newPos = s + linePrefix.length;
    textarea.setSelectionRange(newPos, newPos);
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Start writing...",
  label,
  minLines = 20,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [lineCount, setLineCount] = useState(1);

  // Sync scroll between textarea and highlight backdrop
  const handleScroll = useCallback(() => {
    if (backdropRef.current && textareaRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  // Keep line count updated
  useEffect(() => {
    setLineCount((value || "").split("\n").length);
  }, [value]);

  const toolbar = useMemo(() => [
    {
      group: "heading",
      items: [
        { icon: Heading1, label: "H1", action: () => prependLine(textareaRef.current!, value, onChange, "# ") },
        { icon: Heading2, label: "H2", action: () => prependLine(textareaRef.current!, value, onChange, "## ") },
        { icon: Heading3, label: "H3", action: () => prependLine(textareaRef.current!, value, onChange, "### ") },
      ],
    },
    {
      group: "inline",
      items: [
        { icon: Bold, label: "Bold", action: () => wrap(textareaRef.current!, value, onChange, "**", "**", "bold text") },
        { icon: Italic, label: "Italic", action: () => wrap(textareaRef.current!, value, onChange, "*", "*", "italic text") },
        { icon: Code, label: "Code", action: () => wrap(textareaRef.current!, value, onChange, "`", "`", "code") },
      ],
    },
    {
      group: "block",
      items: [
        { icon: List, label: "Bullet list", action: () => prependLine(textareaRef.current!, value, onChange, "- ") },
        { icon: ListOrdered, label: "Ordered list", action: () => prependLine(textareaRef.current!, value, onChange, "1. ") },
        { icon: Quote, label: "Blockquote", action: () => prependLine(textareaRef.current!, value, onChange, "> ") },
        {
          icon: Minus, label: "Divider", action: () => {
            const { selectionStart: s } = textareaRef.current!;
            const newVal = value.slice(0, s) + "\n\n---\n\n" + value.slice(s);
            onChange(newVal);
          }
        },
      ],
    },
    {
      group: "misc",
      items: [
        { icon: Link2, label: "Link", action: () => wrap(textareaRef.current!, value, onChange, "[", "](url)", "link text") },
        {
          icon: CornerDownLeft, label: "Line break", action: () => {
            const ta = textareaRef.current!;
            const { selectionStart: s } = ta;
            const newVal = value.slice(0, s) + "\n" + value.slice(s);
            onChange(newVal);
            requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(s + 1, s + 1); });
          }
        },
      ],
    },
  ], [value, onChange]);

  // Enhanced Tab key handling
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const { selectionStart: s, selectionEnd: end } = e.currentTarget;
      const newVal = value.slice(0, s) + "  " + value.slice(end);
      onChange(newVal);
      requestAnimationFrame(() => { 
        textareaRef.current?.focus(); 
        textareaRef.current?.setSelectionRange(s + 2, s + 2); 
      });
    }
  }, [value, onChange]);

  const { html: highlighted } = highlight(value || "");
  const rows = Math.max(minLines, lineCount + 2);

  return (
    <div className="flex flex-col w-full rounded-2xl overflow-hidden border border-zinc-200 bg-white shadow-sm">
      {/* ── Header bar ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-50 border-b border-zinc-200">
        {label && (
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">{label}</span>
        )}
        <div className="flex items-center gap-1 ml-auto">
          <button
            type="button"
            onClick={() => setMode("write")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${mode === "write"
                ? "bg-white text-zinc-900 shadow-sm border border-zinc-200"
                : "text-zinc-500 hover:text-zinc-700"
              }`}
          >
            <Edit3 size={12} /> Write
          </button>
          <button
            type="button"
            onClick={() => setMode("preview")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${mode === "preview"
                ? "bg-white text-zinc-900 shadow-sm border border-zinc-200"
                : "text-zinc-500 hover:text-zinc-700"
              }`}
          >
            <Eye size={12} /> Preview
          </button>
        </div>
      </div>

      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      {mode === "write" && (
        <div className="flex items-center flex-wrap gap-px px-3 py-2 bg-white border-b border-zinc-100">
          {toolbar.map((group, gi) => (
            <div key={gi} className={`flex items-center gap-px ${gi < toolbar.length - 1 ? "pr-2 mr-1 border-r border-zinc-150" : ""}`}>
              {group.items.map(({ icon: Icon, label: lbl, action }) => (
                <button
                  key={lbl}
                  type="button"
                  title={lbl}
                  onMouseDown={(e) => { e.preventDefault(); action(); }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-all"
                >
                  <Icon size={14} strokeWidth={2} />
                </button>
              ))}
            </div>
          ))}
          <div className="ml-auto flex items-center gap-1.5 text-[10px] text-zinc-300 font-mono pr-1">
            <AlignLeft size={11} />
            {lineCount} line{lineCount !== 1 ? "s" : ""}
          </div>
        </div>
      )}

      {/* ── Editor area ─────────────────────────────────────────────── */}
      {mode === "write" ? (
        <div className="relative flex flex-1">
          {/* Line numbers */}
          <div
            aria-hidden
            className="select-none shrink-0 w-10 text-right pr-3 pt-4 pb-4 text-[11px] font-mono text-zinc-300 bg-zinc-50 border-r border-zinc-100 leading-[1.75rem] overflow-hidden"
            style={{ minHeight: `${rows * 1.75}rem` }}
          >
            {Array.from({ length: Math.max(lineCount, minLines) }).map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          {/* Highlight backdrop */}
          <div
            ref={backdropRef}
            aria-hidden
            className="absolute top-0 left-10 right-0 bottom-0 overflow-hidden pointer-events-none"
          >
            <div
              className="px-4 pt-4 pb-4 font-mono text-sm leading-7 whitespace-pre-wrap break-words text-transparent"
              dangerouslySetInnerHTML={{ __html: highlighted }}
              style={{ minHeight: `${rows * 1.75}rem` }}
            />
          </div>

          {/* Actual textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            spellCheck
            className="relative z-10 flex-1 w-full px-4 pt-4 pb-4 font-mono text-sm leading-7 text-zinc-900 bg-transparent resize-none outline-none placeholder:text-zinc-300 caret-zinc-900"
            style={{
              minHeight: `${rows * 1.75}rem`,
              caretColor: "#09090b",
            }}
          />
        </div>
      ) : (
        /* ── Preview ────────────────────────────────────────────────── */
        <div className="px-8 py-6 prose prose-zinc max-w-none min-h-[20rem] bg-white overflow-y-auto">
          {value?.trim() ? (
            <MarkdownPreview source={value} />
          ) : (
            <p className="text-zinc-300 italic text-sm">Nothing to preview yet.</p>
          )}
        </div>
      )}

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <div className="px-4 py-2 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
        <p className="text-[10px] text-zinc-400 font-medium">
          Markdown supported · <kbd className="px-1 py-0.5 bg-zinc-200 rounded text-[9px]">Tab</kbd> for indent
        </p>
        <p className="text-[10px] text-zinc-400 font-mono">
          {(value || "").length.toLocaleString()} chars
        </p>
      </div>

      <MarkdownStyles />
    </div>
  );
}

// ─── Lightweight preview renderer (no @uiw dep issues) ───────────────────────
function MarkdownPreview({ source }: { source: string }) {
  // Simple line-by-line renderer for preview
  const lines = source.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (/^#{1,6} /.test(line)) {
      const level = (line.match(/^#+/)![0].length) as 1 | 2 | 3 | 4 | 5 | 6;
      const text = line.replace(/^#+\s/, "");
      const headingTags: Record<number, React.ElementType> = { 1: 'h1', 2: 'h2', 3: 'h3', 4: 'h4', 5: 'h5', 6: 'h6' };
      const Tag = headingTags[level] ?? 'p';
      const sizeClass = ['', 'text-2xl font-black', 'text-xl font-bold', 'text-lg font-bold', 'text-base font-semibold', 'text-sm font-semibold', 'text-sm font-medium'][level] ?? '';
      elements.push(<Tag key={i} className={`text-zinc-900 mt-4 mb-1 ${sizeClass}`}>{text}</Tag>);
    } else if (/^---$/.test(line)) {
      elements.push(<hr key={i} className="my-6 border-zinc-200" />);
    } else if (/^> /.test(line)) {
      elements.push(
        <blockquote key={i} className="border-l-4 border-zinc-400 pl-4 my-3 italic text-zinc-600">
          {line.replace(/^> /, "")}
        </blockquote>
      );
    } else if (/^[-*+] /.test(line)) {
      // Collect list items
      const items: string[] = [];
      while (i < lines.length && /^[-*+] /.test(lines[i])) {
        items.push(lines[i].replace(/^[-*+] /, ""));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc list-inside space-y-1 my-3 text-sm text-zinc-700">
          {items.map((t, j) => <li key={j}>{inlineFormat(t)}</li>)}
        </ul>
      );
      continue;
    } else if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ""));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="list-decimal list-inside space-y-1 my-3 text-sm text-zinc-700">
          {items.map((t, j) => <li key={j}>{inlineFormat(t)}</li>)}
        </ol>
      );
      continue;
    } else if (line.startsWith("```")) {
      // Code block
      const _lang = line.slice(3); void _lang;
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={i} className="bg-zinc-900 text-zinc-100 rounded-xl p-4 my-4 overflow-x-auto text-sm font-mono">
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-3" />);
    } else {
      elements.push(<p key={i} className="text-sm text-zinc-700 leading-relaxed mb-3">{inlineFormat(line)}</p>);
    }
    i++;
  }

  return <>{elements}</>;
}

function inlineFormat(text: string): React.ReactNode {
  // Bold → em → code → links
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    if (/^\*\*(.+)\*\*$/.test(part)) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (/^\*(.+)\*$/.test(part)) return <em key={i}>{part.slice(1, -1)}</em>;
    if (/^`(.+)`$/.test(part)) return <code key={i} className="bg-zinc-100 text-zinc-800 rounded px-1.5 py-0.5 text-[0.82em] font-mono">{part.slice(1, -1)}</code>;
    const linkMatch = part.match(/^\[(.+)\]\((.+)\)$/);
    if (linkMatch) return <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="underline text-zinc-700 hover:text-zinc-900">{linkMatch[1]}</a>;
    return part;
  });
}

// ─── Injected styles for syntax highlighting in the editor ───────────────────
function MarkdownStyles() {
  return (
    <style>{`
      .md-h    { color: #09090b; font-weight: 700; }
      .md-bold { color: #18181b; font-weight: 700; }
      .md-em   { color: #3f3f46; font-style: italic; }
      .md-code { color: #09090b; background: #f4f4f5; border-radius: 3px; padding: 0 3px; }
      .md-quote{ color: #71717a; font-style: italic; border-left: 3px solid #a1a1aa; padding-left: 8px; }
      .md-link { color: #09090b; text-decoration: underline; }
      .md-li   { color: #3f3f46; }
      .md-hr   { color: #d4d4d8; }
      textarea.md-editor-textarea { caret-color: #09090b !important; }
    `}</style>
  );
}
