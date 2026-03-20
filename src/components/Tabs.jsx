import React from 'react';
import { MessageCircle, Mail } from 'lucide-react';

export default function Tabs({ activeTab, setActiveTab }) {
  return (
    <div className="tabs-container container animate-fade-in" style={{ animationDelay: '0.1s' }}>
      <button 
        className={`tab-btn ${activeTab === 'whatsapp' ? 'active' : ''}`}
        onClick={() => setActiveTab('whatsapp')}
      >
        <MessageCircle size={20} className="tab-icon" />
        <span>WhatsApp Creatives</span>
      </button>
      <button 
        className={`tab-btn ${activeTab === 'email' ? 'active' : ''}`}
        onClick={() => setActiveTab('email')}
      >
        <Mail size={20} className="tab-icon" />
        <span>Email Templates</span>
      </button>
    </div>
  );
}
