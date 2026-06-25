import React from 'react';
import { Search } from 'lucide-react';

export default function Header({ searchQuery, setSearchQuery }) {
  return (
    <header className="header container animate-fade-in">
      <div className="header-content">
        <div className="logo-container">
          <img src="/finlabs-logo.png" alt="Finlabs" className="logo-image" style={{ height: '36px' }} />
        </div>
        
        <div className="search-container">
          <Search className="search-icon" size={20} />
          <input 
            type="text" 
            placeholder="Search creatives and templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>
    </header>
  );
}
