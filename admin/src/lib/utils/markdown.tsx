import React from "react";

function inlineFormat(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  const re = /(`[^`]+`)|(\*\*\*([^*]+)\*\*\*)|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(_([^_]+)_)|(\[([^\]]+)\]\(([^)]+)\))/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > cursor) parts.push(text.slice(cursor, m.index));
    if (m[1]) parts.push(<code key={m.index} className="px-1.5 py-0.5 bg-zinc-100 text-rose-600 rounded text-[0.85em] font-mono">{m[1].slice(1, -1)}</code>);
    else if (m[2]) parts.push(<strong key={m.index} className="font-bold italic text-zinc-900">{m[3]}</strong>);
    else if (m[4]) parts.push(<strong key={m.index} className="font-bold text-zinc-900">{m[5]}</strong>);
    else if (m[6]) parts.push(<em key={m.index} className="italic text-zinc-600">{m[7]}</em>);
    else if (m[8]) parts.push(<em key={m.index} className="italic text-zinc-600">{m[9]}</em>);
    else if (m[10]) parts.push(<a key={m.index} href={m[12]} className="text-indigo-600 underline underline-offset-2 hover:text-indigo-800 transition-colors" target="_blank" rel="noopener noreferrer">{m[11]}</a>);
    cursor = m.index + m[0].length;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts.length === 1 && typeof parts[0] === "string" ? text : <>{parts}</>;
}

export function renderMarkdown(md: string): React.ReactNode[] {
  if (!md) return [];
  const lines = md.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trimStart().startsWith("```")) {
      const lang = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trimStart().startsWith("```")) { codeLines.push(lines[i]); i++; }
      nodes.push(<div key={`cb${i}`} className="my-6 rounded-2xl overflow-hidden border border-zinc-200 shadow-xl text-sm"><div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900"><div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400/80" /><span className="w-2.5 h-2.5 rounded-full bg-amber-400/80" /><span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" /></div>{lang && <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{lang}</span>}</div><pre className="bg-zinc-950 px-5 py-5 overflow-x-auto font-mono leading-relaxed text-zinc-300"><code>{codeLines.join("\n")}</code></pre></div>);
      i++; continue;
    }
    if (line.startsWith(">")) {
      const bqLines: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) { bqLines.push(lines[i].slice(1).trimStart()); i++; }
      nodes.push(<blockquote key={`bq${i}`} className="my-6 pl-6 border-l-4 border-zinc-900 italic text-zinc-600 leading-relaxed text-lg space-y-2">{bqLines.map((l, idx) => <p key={idx}>{inlineFormat(l)}</p>)}</blockquote>);
      continue;
    }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) { nodes.push(<hr key={`hr${i}`} className="my-10 border-zinc-200" />); i++; continue; }
    const hm = line.match(/^(#{1,6})\s+(.+)/);
    if (hm) {
      const level = hm[1].length; const text = hm[2];
      const styles = ["", "text-4xl font-black text-zinc-900 mt-12 mb-6 tracking-tighter leading-tight", "text-2xl font-black text-zinc-900 mt-10 mb-4 tracking-tight", "text-xl font-bold text-zinc-800 mt-8 mb-3", "text-lg font-bold text-zinc-800 mt-6 mb-2", "text-base font-bold text-zinc-700 mt-4 mb-2", "text-sm font-bold text-zinc-600 mt-3 mb-1"];
      const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4";
      nodes.push(<Tag key={`h${i}`} className={styles[level]}>{inlineFormat(text)}</Tag>);
      i++; continue;
    }
    if (line.includes("|") && lines[i + 1]?.match(/^\s*\|?[\s\-|:]+\|?\s*$/)) {
      const headerCells = line.split("|").map(c => c.trim()).filter(Boolean); i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes("|")) { rows.push(lines[i].split("|").map(c => c.trim()).filter(Boolean)); i++; }
      nodes.push(<div key={`tbl${i}`} className="my-8 overflow-x-auto rounded-2xl border border-zinc-200 shadow-sm"><table className="w-full text-sm"><thead className="bg-zinc-50 border-b border-zinc-200"><tr>{headerCells.map((c, idx) => <th key={idx} className="px-5 py-4 text-left text-[10px] font-black text-zinc-400 uppercase tracking-widest">{inlineFormat(c)}</th>)}</tr></thead><tbody className="divide-y divide-zinc-100">{rows.map((row, ridx) => <tr key={ridx} className="hover:bg-zinc-50/50 transition-colors">{row.map((cell, cidx) => <td key={cidx} className="px-5 py-4 text-zinc-700">{inlineFormat(cell)}</td>)}</tr>)}</tbody></table></div>);
      continue;
    }
    if (/^\s*[-*+]\s/.test(line)) {
      const items: Array<{ text: string; depth: number }> = [];
      while (i < lines.length && /^\s*[-*+]\s/.test(lines[i])) { const depth = lines[i].search(/\S/); items.push({ text: lines[i].replace(/^\s*[-*+]\s/, ""), depth }); i++; }
      nodes.push(<ul key={`ul${i}`} className="my-6 space-y-3">{items.map((it, idx) => <li key={idx} className="flex gap-4 text-zinc-700 leading-relaxed" style={{ paddingLeft: it.depth * 16 }}><span className="mt-2.5 w-1.5 h-1.5 rounded-full bg-zinc-900 shrink-0" /><span>{inlineFormat(it.text)}</span></li>)}</ul>);
      continue;
    }
    const imgM = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgM) { nodes.push(<figure key={`fig${i}`} className="my-10"><img src={imgM[2]} alt={imgM[1]} className="w-full rounded-[2.5rem] border border-zinc-200 shadow-2xl" />{imgM[1] && <figcaption className="mt-4 text-center text-[10px] font-black uppercase tracking-widest text-zinc-400 italic">{imgM[1]}</figcaption>}</figure>); i++; continue; }
    if (line.trim() === "") { i++; continue; }
    const paraLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" && !lines[i].match(/^#{1,6}\s/) && !lines[i].startsWith(">") && !lines[i].startsWith("```") && !/^\s*[-*+]\s/.test(lines[i])) { paraLines.push(lines[i]); i++; }
    if (paraLines.length) nodes.push(<p key={`p${i}`} className="my-6 text-zinc-700 leading-[1.8] text-lg font-medium">{inlineFormat(paraLines.join(" "))}</p>);
  }
  return nodes;
}
