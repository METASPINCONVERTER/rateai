/**
 * Rate AI — Add a tool
 *
 * The form is plain HTML; this module validates it, mirrors it into a live card
 * preview, and catches the one mistake that matters — submitting a tool that is
 * already listed — before the write rather than after it.
 */

import { initShell, toast, setBusy } from '../shell.js';
import { isMock, loadTools, publishTool } from '../store.js';
import { failureMessage } from '../errors.js';
import { toolCard, emptyState, hydrateMarks } from '../components.js';
import {
  esc,
  formatExact,
  cleanDomain,
  isValidDomain,
  toolHref,
  getParams,
  debounce,
  describedBy,
} from '../util.js';

initShell({ isMock });

const el = {
  form: document.querySelector('[data-submit-form]'),
  name: document.querySelector('#tl-name'),
  domain: document.querySelector('#tl-domain'),
  category: document.querySelector('#tl-category'),
  description: document.querySelector('#tl-description'),
  descriptionCount: document.querySelector('[data-description-count]'),
  company: document.querySelector('#tl-company'),
  founded: document.querySelector('#tl-founded'),
  submit: document.querySelector('[data-submit-tool]'),
  preview: document.querySelector('[data-preview]'),
  done: document.querySelector('[data-done]'),
};

const FIELDS = ['name', 'domain', 'category', 'description', 'founded'];
const DESCRIPTION_MIN = 20;
const EARLIEST_YEAR = 1970;
const thisYear = new Date().getFullYear();

let tools = [];

el.founded.max = String(thisYear);

/* ==========================================================================
   Errors
   ========================================================================== */

/**
 * `html` is only ever passed a string this module built from escaped values —
 * the duplicate message needs a link in it, and nothing else does.
 */
function fieldError(key, content, { html = false } = {}) {
  const holder = el.form.querySelector(`[data-error-for="${key}"]`);
  if (!holder) return;

  holder.hidden = !content;
  const slot = holder.querySelector('[data-error-text]');
  if (!slot) return;

  if (html) slot.innerHTML = content;
  else slot.textContent = content ?? '';

  const input = el[key];
  if (input) {
    if (content) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
    /* The id is minted here rather than written into the markup, so the one
       string that has to match — data-error-for — is the only one there is. */
    if (!holder.id) holder.id = `err-${key}`;
    describedBy(input, holder.id, Boolean(content));
  }
}

function clearErrors() {
  FIELDS.forEach((key) => fieldError(key, ''));
}

/* ==========================================================================
   Live preview — the same card component the catalogue uses, so what you see
   here is literally what gets listed.
   ========================================================================== */

function draft() {
  const name = el.name.value.trim();
  const domain = cleanDomain(el.domain.value);
  const pricing = el.form.querySelector('input[name="pricing"]:checked')?.value ?? 'Freemium';

  return {
    name: name || 'Your tool',
    domain: domain || 'example.com',
    category: el.category.value || 'Other',
    pricing: [pricing],
    description: el.description.value.trim(),
    company: el.company.value.trim() || name,
    website: domain ? `https://${domain}` : '',
    avgRating: 0,
    totalRatings: 0,
    totalReviews: 0,
    verified: false,
  };
}

function renderPreview(tool = draft()) {
  el.preview.innerHTML = toolCard(tool);
  /* Only chase a favicon once the domain could plausibly resolve — otherwise
     every keystroke fires a request for a domain that does not exist yet. */
  if (isValidDomain(tool.domain)) hydrateMarks(el.preview);
}

/* ==========================================================================
   Duplicates
   ========================================================================== */

const findTool = (domain) => tools.find((t) => t.domain === domain) ?? null;

function duplicateMessage(existing) {
  return (
    `${esc(existing.name)} is already listed. ` +
    `<a class="link" href="${esc(toolHref(existing.domain, existing.name))}">Open it</a> to rate it instead.`
  );
}

/** Called as the domain is typed, so the clash surfaces before the submit. */
function checkDuplicate() {
  const domain = cleanDomain(el.domain.value);
  if (!domain) return null;

  const existing = findTool(domain);
  if (existing) fieldError('domain', duplicateMessage(existing), { html: true });
  return existing;
}

/* ==========================================================================
   Validation
   ========================================================================== */

function validate() {
  clearErrors();

  const name = el.name.value.trim();
  const domain = cleanDomain(el.domain.value);
  const description = el.description.value.trim();
  const founded = el.founded.value.trim();
  let firstBad = null;

  if (!name) {
    fieldError('name', 'A name is required — whatever the tool calls itself.');
    firstBad = 'name';
  }

  if (!domain) {
    fieldError('domain', 'A website is required so the listing points somewhere.');
    firstBad = firstBad ?? 'domain';
  } else if (!isValidDomain(domain)) {
    fieldError('domain', `“${domain}” is not a domain. It should look like example.com.`);
    firstBad = firstBad ?? 'domain';
  } else if (findTool(domain)) {
    fieldError('domain', duplicateMessage(findTool(domain)), { html: true });
    firstBad = firstBad ?? 'domain';
  }

  if (!el.category.value) {
    fieldError('category', 'Pick the category it belongs in.');
    firstBad = firstBad ?? 'category';
  }

  /* The old form required this too. A catalogue entry with no description is
     a dead end for the next reader, and the tool page has to fall back to
     "no description has been added", which is a listing that failed. */
  if (description.length < DESCRIPTION_MIN) {
    fieldError(
      'description',
      description
        ? `A little more — ${DESCRIPTION_MIN} characters at least, so the entry says something.`
        : 'A one-line description is required. It is the only thing most readers will read.',
    );
    firstBad = firstBad ?? 'description';
  }

  if (founded) {
    const year = Number(founded);
    if (!Number.isInteger(year) || year < EARLIEST_YEAR || year > thisYear) {
      fieldError('founded', `A four-digit year between ${EARLIEST_YEAR} and ${thisYear}.`);
      firstBad = firstBad ?? 'founded';
    }
  }

  return firstBad;
}

/* ==========================================================================
   Success
   ========================================================================== */

function showDone(tool) {
  el.form.hidden = true;
  el.done.hidden = false;
  el.done.innerHTML = emptyState({
    mark: 'checkCircle',
    title: `${tool.name} is listed`,
    text: 'It starts with no score. The first rating can be yours.',
    actions:
      `<a class="btn btn-primary btn-sm" href="${esc(toolHref(tool.domain, tool.name))}">Rate it now</a>` +
      `<a class="btn btn-secondary btn-sm" href="explore.html">Back to all tools</a>` +
      `<button class="btn btn-ghost btn-sm" type="button" data-again>Add another</button>`,
  });

  /* Focus follows the content that replaced the form, or a keyboard reader is
     left at a submit button that no longer exists. */
  const heading = el.done.querySelector('.empty-title');
  if (heading) {
    heading.tabIndex = -1;
    heading.focus();
  }

  renderPreview(tool);
}

function reset() {
  el.done.hidden = true;
  el.done.innerHTML = '';
  el.form.hidden = false;
  el.form.reset();
  clearErrors();
  el.descriptionCount.textContent = '0';
  renderPreview();
  el.name.focus();
}

/* ==========================================================================
   Submit
   ========================================================================== */

async function onSubmit(event) {
  event.preventDefault();

  const firstBad = validate();
  if (firstBad) {
    el[firstBad].focus();
    return;
  }

  setBusy(el.submit, true, 'Publishing…');

  try {
    const { tool } = await publishTool({
      name: el.name.value.trim(),
      domain: cleanDomain(el.domain.value),
      category: el.category.value,
      pricing: [el.form.querySelector('input[name="pricing"]:checked')?.value ?? 'Freemium'],
      description: el.description.value.trim(),
      company: el.company.value.trim(),
      founded: el.founded.value.trim(),
    });

    tools = [tool, ...tools];
    showDone(tool);
    toast(`${tool.name} added to the catalogue.`, 'success');
  } catch (error) {
    /* A clash that only shows up at write time belongs on the field, not in a
       toast that disappears. The paragraph is role="alert", so it announces. */
    if (error?.kind === 'duplicate') {
      const existing = findTool(cleanDomain(el.domain.value));
      fieldError(
        'domain',
        existing ? duplicateMessage(existing) : esc(error.message),
        { html: true },
      );
      el.domain.focus();
    } else {
      toast(failureMessage(error, 'the listing'), 'error', 7000);
    }
  } finally {
    setBusy(el.submit, false);
  }
}

/* ==========================================================================
   Wiring
   ========================================================================== */

const previewSoon = debounce(() => renderPreview(), 200);

el.form.addEventListener('input', (event) => {
  previewSoon();

  if (event.target === el.description) {
    el.descriptionCount.textContent = formatExact(el.description.value.length);
  }

  /* Clear a field's complaint as soon as it is being addressed. The domain has
     its own handler below, because clearing it also means re-checking it. */
  const key = FIELDS.find((k) => el[k] === event.target);
  if (key && key !== 'domain') fieldError(key, '');
});

el.domain.addEventListener(
  'input',
  debounce(() => {
    fieldError('domain', '');
    checkDuplicate();
  }, 300),
);

el.form.addEventListener('submit', onSubmit);

el.done.addEventListener('click', (event) => {
  if (event.target.closest('[data-again]')) reset();
});

/* ==========================================================================
   Start
   ========================================================================== */

function prefill() {
  const params = getParams();
  const domain = cleanDomain(params.get('domain') ?? '');
  const name = (params.get('name') ?? '').trim().slice(0, 60);

  if (domain) el.domain.value = domain;
  if (name) el.name.value = name;

  /* Land on whichever field the referring page could not fill in. */
  if (name && !domain) el.domain.focus({ preventScroll: true });
  else if (domain) el.name.focus({ preventScroll: true });
}

async function start() {
  prefill();
  renderPreview();

  try {
    tools = await loadTools();
    if (el.domain.value) checkDuplicate();
  } catch {
    /* Without the catalogue we cannot warn early. publishTool still refuses a
       duplicate at write time, so the guarantee holds — only the warning moves. */
    tools = [];
  }
}

start();
