'use client';

import { cn } from '@/lib/utils/cn';
import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo,
  Undo,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import AIButton from './ai-button';

export interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  disabled?: boolean;
  /** Use 'light' for modals/light backgrounds */
  variant?: 'dark' | 'light';
  aiButton?: {
    fieldType: 'hook' | 'body' | 'cta' | 'title' | 'fullScript';
    taskContext?: {
      title?: string;
      niche?: string;
      format?: 'Kratka Forma' | 'Duga Forma';
      hook?: string;
      body?: string;
      cta?: string;
      categoryId?: string | null;
      categoryName?: string;
      tone?: string | null;
      targetAudience?: string | null;
    };
  };
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start typing...',
  className,
  minHeight = '200px',
  disabled = false,
  variant = 'dark',
  aiButton,
}: RichTextEditorProps) {
  const [mounted, setMounted] = useState(false);
  const isLight = variant === 'light';
  const proseClass = isLight
    ? 'prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4 prose-ul:list-disc prose-ol:list-decimal text-slate-900'
    : 'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[200px] p-4 prose-ul:list-disc prose-ol:list-decimal';

  const editor = useEditor({
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          HTMLAttributes: {
            class: 'bullet-list',
          },
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          HTMLAttributes: {
            class: 'ordered-list',
          },
          keepMarks: true,
          keepAttributes: false,
        },
        listItem: {
          HTMLAttributes: {
            class: 'list-item',
          },
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: content || '<p></p>',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      // Only call onChange if content actually changed
      onChange(html);
    },
    editorProps: {
      attributes: {
        class: proseClass,
        spellcheck: 'false',
      },
      handleDOMEvents: {
        keydown: (view, event) => {
          // Ensure Enter key creates new paragraphs/headings properly
          if (event.key === 'Enter' && !event.shiftKey) {
            // Let TipTap handle Enter normally
            return false;
          }
          return false;
        },
      },
    },
    immediatelyRender: false,
  });

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== undefined) {
      const currentContent = editor.getHTML();
      // Only update if content actually changed (normalize for comparison)
      if (content !== currentContent) {
        editor.commands.setContent(content || '', { emitUpdate: false });
      }
    }
  }, [content, editor]);

  // Update editor editable state when disabled prop changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [editor, disabled]);

  // Ensure component only renders on client
  useEffect(() => {
    setMounted(true);
  }, []);

  const wrapperClass = isLight
    ? 'border border-slate-200 rounded-lg bg-white overflow-hidden'
    : 'border border-slate-700 rounded-lg bg-slate-800 overflow-hidden';
  const toolbarClass = isLight
    ? 'flex items-center gap-1 p-2 border-b border-slate-200 bg-slate-50 flex-wrap'
    : 'flex items-center gap-1 p-2 border-b border-slate-700 bg-slate-900/50 flex-wrap';
  const toolbarBtnActive = isLight ? 'bg-slate-200 text-slate-900' : 'bg-slate-700 text-white';
  const toolbarBtnInactive = isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-700/50';
  const toolbarDivider = isLight ? 'bg-slate-200' : 'bg-slate-700';
  const aiSectionClass = isLight ? 'p-3 border-t border-slate-200 bg-slate-50' : 'p-3 border-t border-slate-700 bg-slate-900/50';

  if (!editor || !mounted) {
    return (
      <div
        className={cn(wrapperClass, className)}
        style={{ minHeight }}
      >
        <div className={cn('p-4', isLight ? 'text-slate-500' : 'text-slate-400')}>Loading editor...</div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        isLight ? 'rich-text-editor-light' : 'rich-text-editor-dark',
        wrapperClass,
        className
      )}
    >
      {/* Toolbar */}
      {!disabled && (
        <div className={toolbarClass}>
          {/* Heading and Paragraph Controls */}
          <div className={cn('flex items-center gap-0.5 border-r pr-1 mr-1', isLight ? 'border-slate-200' : 'border-slate-700')}>
            <button
              type="button"
              onClick={() => editor.chain().focus().setParagraph().run()}
              className={cn(
                'px-2.5 py-1.5 rounded text-xs font-semibold transition-colors',
                editor.isActive('paragraph') ? toolbarBtnActive : toolbarBtnInactive
              )}
              title="Paragraph"
            >
              P
            </button>
            <button
              type="button"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
              className={cn(
                'px-2.5 py-1.5 rounded text-xs font-bold transition-colors',
                editor.isActive('heading', { level: 1 }) ? toolbarBtnActive : toolbarBtnInactive
              )}
              title="Heading 1"
            >
              H1
            </button>
            <button
              type="button"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              className={cn(
                'px-2.5 py-1.5 rounded text-xs font-bold transition-colors',
                editor.isActive('heading', { level: 2 }) ? toolbarBtnActive : toolbarBtnInactive
              )}
              title="Heading 2"
            >
              H2
            </button>
            <button
              type="button"
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 3 }).run()
              }
              className={cn(
                'px-2.5 py-1.5 rounded text-xs font-bold transition-colors',
                editor.isActive('heading', { level: 3 }) ? toolbarBtnActive : toolbarBtnInactive
              )}
              title="Heading 3"
            >
              H3
            </button>
          </div>
          <div className={cn('w-px h-6 mx-1', toolbarDivider)} />
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={cn(
              'p-2 rounded transition-colors',
              editor.isActive('bold') ? toolbarBtnActive : toolbarBtnInactive
            )}
            title="Bold"
          >
            <Bold size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={cn(
              'p-2 rounded transition-colors',
              editor.isActive('italic') ? toolbarBtnActive : toolbarBtnInactive
            )}
            title="Italic"
          >
            <Italic size={16} />
          </button>
          <div className={cn('w-px h-6 mx-1', toolbarDivider)} />
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().toggleBulletList().run();
            }}
            className={cn(
              'p-2 rounded transition-colors',
              editor.isActive('bulletList') ? toolbarBtnActive : toolbarBtnInactive
            )}
            title="Bullet List"
          >
            <List size={16} />
          </button>
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().toggleOrderedList().run();
            }}
            className={cn(
              'p-2 rounded transition-colors',
              editor.isActive('orderedList') ? toolbarBtnActive : toolbarBtnInactive
            )}
            title="Numbered List"
          >
            <ListOrdered size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn(
              'p-2 rounded transition-colors',
              editor.isActive('blockquote') ? toolbarBtnActive : toolbarBtnInactive
            )}
            title="Quote"
          >
            <Quote size={16} />
          </button>
          <div className={cn('w-px h-6 mx-1', toolbarDivider)} />
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            className={cn('p-2 rounded transition-colors disabled:opacity-50', toolbarBtnInactive)}
            title="Undo"
          >
            <Undo size={16} />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            className={cn('p-2 rounded transition-colors disabled:opacity-50', toolbarBtnInactive)}
            title="Redo"
          >
            <Redo size={16} />
          </button>
        </div>
      )}

      {/* Editor */}
      <div style={{ minHeight }} className="overflow-y-auto">
        <EditorContent editor={editor} />
      </div>

      {/* AI Button */}
      {aiButton && !disabled && (
        <div className={aiSectionClass}>
          <AIButton
            fieldType={aiButton.fieldType}
            currentContent={content}
            taskContext={aiButton.taskContext}
            onGenerate={(generatedContent) => {
              editor.commands.setContent(generatedContent);
              onChange(generatedContent);
            }}
            className="w-fit"
          />
        </div>
      )}

      <style jsx global>{`
        /* Dark variant (default) */
        .rich-text-editor-dark .ProseMirror {
          outline: none;
          color: rgb(226 232 240);
          padding: 16px;
        }
        .rich-text-editor-dark .ProseMirror p {
          margin: 8px 0;
        }
        .rich-text-editor-dark .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: rgb(100 116 139);
          pointer-events: none;
          height: 0;
        }
        .rich-text-editor-dark .ProseMirror ul,
        .rich-text-editor-dark .ProseMirror ol {
          padding-left: 28px !important;
          margin: 12px 0 !important;
          list-style-position: outside !important;
        }
        .rich-text-editor-dark .ProseMirror ul {
          list-style-type: disc !important;
        }
        .rich-text-editor-dark .ProseMirror ol {
          list-style-type: decimal !important;
        }
        .rich-text-editor-dark .ProseMirror li {
          display: list-item !important;
          margin: 4px 0 !important;
          padding-left: 4px !important;
        }
        .rich-text-editor-dark .ProseMirror ul li::marker,
        .rich-text-editor-dark .ProseMirror ol li::marker {
          color: rgb(226 232 240) !important;
        }
        .rich-text-editor-dark .ProseMirror h1,
        .rich-text-editor-dark .ProseMirror h2,
        .rich-text-editor-dark .ProseMirror h3 {
          font-weight: bold;
          margin-top: 16px;
          margin-bottom: 8px;
          color: rgb(226 232 240);
        }
        .rich-text-editor-dark .ProseMirror blockquote {
          border-left: 3px solid rgb(59 130 246);
          padding-left: 16px;
          margin: 8px 0;
          font-style: italic;
          color: rgb(148 163 184);
        }
        .rich-text-editor-dark .ProseMirror code {
          background-color: rgb(30 41 59);
          padding: 2px 4px;
          border-radius: 4px;
          color: rgb(226 232 240);
        }
        .rich-text-editor-dark .ProseMirror pre {
          background-color: rgb(30 41 59);
          padding: 16px;
          border-radius: 8px;
          margin: 8px 0;
          overflow-x: auto;
        }
        /* Light variant */
        .rich-text-editor-light .ProseMirror {
          outline: none;
          color: rgb(15 23 42);
          padding: 16px;
        }
        .rich-text-editor-light .ProseMirror p {
          margin: 8px 0;
        }
        .rich-text-editor-light .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: rgb(148 163 184);
          pointer-events: none;
          height: 0;
        }
        .rich-text-editor-light .ProseMirror ul,
        .rich-text-editor-light .ProseMirror ol {
          padding-left: 28px !important;
          margin: 12px 0 !important;
          list-style-position: outside !important;
        }
        .rich-text-editor-light .ProseMirror ul li::marker,
        .rich-text-editor-light .ProseMirror ol li::marker {
          color: rgb(51 65 85) !important;
        }
        .rich-text-editor-light .ProseMirror h1,
        .rich-text-editor-light .ProseMirror h2,
        .rich-text-editor-light .ProseMirror h3 {
          font-weight: bold;
          margin-top: 16px;
          margin-bottom: 8px;
          color: rgb(15 23 42);
        }
        .rich-text-editor-light .ProseMirror blockquote {
          border-left: 3px solid rgb(59 130 246);
          padding-left: 16px;
          margin: 8px 0;
          font-style: italic;
          color: rgb(71 85 105);
        }
        .rich-text-editor-light .ProseMirror code {
          background-color: rgb(226 232 240);
          padding: 2px 4px;
          border-radius: 4px;
          color: rgb(15 23 42);
        }
        .rich-text-editor-light .ProseMirror pre {
          background-color: rgb(241 245 249);
          padding: 16px;
          border-radius: 8px;
          margin: 8px 0;
          overflow-x: auto;
        }
      `}</style>
    </div>
  );
}
