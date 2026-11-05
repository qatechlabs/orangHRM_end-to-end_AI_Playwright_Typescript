/**
 * Converts the BRD Word documents in requirements/brd/ into Markdown in requirements/md/
 * so the AI agents can read, grep and cite requirement IDs precisely.
 *   npm run brd:md                -> all modules
 *   npm run brd:md -- PIM Leave   -> selected modules
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import mammoth from 'mammoth';

const SRC = path.resolve('requirements/brd');
const OUT = path.resolve('requirements/md');

async function main() {
  const only = process.argv.slice(2).map((m) => m.toLowerCase());
  fs.mkdirSync(OUT, { recursive: true });
  const files = fs.readdirSync(SRC).filter((f) => f.endsWith('.docx'));
  for (const file of files) {
    const module = file.replace(/^OrangeHRM_BRD_/, '').replace(/\.docx$/, '');
    if (only.length && !only.includes(module.toLowerCase())) continue;
    // mammoth's markdown writer is deprecated but keeps tables as text rows, which is what we need.
    const { value, messages } = await (
      mammoth as unknown as {
        convertToMarkdown: (i: {
          path: string;
        }) => Promise<{ value: string; messages: { message: string }[] }>;
      }
    ).convertToMarkdown({ path: path.join(SRC, file) });
    const md = value
      .replace(/\\([-.()#+!_*[\]])/g, '$1') // drop over-escaping
      .replace(/\n{3,}/g, '\n\n');
    const target = path.join(OUT, `${module.toLowerCase()}.md`);
    fs.writeFileSync(
      target,
      `<!-- Generated from requirements/brd/${file} by scripts/brd-to-md.ts. Do not edit. -->\n\n${md}`,
    );
    console.log(
      `${file} -> ${path.relative(process.cwd(), target)}${messages.length ? ` (${messages.length} warnings)` : ''}`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
