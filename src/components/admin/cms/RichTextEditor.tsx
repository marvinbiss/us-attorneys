'use client'

import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Highlight from '@tiptap/extension-highlight'
import { EditorToolbar } from './EditorToolbar'

interface RichTextEditorProps {
  value: string
  onChange: (html: string, json: Record<string, unknown>) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-blue-600 underline' },
        validate: href => /^https?:\/\/|^mailto:/.test(href),
      }),
      Image.configure({
        HTMLAttributes: { class: 'rounded-lg max-w-full' },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({
        placeholder: placeholder || 'Start writing...',
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML(), editor.getJSON() as Record<string, unknown>)
    },
    editorProps: {
      attributes: {
        class: 'prose prose-gray max-w-none focus:outline-none min-h-[400px] p-6',
      },
    },
  })

  useEffect(() => {
    if (editor && value !== undefined) {
      const currentHtml = editor.getHTML()
      if (value !== currentHtml) {
        editor.commands.setContent(value || '')
      }
    }
  }, [value, editor])

  return (
    <div className="border border-gray-300 rounded-xl overflow-hidden bg-white">
      <EditorToolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}
