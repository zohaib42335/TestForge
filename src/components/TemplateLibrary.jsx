/**
 * TemplateLibrary — Card grid of built-in and custom templates; applies presets to the form.
 * @param {Object} props
 * @param {Function} props.onUseTemplate - (defaults: Record<string, string>) => void
 * @param {Function} [props.onDeleteTemplate] - (id: string) => void
 * @param {number} props.refreshKey - Increment to reload custom templates from localStorage
 */

import { useEffect, useMemo, useState } from 'react'
import { BUILT_IN_TEMPLATES } from '../constants/builtInTemplates.js'
import { loadCustomTemplates } from '../utils/templateStorage.js'

/**
 * @param {Object} props
 * @param {Function} props.onUseTemplate
 * @param {Function} [props.onDeleteTemplate]
 * @param {number} [props.refreshKey]
 */
export default function TemplateLibrary({ onUseTemplate, onDeleteTemplate, refreshKey = 0 }) {
  const [customList, setCustomList] = useState(() => loadCustomTemplates())

  useEffect(() => {
    setCustomList(loadCustomTemplates())
  }, [refreshKey])

  const allTemplates = useMemo(() => {
    const built = BUILT_IN_TEMPLATES.map((t) => ({
      ...t,
      isCustom: false,
    }))
    const custom = customList.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description || 'Saved from your form.',
      defaults: t.defaults || {},
      isCustom: true,
    }))
    return [...built, ...custom]
  }, [customList])

  return (
    <section className="mb-4" aria-labelledby="template-library-heading">
      <h2
        id="template-library-heading"
        className="text-sm uppercase tracking-widest text-orange-600 font-mono mb-4 border-b border-orange-200 pb-2"
      >
        Template library
      </h2>
      <p className="text-sm text-stone-500 mb-4">
        Start from a preset to pre-fill suite, title, steps, and risk fields. Assignee and
        creator stay empty until you enter them.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {allTemplates.map((t) => (
          <article
            key={t.id}
            className="bg-white border border-orange-200 rounded-xl p-5 flex flex-col gap-3 shadow-sm hover:border-orange-400 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium text-stone-800 text-base leading-snug">{t.name}</h3>
              {t.isCustom && (
                <span className="shrink-0 text-[10px] uppercase tracking-wider font-mono text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  Custom
                </span>
              )}
            </div>
            <p className="text-sm text-stone-500 flex-1">{t.description}</p>
            <div className="mt-auto flex gap-2">
              <button
                type="button"
                onClick={() => onUseTemplate({ ...(t.defaults || {}) })}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white transition"
              >
                Use Template
              </button>
              {t.isCustom && onDeleteTemplate && (
                <button
                  type="button"
                  onClick={() => onDeleteTemplate(t.id)}
                  className="px-3 py-2.5 rounded-lg text-sm font-semibold text-red-500 hover:text-red-700 border border-red-200 bg-red-50 hover:bg-red-100 transition"
                  title="Delete custom template"
                >
                  🗑
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
