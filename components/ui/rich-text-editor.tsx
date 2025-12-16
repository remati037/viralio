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
        },
        orderedList: {
          HTMLAttributes: {
            class: 'ordered-list',
          },
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
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[200px] p-4',
      },
    },
    immediatelyRender: false,
  })

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false })
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
          onClick={() => editor.chain().focus().toggleBulletList().run()}
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
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
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
        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }
        .ProseMirror ul {
          list-style-type: disc;
        }
        .ProseMirror ol {
          list-style-type: decimal;
        }
        .ProseMirror li {
          display: list-item;
          margin: 0.25rem 0;
        }
        .ProseMirror ul li,
        .ProseMirror ol li {
          padding-left: 0.25rem;
        }
        .ProseMirror h1,
        .ProseMirror h2,
        .ProseMirror h3 {
          font-weight: bold;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
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
      `}</style>
    </div>
  )
}

