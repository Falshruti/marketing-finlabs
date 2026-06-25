import React from 'react';
import { Search, Settings } from 'lucide-react';

export default function Header({ searchQuery, setSearchQuery, onAdminClick }) {
  return (
    <header className="header animate-fade-in">
      <div className="header-content container">
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

        <button
          className="admin-header-btn"
          onClick={onAdminClick}
          title="Admin Dashboard"
        >
          <Settings size={18} />
          <span>Admin</span>
        </button>
      </div>
    </header>
  );
}
