'use client'

interface Tab {
  key: string
  label: string
  count: number
}

interface StatusTabsProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (key: string) => void
}

export function StatusTabs({ tabs, activeTab, onTabChange }: StatusTabsProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          aria-pressed={activeTab === tab.key}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            activeTab === tab.key
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
          }`}
        >
          {tab.label}
          <span className={`ml-1.5 ${activeTab === tab.key ? 'text-blue-200' : 'text-gray-400'}`}>
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  )
}
