// A small, safe markdown → HTML renderer for engine reports. Covers what the
// engines actually emit: GFM tables, headings, bold/italic/code, links, and
// bullet/ordered lists. Everything is HTML-escaped first, so AI/web content
// can't inject markup.

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function inline(s: string): string {
  let t = esc(s);
  t = t.replace(/`([^`]+)`/g, "<code>$1</code>");
  t = t.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  t = t.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  t = t.replace(/\b(https?:\/\/[^\s<)]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
  t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  return t;
}

const cells = (row: string): string[] =>
  row.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map((c) => c.trim());

export function renderMarkdown(md: string): string {
  const lines = (md || "").replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;
  let para: string[] = [];
  const flushPara = () => {
    if (para.length) {
      out.push(`<p>${para.map(inline).join("<br/>")}</p>`);
      para = [];
    }
  };

  while (i < lines.length) {
    const line = lines[i];

    // table: header row + |---| separator
    if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|?[\s:-]*-[-\s:|]*\|?\s*$/.test(lines[i + 1])) {
      flushPara();
      const header = cells(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) {
        rows.push(cells(lines[i]));
        i++;
      }
      const thead = `<thead><tr>${header.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead>`;
      const tbody = `<tbody>${rows
        .map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`)
        .join("")}</tbody>`;
      out.push(`<div class="md-table"><table>${thead}${tbody}</table></div>`);
      continue;
    }

    // heading
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      flushPara();
      const lvl = Math.min(h[1].length + 1, 6);
      out.push(`<h${lvl}>${inline(h[2])}</h${lvl}>`);
      i++;
      continue;
    }

    // bullet list
    if (/^\s*[-*]\s+/.test(line)) {
      flushPara();
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^\s*[-*]\s+/, ""))}</li>`);
        i++;
      }
      out.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    // ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      flushPara();
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(`<li>${inline(lines[i].replace(/^\s*\d+\.\s+/, ""))}</li>`);
        i++;
      }
      out.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    // blank line ends a paragraph
    if (/^\s*$/.test(line)) {
      flushPara();
      i++;
      continue;
    }

    para.push(line.trim());
    i++;
  }
  flushPara();
  return out.join("\n");
}
