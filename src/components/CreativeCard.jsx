import React, { useState, useEffect } from 'react';
import { Download, Eye, X, Loader2, FileText } from 'lucide-react';

export default function CreativeCard({ item, type }) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', arn: '', phone: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  
  useEffect(() => {
    if (showModal) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [showModal]);

  const handleDownloadClick = () => {
    if (item.id === 'wa-1') {
      setShowModal(true);
    } else {
      // Standard direct download for all other creatives and templates
      downloadFile(item.file || item.image, item.title);
    }
  };

  const downloadFile = (dataUrl, filename) => {
    const link = document.createElement('a');
    link.href = dataUrl;

    let extension = 'jpg';
    if (dataUrl.startsWith('data:image/jpeg')) {
      extension = 'jpg';
    } else if (dataUrl.includes('.')) {
      extension = dataUrl.split('.').pop()?.split('?')[0] || 'jpg';
    }

    link.download = `${filename.replace(/\s+/g, '-').toLowerCase()}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateAndDownload = async () => {
    setIsGenerating(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.crossOrigin = 'anonymous'; // Important for external images

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = item.image;
      });

      // Target optimal width for clear rendering
      const targetWidth = 1080;
      const scale = targetWidth / img.width;
      const scaledHeight = img.height * scale;

      const footerHeight = 200;
      canvas.width = targetWidth;
      canvas.height = scaledHeight + footerHeight;

      // Draw original image
      ctx.drawImage(img, 0, 0, targetWidth, scaledHeight);

      // Draw footer background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, scaledHeight, canvas.width, footerHeight);

      // MFD Name
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 30px Arial, sans-serif';
      ctx.fillText(formData.name || 'MFD Name', 60, scaledHeight + 60);

      // ARN & Phone
      ctx.font = '23px Arial, sans-serif';
      const arnText = formData.arn ? `ARN No - ${formData.arn}` : 'ARN No - 1234';
      const phoneText = formData.phone ? `Phone No - ${formData.phone}` : 'Phone No - 123456789';
      ctx.fillText(`${arnText}   |   ${phoneText}`, 60, scaledHeight + 95);

      // Disclaimers
      ctx.fillStyle = '#333333';
      ctx.font = '20px Arial, sans-serif';
      ctx.fillText('AMFI Registered Mutual Fund Distributor', 60, scaledHeight + 145);
      ctx.font = '18px Arial, sans-serif';
      ctx.fillText('Mutual Funds investments are subjected to market risks, please read all the scheme related documents carefully', 60, scaledHeight + 175);

      downloadFile(canvas.toDataURL('image/jpeg', 0.95), item.title);
      setShowModal(false);
    } catch (error) {
      console.error('Error generating image:', error);
      alert('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <div className="creative-card animate-fade-in">
        <div className={`card-image-wrapper ${type === 'email' ? 'email-card-wrapper' : ''}`}>
          {item.image ? (
            <img src={item.image} alt={item.title} className="card-image" loading="lazy" />
          ) : (
            <div className="card-image" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#ffffff',
              width: '100%',
              height: '100%',
              padding: '2rem',
              textAlign: 'center'
            }}>
              <FileText size={48} color="var(--accent-primary)" opacity={0.3} style={{ marginBottom: '1rem' }} />
              <div style={{ color: '#0f172a', fontWeight: '500', fontSize: '0.9rem', lineHeight: '1.4' }}>
                <div style={{ color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Subject Line</div>
                {item.subjectLine || item.title}
              </div>
            </div>
          )}
          <div className="card-overlay">
            <div className="action-buttons">
              <button className="action-btn" title="View" onClick={() => window.open(item.file || item.image, '_blank')}>
                <Eye size={20} />
              </button>
              <button className="action-btn primary" title="Download" onClick={handleDownloadClick}>
                <Download size={20} />
              </button>
            </div>
          </div>
        </div>
        <div className="card-content">
          <span className="category-badge">{item.category}</span>
          <h3 className="card-title">{item.title}</h3>
          {type === 'email' && (
            <div className="card-footer">
              <span className="downloads-count">{item.downloads} downloads</span>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <button className="modal-close" onClick={() => setShowModal(false)}>
              <X size={24} />
            </button>
            <h2 className="modal-title">Customize Creative</h2>

            <div className="form-group">
              <label className="form-label">MFD Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="MFD Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">ARN Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="1234"
                value={formData.arn}
                onChange={(e) => setFormData({ ...formData, arn: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="123456789"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleGenerateAndDownload}
                disabled={isGenerating}
              >
                {isGenerating ? <><Loader2 className="animate-spin" size={20} /> Generating...</> : 'Download Image'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
