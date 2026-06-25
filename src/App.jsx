import { useState } from 'react'
import Header from './components/Header'
import Tabs from './components/Tabs'
import CreativeCard from './components/CreativeCard'
import VideoCard from './components/VideoCard'
import AdminDashboard from './components/AdminDashboard'
import { whatsappCreatives, emailTemplates, videos } from './data/mockData'
import { Calendar, RotateCcw } from 'lucide-react'
import './index.css'


function App() {
  const [activeTab, setActiveTab] = useState('whatsapp')
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showAdmin, setShowAdmin] = useState(false)

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setCategoryFilter('All')
    setStartDate('')
    setEndDate('')
  }

  const currentData = activeTab === 'whatsapp' ? whatsappCreatives : activeTab === 'email' ? emailTemplates : videos

  // Specific categories requested
  const categoriesList = ['All', 'Finexa Feature', 'Festival', 'News', 'Trainings', 'Creatives', 'Testimonial']

  // Filter logic
  const filteredData = currentData.filter(item => {
    // 1. Search Query
    const query = searchQuery.toLowerCase().trim()
    const matchesSearch = query === '' ||
      item.title.toLowerCase().includes(query) ||
      (item.category && item.category.toLowerCase().includes(query)) ||
      (item.topic && item.topic.toLowerCase().includes(query)) ||
      (item.subjectLine && item.subjectLine.toLowerCase().includes(query))

    // 2. Category
    const matchesCategory = categoryFilter === 'All' || item.category.toLowerCase() === categoryFilter.toLowerCase()

    // 3. Date Range (Start Date & End Date)
    let matchesDate = true
    if (item.date) {
      if (startDate && item.date < startDate) {
        matchesDate = false
      }
      if (endDate && item.date > endDate) {
        matchesDate = false
      }
    } else if (startDate || endDate) {
      // If item has no date but date filters are applied, exclude it
      matchesDate = false
    }

    return matchesSearch && matchesCategory && matchesDate
  })

  // Default Sort: Newest First
  const sortedData = [...filteredData].sort((a, b) => {
    const dateA = new Date(a.date || '1970-01-01')
    const dateB = new Date(b.date || '1970-01-01')
    return dateB - dateA
  })

  const handleResetFilters = () => {
    setCategoryFilter('All')
    setStartDate('')
    setEndDate('')
    setSearchQuery('')
  }

  const hasActiveFilters = categoryFilter !== 'All' || startDate !== '' || endDate !== '' || searchQuery !== ''

  return (
    <>
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} onAdminClick={() => setShowAdmin(true)} />
      {showAdmin && <AdminDashboard onClose={() => setShowAdmin(false)} />}
      <main className="main-content">
        <Tabs activeTab={activeTab} setActiveTab={handleTabChange} />

        {/* Sleek Premium Filter Section */}
        <div className="filters-container container animate-fade-in" style={{ animationDelay: '0.15s' }}>
          <div className="filters-glass-panel">
            {/* Category Pills */}
            <div className="category-section">
              <span className="filter-label-text">Categories</span>
              <div className="category-pills">
                {categoriesList.map(cat => (
                  <button
                    key={cat}
                    className={`category-pill-btn ${categoryFilter === cat ? 'active' : ''}`}
                    onClick={() => setCategoryFilter(cat)}
                  >
                    {cat === 'All' ? 'All Categories' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range Inputs */}
            <div className="dropdowns-section">
              <div className="filter-label-text">Date Range</div>

              <div className="date-range-wrapper">
                <Calendar className="dropdown-icon" size={16} />
                <span className="date-input-prefix">From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="date-picker-input"
                />
              </div>

              <div className="date-range-wrapper">
                <Calendar className="dropdown-icon" size={16} />
                <span className="date-input-prefix">To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="date-picker-input"
                />
              </div>

              {hasActiveFilters && (
                <button className="reset-filters-btn" onClick={handleResetFilters} title="Reset All Filters">
                  <RotateCcw size={16} />
                  <span>Reset Filters</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="container items-grid animate-fade-in" style={{ animationDelay: '0.25s' }}>
          {sortedData.length > 0 ? (
            sortedData.map(item => (
              activeTab === 'videos'
                ? <VideoCard key={item.id} item={item} />
                : <CreativeCard key={item.id} item={item} type={activeTab} />
            ))
          ) : (
            <div className="empty-state">
              <p>No {activeTab === 'whatsapp' ? 'creatives' : activeTab === 'email' ? 'templates' : 'videos'} found matching your active filters</p>
              {hasActiveFilters && (
                <button className="btn btn-secondary btn-small" onClick={handleResetFilters} style={{ margin: '1rem auto 0', padding: '0.5rem 1.2rem', fontSize: '0.9rem' }}>
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  )
}

export default App


