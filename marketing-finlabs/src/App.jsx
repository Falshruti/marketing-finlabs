import { useState } from 'react'
import Header from './components/Header'
import Tabs from './components/Tabs'
import CreativeCard from './components/CreativeCard'
import { whatsappCreatives, emailTemplates } from './data/mockData'
import './index.css'

function App() {
  const [activeTab, setActiveTab] = useState('whatsapp')
  const [searchQuery, setSearchQuery] = useState('')

  const currentData = activeTab === 'whatsapp' ? whatsappCreatives : emailTemplates
  
  const filteredData = currentData.filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <>
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <main className="main-content">
        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <div className="container items-grid animate-fade-in" style={{ animationDelay: '0.2s' }}>
          {filteredData.length > 0 ? (
            filteredData.map(item => (
              <CreativeCard key={item.id} item={item} type={activeTab} />
            ))
          ) : (
            <div className="empty-state">
              <p>No {activeTab === 'whatsapp' ? 'creatives' : 'templates'} found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      </main>
    </>
  )
}

export default App
