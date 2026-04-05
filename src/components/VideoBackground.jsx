import { useEffect, useState } from 'react';
import desktopVideo from '../assets/videos/desktop_background.mp4';
import mobileVideo from '../assets/videos/mobile_background.mp4';
import './VideoBackground.css';

const VideoBackground = () => {
  const [isMobileView, setIsMobileView] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 768px)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const handleChange = (event) => setIsMobileView(event.matches);

    setIsMobileView(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <video
      key={isMobileView ? 'mobile' : 'desktop'}
      className="wz-video-bg"
      src={isMobileView ? mobileVideo : desktopVideo}
      autoPlay
      loop
      muted
      playsInline
    />
  );
};

export default VideoBackground;
