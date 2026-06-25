import React, { useState } from 'react';
import { Play, X, ExternalLink } from 'lucide-react';

export default function VideoCard({ item }) {
  const [showModal, setShowModal] = useState(false);

  // Helper to extract YouTube 11-char Video ID
  const getYoutubeId = (url) => {
    if (!url) return '';
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    return match ? match[1] : '';
  };

  const videoId = getYoutubeId(item.videoUrl);
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : item.videoUrl;
  const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : item.thumbnail;

  return (
    <>
      <div className="creative-card animate-fade-in">
        <div className="card-image-wrapper video-card-wrapper">
          {/* Thumbnail / placeholder */}
          <div
            className="video-thumbnail"
            style={{
              backgroundImage: thumbnailUrl ? `url(${thumbnailUrl})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {!thumbnailUrl && (
              <div className="video-placeholder-icon">
                <Play size={48} />
              </div>
            )}
          </div>

          {/* Hover overlay */}
          <div className="card-overlay">
            <div className="action-buttons">
              <button
                className="action-btn primary"
                title="Play Video"
                onClick={() => setShowModal(true)}
              >
                <Play size={20} />
              </button>
              {item.videoUrl && (
                <button
                  className="action-btn"
                  title="Open in YouTube"
                  onClick={() =>
                    window.open(
                      item.videoUrl,
                      '_blank'
                    )
                  }
                >
                  <ExternalLink size={20} />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="card-content">
          <span className="category-badge">{item.category}</span>
          <h3 className="card-title">{item.title}</h3>
        </div>
      </div>

      {/* Video Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="video-modal-content animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setShowModal(false)}
            >
              <X size={24} />
            </button>
            <h2 className="modal-title">{item.title}</h2>
            <div className="video-iframe-wrapper">
              <iframe
                src={`${embedUrl}?autoplay=1`}
                title={item.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
