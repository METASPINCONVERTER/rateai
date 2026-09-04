import fs from 'node:fs';
import path from 'node:path';

const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));
console.log('HTML files to update:', files);

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Update nav-links
  if (!content.includes('href="pricing/index.html"') && !content.includes('href="index.html" aria-current="page">AI Pricing')) {
    content = content.replace(
      /(<nav class="nav-links" aria-label="Primary">[\s\S]*?)(<\/nav>)/,
      (match, p1, p2) => {
        if (p1.includes('pricing/index.html')) return match;
        const isPricing = file === 'pricing.html' ? ' aria-current="page"' : '';
        return `${p1.trimEnd()}\n      <a class="nav-link" href="pricing/index.html"${isPricing}>AI Pricing</a>\n    ${p2}`;
      }
    );

    // Update tabbar
    content = content.replace(
      /(<nav class="tabbar" aria-label="Primary">[\s\S]*?)(<\/nav>)/,
      (match, p1, p2) => {
        if (p1.includes('pricing/index.html')) return match;
        const isPricing = file === 'pricing.html' ? ' aria-current="page"' : '';
        const item = `  <a class="tabbar-link" href="pricing/index.html"${isPricing}>\n    <span data-icon="sparkles" data-icon-size="md"></span>Pricing\n  </a>\n`;
        return `${p1.trimEnd()}\n${item}${p2}`;
      }
    );

    fs.writeFileSync(file, content, 'utf8');
    console.log('✓ Updated nav & tabbar in:', file);
  }
}
