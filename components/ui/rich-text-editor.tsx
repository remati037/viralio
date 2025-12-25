'use client'

import { cn } from '@/lib/utils/cn'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Bold, Italic, List, ListOrdered, Quote, Redo, Undo } from 'lucide-react'
import { useEffect, useState } from 'react'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
  minHeight?: string
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start typing...',
  className,
  minHeight = '200px',
}: RichTextEditorProps) {
  const [mounted, setMounted] = useState(false)

  const editor = useEditor({
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
      const html = editor.getHTML()
      // Only call onChange if content actually changed
      onChange(html)
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[200px] p-4 prose-ul:list-disc prose-ol:list-decimal',
        spellcheck: 'false',
      },
      handleDOMEvents: {
        keydown: (view, event) => {
          // Ensure Enter key creates new paragraphs/headings properly
          if (event.key === 'Enter' && !event.shiftKey) {
            // Let TipTap handle Enter normally
            return false
          }
          return false
        },
      },
    },
    immediatelyRender: false,
  })

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== undefined) {
      const currentContent = editor.getHTML()
      // Only update if content actually changed (normalize for comparison)
      if (content !== currentContent) {
        editor.commands.setContent(content || '', { emitUpdate: false })
      }
    }
  }, [content, editor])

  // Ensure component only renders on client
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!editor || !mounted) {
    return (
      <div
        className={cn('border border-slate-700 rounded-lg bg-slate-800 overflow-hidden', className)}
        style={{ minHeight }}
      >
        <div className="p-4 text-slate-400">Loading editor...</div>
      </div>
    )
  }

  return (
    <div className={cn('border border-slate-700 rounded-lg bg-slate-800 overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-slate-700 bg-slate-900/50 flex-wrap">
        {/* Heading and Paragraph Controls */}
        <div className="flex items-center gap-0.5 border-r border-slate-700 pr-1 mr-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={cn(
              'px-2.5 py-1.5 rounded text-xs font-semibold transition-colors',
              editor.isActive('paragraph') ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-700/50'
            )}
            title="Paragraph"
          >
            P
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={cn(
              'px-2.5 py-1.5 rounded text-xs font-bold transition-colors',
              editor.isActive('heading', { level: 1 }) ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-700/50'
            )}
            title="Heading 1"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={cn(
              'px-2.5 py-1.5 rounded text-xs font-bold transition-colors',
              editor.isActive('heading', { level: 2 }) ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-700/50'
            )}
            title="Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={cn(
              'px-2.5 py-1.5 rounded text-xs font-bold transition-colors',
              editor.isActive('heading', { level: 3 }) ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-700/50'
            )}
            title="Heading 3"
          >
            H3
          </button>
        </div>
        <div className="w-px h-6 bg-slate-700 mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={cn(
            'p-2 rounded hover:bg-slate-700 transition-colors',
            editor.isActive('bold') ? 'bg-slate-700 text-white' : 'text-slate-400'
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
            'p-2 rounded hover:bg-slate-700 transition-colors',
            editor.isActive('italic') ? 'bg-slate-700 text-white' : 'text-slate-400'
          )}
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <div className="w-px h-6 bg-slate-700 mx-1" />
        <button
          type="button"
          onClick={() => {
            editor.chain().focus().toggleBulletList().run()
          }}
          className={cn(
            'p-2 rounded hover:bg-slate-700 transition-colors',
            editor.isActive('bulletList') ? 'bg-slate-700 text-white' : 'text-slate-400'
          )}
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <button
          type="button"
          onClick={() => {
            editor.chain().focus().toggleOrderedList().run()
          }}
          className={cn(
            'p-2 rounded hover:bg-slate-700 transition-colors',
            editor.isActive('orderedList') ? 'bg-slate-700 text-white' : 'text-slate-400'
          )}
          title="Numbered List"
        >
          <ListOrdered size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={cn(
            'p-2 rounded hover:bg-slate-700 transition-colors',
            editor.isActive('blockquote') ? 'bg-slate-700 text-white' : 'text-slate-400'
          )}
          title="Quote"
        >
          <Quote size={16} />
        </button>
        <div className="w-px h-6 bg-slate-700 mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className="p-2 rounded hover:bg-slate-700 transition-colors text-slate-400 disabled:opacity-50"
          title="Undo"
        >
          <Undo size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className="p-2 rounded hover:bg-slate-700 transition-colors text-slate-400 disabled:opacity-50"
          title="Redo"
        >
          <Redo size={16} />
        </button>
      </div>

      {/* Editor */}
      <div style={{ minHeight }} className="overflow-y-auto">
        <EditorContent editor={editor} />
      </div>

      <style jsx global>{`
        .ProseMirror {
          outline: none;
          color: rgb(226 232 240);
          padding: 1rem;
        }
        .ProseMirror p {
          margin: 0.5rem 0;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: rgb(100 116 139);
          pointer-events: none;
          height: 0;
        }
        /* Override prose list styles */
        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.75rem !important;
          margin: 0.75rem 0 !important;
          list-style-position: outside !important;
          list-style-image: none !important;
        }
        .ProseMirror ul {
          list-style-type: disc !important;
        }
        .ProseMirror ul[data-type="taskList"] {
          list-style: none !important;
          padding-left: 0 !important;
        }
        .ProseMirror ol {
          list-style-type: decimal !important;
        }
        .ProseMirror li {
          display: list-item !important;
          margin: 0.25rem 0 !important;
          padding-left: 0.25rem !important;
          list-style-position: outside !important;
          list-style-image: none !important;
        }
        .ProseMirror ul li {
          list-style-type: disc !important;
        }
        .ProseMirror ol li {
          list-style-type: decimal !important;
        }
        .ProseMirror ul li::marker,
        .ProseMirror ol li::marker {
          color: rgb(226 232 240) !important;
        }
        .ProseMirror ul li p,
        .ProseMirror ol li p {
          margin: 0;
          display: inline;
        }
        .ProseMirror ul li p:first-child,
        .ProseMirror ol li p:first-child {
          margin-top: 0;
        }
        .ProseMirror ul li p:last-child,
        .ProseMirror ol li p:last-child {
          margin-bottom: 0;
        }
        .ProseMirror h1,
        .ProseMirror h2,
        .ProseMirror h3 {
          font-weight: bold;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          color: rgb(226 232 240);
        }
        .ProseMirror h1 {
          font-size: 1.5rem;
        }
        .ProseMirror h2 {
          font-size: 1.25rem;
        }
        .ProseMirror h3 {
          font-size: 1.125rem;
        }
        .ProseMirror blockquote {
          border-left: 3px solid rgb(59 130 246);
          padding-left: 1rem;
          margin: 0.5rem 0;
          font-style: italic;
          color: rgb(148 163 184);
        }
        .ProseMirror strong {
          font-weight: bold;
        }
        .ProseMirror em {
          font-style: italic;
        }
        .ProseMirror code {
          background-color: rgb(30 41 59);
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-size: 0.875rem;
          color: rgb(226 232 240);
        }
        .ProseMirror pre {
          background-color: rgb(30 41 59);
          padding: 1rem;
          border-radius: 0.5rem;
          margin: 0.5rem 0;
          overflow-x: auto;
        }
        .ProseMirror pre code {
          background-color: transparent;
          padding: 0;
        }
      `}</style>
    </div>
  )
}

