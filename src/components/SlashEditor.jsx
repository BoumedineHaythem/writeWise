import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
} from 'react';
import styles from './SlashEditor.module.css';

/* ─────────────────────────────────────────────────────────────
   Block model
   A document is an array of blocks: { id, type, text }
   ───────────────────────────────────────────────────────────── */

export const BLOCK_TYPES = [
  { type: 'paragraph', title: 'Text', description: 'Just start writing with plain text', icon: 'Aa', aria: 'Paragraph', keywords: ['text', 'paragraph', 'plain', 'p'] },
  { type: 'h1', title: 'Heading 1', description: 'Large section heading', icon: 'H1', aria: 'Heading 1', keywords: ['h1', 'heading1', 'title', 'large'] },
  { type: 'h2', title: 'Heading 2', description: 'Medium section heading', icon: 'H2', aria: 'Heading 2', keywords: ['h2', 'heading2', 'subtitle', 'medium'] },
  { type: 'h3', title: 'Heading 3', description: 'Small section heading', icon: 'H3', aria: 'Heading 3', keywords: ['h3', 'heading3', 'small'] },
  { type: 'bullet', title: 'Bulleted list', description: 'Simple list with bullets', icon: '•', aria: 'Bulleted list item', keywords: ['bullet', 'list', 'ul', 'unordered'] },
  { type: 'numbered', title: 'Numbered list', description: 'List with numbering', icon: '1.', aria: 'Numbered list item', keywords: ['numbered', 'number', 'list', 'ol', 'ordered'] },
  { type: 'quote', title: 'Quote', description: 'Highlight a quote or idea', icon: '“', aria: 'Quote', keywords: ['quote', 'blockquote', 'citation'] },
];

// Markdown-style shortcuts: type "## " at the start of a text block
const SHORTCUTS = [
  { prefix: '### ', type: 'h3' },
  { prefix: '## ', type: 'h2' },
  { prefix: '# ', type: 'h1' },
  { prefix: '- ', type: 'bullet' },
  { prefix: '* ', type: 'bullet' },
  { prefix: '1. ', type: 'numbered' },
  { prefix: '> ', type: 'quote' },
];

const CONTINUES_ON_ENTER = ['bullet', 'numbered', 'quote'];

let blockCounter = 0;
export function createBlock(type = 'paragraph', text = '') {
  blockCounter += 1;
  return { id: `block-${blockCounter}-${Date.now().toString(36)}`, type, text };
}

export function createInitialBlocks() {
  return [createBlock()];
}

/** Plain text of the whole document (use it for word counts, saving, etc.) */
export function blocksToPlainText(blocks) {
  return blocks.map((b) => b.text).join('\n');
}

function filterItems(query) {
  const q = query.toLowerCase();
  if (!q) return BLOCK_TYPES;
  return BLOCK_TYPES.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.keywords.some((k) => k.startsWith(q))
  );
}

/* ─────────────────────────────────────────────────────────────
   One auto-growing textarea per block
   ───────────────────────────────────────────────────────────── */

function BlockInput({ block, register, className, ...props }) {
  const elRef = useRef(null);

  const resize = () => {
    const el = elRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  useLayoutEffect(resize, [block.text, block.type]);

  useEffect(() => {
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <textarea
      {...props}
      ref={(el) => {
        elRef.current = el;
        register(block.id, el);
      }}
      className={className}
      value={block.text}
      rows={1}
    />
  );
}

/* ─────────────────────────────────────────────────────────────
   Read-only rendering (used after submitting)
   ───────────────────────────────────────────────────────────── */

function StaticBlocks({ blocks }) {
  const out = [];
  const visible = blocks.filter((b) => b.text.trim() !== '');
  let i = 0;

  while (i < visible.length) {
    const b = visible[i];

    if (b.type === 'bullet' || b.type === 'numbered') {
      const Tag = b.type === 'bullet' ? 'ul' : 'ol';
      const items = [];
      while (i < visible.length && visible[i].type === b.type) {
        items.push(<li key={visible[i].id}>{visible[i].text}</li>);
        i += 1;
      }
      out.push(<Tag key={`list-${b.id}`} className={styles.staticList}>{items}</Tag>);
      continue;
    }

    // Headings sit below the page's own <h1>/<h2>, so they map to h3–h5
    if (b.type === 'h1') out.push(<h3 key={b.id} className={styles.staticH1}>{b.text}</h3>);
    else if (b.type === 'h2') out.push(<h4 key={b.id} className={styles.staticH2}>{b.text}</h4>);
    else if (b.type === 'h3') out.push(<h5 key={b.id} className={styles.staticH3}>{b.text}</h5>);
    else if (b.type === 'quote') out.push(<blockquote key={b.id} className={styles.staticQuote}>{b.text}</blockquote>);
    else out.push(<p key={b.id} className={styles.staticP}>{b.text}</p>);
    i += 1;
  }

  return <div className={styles.staticRoot}>{out}</div>;
}

/* ─────────────────────────────────────────────────────────────
   Editable editor
   ───────────────────────────────────────────────────────────── */

function EditableEditor({ id, label, value: blocks, onChange, placeholder, error, showHint, minHeight, fontSize }) {
  const [menu, setMenu] = useState(null); // { blockId, slashStart, query, index }
  const inputs = useRef(new Map());
  const pendingFocus = useRef(null);

  const labelId = `${id}-label`;
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const menuId = `${id}-menu`;
  const optionId = (type) => `${id}-option-${type}`;

  const register = useCallback((blockId, el) => {
    if (el) inputs.current.set(blockId, el);
    else inputs.current.delete(blockId);
  }, []);

  const focusLater = (blockId, pos) => {
    pendingFocus.current = { id: blockId, pos };
  };

  // Restore focus / caret after structural changes (split, merge, convert)
  useEffect(() => {
    const p = pendingFocus.current;
    if (!p) return;
    pendingFocus.current = null;
    const el = inputs.current.get(p.id);
    if (el) {
      el.focus();
      el.setSelectionRange(p.pos, p.pos);
    }
  });

  const menuItems = menu ? filterItems(menu.query) : [];
  const menuOpen = Boolean(menu) && menuItems.length > 0;

  // Keep the highlighted option visible while using the arrow keys
  useEffect(() => {
    if (!menuOpen) return;
    const item = menuItems[menu.index];
    if (item) {
      document.getElementById(optionId(item.type))?.scrollIntoView({ block: 'nearest' });
    }
  });

  const updateBlock = (blockId, patch) =>
    onChange(blocks.map((b) => (b.id === blockId ? { ...b, ...patch } : b)));

  const applyCommand = (blockId, type) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block || !menu) return;
    const before = block.text.slice(0, menu.slashStart);
    const after = block.text.slice(menu.slashStart + 1 + menu.query.length);
    const text = after ? before + after : before.trimEnd();
    updateBlock(blockId, { type, text });
    focusLater(blockId, text.length);
    setMenu(null);
  };

  const handleChange = (block, e) => {
    const value = e.target.value;
    const caret = e.target.selectionStart;

    // Markdown shortcuts, e.g. "## " → Heading 2
    if (block.type === 'paragraph') {
      const shortcut = SHORTCUTS.find(
        (s) => value.startsWith(s.prefix) && caret === s.prefix.length
      );
      if (shortcut) {
        updateBlock(block.id, { type: shortcut.type, text: value.slice(shortcut.prefix.length) });
        focusLater(block.id, 0);
        setMenu(null);
        return;
      }
    }

    updateBlock(block.id, { text: value });

    // Open / update the slash menu
    const match = /(?:^|\s)\/([a-z0-9]*)$/i.exec(value.slice(0, caret));
    if (match) {
      setMenu({
        blockId: block.id,
        slashStart: caret - match[1].length - 1,
        query: match[1],
        index: 0,
      });
    } else if (menu) {
      setMenu(null);
    }
  };

  const handleKeyDown = (block, index, e) => {
    const el = e.currentTarget;

    // ── Slash menu navigation ──
    if (menuOpen && menu.blockId === block.id) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMenu((m) => ({ ...m, index: (m.index + 1) % menuItems.length }));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMenu((m) => ({ ...m, index: (m.index - 1 + menuItems.length) % menuItems.length }));
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        applyCommand(block.id, menuItems[menu.index].type);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setMenu(null);
        return;
      }
    }

    if (e.nativeEvent.isComposing) return;

    // ── Enter: split block (Shift+Enter inserts a line break) ──
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();

      // Enter on an empty list/quote exits it
      if (block.text === '' && block.type !== 'paragraph') {
        updateBlock(block.id, { type: 'paragraph' });
        focusLater(block.id, 0);
        return;
      }

      const before = block.text.slice(0, el.selectionStart);
      const after = block.text.slice(el.selectionEnd);
      const next = createBlock(CONTINUES_ON_ENTER.includes(block.type) ? block.type : 'paragraph', after);
      onChange([
        ...blocks.slice(0, index),
        { ...block, text: before },
        next,
        ...blocks.slice(index + 1),
      ]);
      focusLater(next.id, 0);
      return;
    }

    // ── Backspace at the start: reset type, then merge with previous ──
    if (e.key === 'Backspace' && el.selectionStart === 0 && el.selectionEnd === 0) {
      if (block.type !== 'paragraph') {
        e.preventDefault();
        updateBlock(block.id, { type: 'paragraph' });
        focusLater(block.id, 0);
        return;
      }
      if (index > 0) {
        e.preventDefault();
        const prev = blocks[index - 1];
        onChange([
          ...blocks.slice(0, index - 1),
          { ...prev, text: prev.text + block.text },
          ...blocks.slice(index + 1),
        ]);
        focusLater(prev.id, prev.text.length);
      }
      return;
    }

    // ── Move between blocks with the arrow keys ──
    if (e.key === 'ArrowUp' && index > 0 && el.selectionStart === 0 && el.selectionEnd === 0) {
      e.preventDefault();
      const prev = blocks[index - 1];
      focusLater(prev.id, prev.text.length);
      inputs.current.get(prev.id)?.focus();
      inputs.current.get(prev.id)?.setSelectionRange(prev.text.length, prev.text.length);
      return;
    }
    if (
      e.key === 'ArrowDown' &&
      index < blocks.length - 1 &&
      el.selectionStart === block.text.length &&
      el.selectionEnd === block.text.length
    ) {
      e.preventDefault();
      const next = blocks[index + 1];
      inputs.current.get(next.id)?.focus();
      inputs.current.get(next.id)?.setSelectionRange(0, 0);
    }
  };

  // Pasting several lines creates several blocks
  const handlePaste = (block, index, e) => {
    const data = e.clipboardData.getData('text');
    if (!/\r?\n/.test(data)) return;
    e.preventDefault();

    const lines = data.replace(/\r/g, '').split('\n').filter((l) => l.trim() !== '');
    if (lines.length === 0) return;

    const el = e.currentTarget;
    const before = block.text.slice(0, el.selectionStart);
    const after = block.text.slice(el.selectionEnd);

    const inserted = lines.map((line, i) =>
      i === 0 ? { ...block, text: before + line } : createBlock('paragraph', line)
    );
    const last = inserted[inserted.length - 1];
    const caretPos = last.text.length;
    last.text += after;

    onChange([...blocks.slice(0, index), ...inserted, ...blocks.slice(index + 1)]);
    focusLater(last.id, caretPos);
    setMenu(null);
  };

  // Clicking the empty area below the text focuses the last block
  const handleSurfaceClick = (e) => {
    if (e.target !== e.currentTarget) return;
    const last = blocks[blocks.length - 1];
    inputs.current.get(last.id)?.focus();
    inputs.current.get(last.id)?.setSelectionRange(last.text.length, last.text.length);
  };

  let listNumber = 0;
  const describedBy = [showHint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;
  const sole = blocks.length === 1;

  return (
    <div className={styles.root}>
      {label && <p id={labelId} className={styles.label}>{label}</p>}

      <div
        role="group"
        aria-labelledby={label ? labelId : undefined}
        className={[styles.surface, error ? styles.surfaceError : ''].join(' ')}
        style={{ '--editor-min-height': minHeight, '--editor-font-size': fontSize }}
        onClick={handleSurfaceClick}
      >
        {blocks.map((block, index) => {
          listNumber = block.type === 'numbered' ? listNumber + 1 : 0;
          const meta = BLOCK_TYPES.find((t) => t.type === block.type);
          const showMenu = menuOpen && menu.blockId === block.id;

          return (
            <div key={block.id} className={styles.block}>
              {block.type === 'bullet' && <span className={styles.marker} aria-hidden="true">•</span>}
              {block.type === 'numbered' && <span className={styles.marker} aria-hidden="true">{listNumber}.</span>}

              <BlockInput
                block={block}
                register={register}
                className={[styles.input, styles[block.type], sole ? styles.sole : ''].join(' ')}
                placeholder={sole ? placeholder : "Type '/' for formatting"}
                aria-label={meta ? meta.aria : 'Paragraph'}
                aria-describedby={describedBy}
                aria-invalid={error ? 'true' : undefined}
                spellCheck
                onChange={(e) => handleChange(block, e)}
                onKeyDown={(e) => handleKeyDown(block, index, e)}
                onPaste={(e) => handlePaste(block, index, e)}
                onBlur={() => setMenu((m) => (m && m.blockId === block.id ? null : m))}
              />

              {showMenu && (
                <ul id={menuId} role="listbox" aria-label="Formatting options" className={styles.menu}>
                  {menuItems.map((item, i) => (
                    <li
                      key={item.type}
                      id={optionId(item.type)}
                      role="option"
                      aria-selected={i === menu.index}
                      className={[styles.option, i === menu.index ? styles.optionActive : ''].join(' ')}
                      // mousedown (not click) so the textarea keeps focus
                      onMouseDown={(e) => {
                        e.preventDefault();
                        applyCommand(block.id, item.type);
                      }}
                      onMouseEnter={() => setMenu((m) => (m ? { ...m, index: i } : m))}
                    >
                      <span className={styles.optionIcon} aria-hidden="true">{item.icon}</span>
                      <span>
                        <span className={styles.optionTitle}>{item.title}</span>
                        <span className={styles.optionDesc}>{item.description}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {/* Announces the highlighted option to screen readers */}
      <div className={styles.srOnly} aria-live="polite" aria-atomic="true">
        {menuOpen
          ? `${menuItems[menu.index].title}, ${menu.index + 1} of ${menuItems.length}. Use up and down arrows, then Enter.`
          : ''}
      </div>

      {showHint && (
        <p id={hintId} className={styles.hint}>
          Type <kbd className={styles.kbd}>/</kbd> for headings, lists and more. You can also start a line with{' '}
          <kbd className={styles.kbd}>#</kbd>, <kbd className={styles.kbd}>-</kbd> or{' '}
          <kbd className={styles.kbd}>1.</kbd>
        </p>
      )}

      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Public component
   ───────────────────────────────────────────────────────────── */

/**
 * SlashEditor — a small block editor with a "/" command menu.
 *
 * Props
 *  - id           unique id (used for aria wiring)
 *  - label        visible label above the editor
 *  - value        array of blocks (see createInitialBlocks)
 *  - onChange     (nextBlocks) => void
 *  - placeholder  shown while the document is empty
 *  - error        error message string
 *  - readOnly     render the formatted content without editing
 *  - showHint     show the "Type / for…" hint (default true)
 *  - minHeight    CSS height of the writing surface, e.g. "60vh" (default 18rem)
 *  - fontSize     CSS size of body text, e.g. "1.25rem" (default 1rem)
 */
export default function SlashEditor({
  id = 'slash-editor',
  label,
  value,
  onChange,
  placeholder = 'Start writing…',
  error = '',
  readOnly = false,
  showHint = true,
  minHeight,
  fontSize,
}) {
  if (readOnly) return <StaticBlocks blocks={value} />;
  return (
    <EditableEditor
      id={id}
      label={label}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      error={error}
      showHint={showHint}
      minHeight={minHeight}
      fontSize={fontSize}
    />
  );
}