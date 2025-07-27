import { useEffect, useState } from 'react';

export default function HeroImage() {
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsLargeScreen(e.matches);
    };

    setIsLargeScreen(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  if (!isLargeScreen) return null;

  return (
    <div className="w-full md:w-1/2 mt-12 md:mt-0 flex justify-center">
      <img src="/image-hero.png" alt="Event Banner" className="max-w-full h-auto" />
    </div>
  );
}
