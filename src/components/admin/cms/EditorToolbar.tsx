'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { type Editor } from '@tiptap/react'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading2,
  Heading3,
  Heading4,
  List,
  ListOrdered,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Image as ImageIcon,
  Table as TableIcon,
  Highlighter,
  Undo,
  Redo,
  Minus,
  Code2,
} from 'lucide-react'

interface EditorToolbarProps {
  editor: Editor | null
}

interface ToolbarButtonProps {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}

function ToolbarButton({ onClick, isActive, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`p-1.5 rounded transition-colors ${
        isActive
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {children}
    </button>
  )
}

function ToolbarSeparator() {
  return <div className="w-px h-6 bg-gray-300 mx-1" />
}

function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const [urlModal, setUrlModal] = useState<{ type: 'link' | 'image'; value: string } | null>(null)
  const urlInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (urlModal) {
      const timer = setTimeout(() => urlInputRef.current?.focus(), 50)
      return () => clearTimeout(timer)
    }
  }, [urlModal])

  const openLinkModal = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href as string | undefined
    setUrlModal({ type: 'link', value: previousUrl || 'https://' })
  }, [editor])

  const openImageModal = useCallback(() => {
    if (!editor) return
    setUrlModal({ type: 'image', value: 'https://' })
  }, [editor])

  const handleUrlSubmit = useCallback(() => {
    if (!editor || !urlModal) return

    const url = urlModal.value.trim()

    if (urlModal.type === 'link' && url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      setUrlModal(null)
      return
    }

    if (!url) {
      setUrlModal(null)
      return
    }

    if (!isSafeUrl(url)) {
      return
    }

    if (urlModal.type === 'link') {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    } else {
      editor.chain().focus().setImage({ src: url }).run()
    }

    setUrlModal(null)
  }, [editor, urlModal])

  const insertTable = useCallback(() => {
    if (!editor) return

    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run()
  }, [editor])

  if (!editor) return null

  return (
    <>
    <div role="toolbar" aria-label="Editor toolbar" className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50 p-2">
      {/* Text formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        title="Bold"
      >
        <Bold className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        title="Italic"
      >
        <Italic className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        disabled={!editor.can().chain().focus().toggleUnderline().run()}
        title="Underline"
      >
        <Underline className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        title="Strikethrough"
      >
        <Strikethrough className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        isActive={editor.isActive('highlight')}
        disabled={!editor.can().chain().focus().toggleHighlight().run()}
        title="Highlight"
      >
        <Highlighter className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarSeparator />

      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        disabled={!editor.can().chain().focus().toggleHeading({ level: 2 }).run()}
        title="Heading H2"
      >
        <Heading2 className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        disabled={!editor.can().chain().focus().toggleHeading({ level: 3 }).run()}
        title="Heading H3"
      >
        <Heading3 className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
        isActive={editor.isActive('heading', { level: 4 })}
        disabled={!editor.can().chain().focus().toggleHeading({ level: 4 }).run()}
        title="Heading H4"
      >
        <Heading4 className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarSeparator />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        disabled={!editor.can().chain().focus().toggleBulletList().run()}
        title="Bullet list"
      >
        <List className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        disabled={!editor.can().chain().focus().toggleOrderedList().run()}
        title="Numbered list"
      >
        <ListOrdered className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        disabled={!editor.can().chain().focus().toggleBlockquote().run()}
        title="Blockquote"
      >
        <Quote className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarSeparator />

      {/* Text alignment */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        isActive={editor.isActive({ textAlign: 'left' })}
        title="Align left"
      >
        <AlignLeft className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        isActive={editor.isActive({ textAlign: 'center' })}
        title="Center"
      >
        <AlignCenter className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        isActive={editor.isActive({ textAlign: 'right' })}
        title="Align right"
      >
        <AlignRight className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarSeparator />

      {/* Insert elements */}
      <ToolbarButton
        onClick={openLinkModal}
        isActive={editor.isActive('link')}
        title="Link"
      >
        <LinkIcon className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={openImageModal}
        title="Image"
      >
        <ImageIcon className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={insertTable}
        title="Table (3x3)"
      >
        <TableIcon className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal rule"
      >
        <Minus className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive('codeBlock')}
        disabled={!editor.can().chain().focus().toggleCodeBlock().run()}
        title="Code block"
      >
        <Code2 className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarSeparator />

      {/* Undo / Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        title="Undo"
      >
        <Undo className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        title="Redo"
      >
        <Redo className="w-4 h-4" />
      </ToolbarButton>
    </div>

    {urlModal && (
      <div
        role="dialog"
        aria-modal="true"
        aria-label={urlModal.type === 'link' ? 'Enter link URL' : 'Enter image URL'}
        className="fixed inset-0 z-50"
        onClick={() => setUrlModal(null)}
      >
        <div
          className="absolute left-1/2 top-24 -translate-x-1/2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {urlModal.type === 'link' ? 'Link URL' : "Image URL"}
          </label>
          <input
            ref={urlInputRef}
            type="url"
            value={urlModal.value}
            onChange={(e) => setUrlModal({ ...urlModal, value: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleUrlSubmit()
              } else if (e.key === 'Escape') {
                e.preventDefault()
                setUrlModal(null)
              }
            }}
            className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              urlModal.value.trim() && !isSafeUrl(urlModal.value.trim())
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300'
            }`}
            placeholder="https://example.com"
          />
          {urlModal.value.trim() && !isSafeUrl(urlModal.value.trim()) && (
            <p className="mt-1 text-xs text-red-600">
              Invalid URL. Only http://, https://, and mailto: are accepted.
            </p>
          )}
          <div className="flex justify-end gap-2 mt-3">
            <button
              type="button"
              onClick={() => setUrlModal(null)}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 rounded-md hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUrlSubmit}
              disabled={urlModal.type === 'link'
                ? (urlModal.value.trim() !== '' && !isSafeUrl(urlModal.value.trim()))
                : (!urlModal.value.trim() || !isSafeUrl(urlModal.value.trim()))
              }
              className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Insert
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
