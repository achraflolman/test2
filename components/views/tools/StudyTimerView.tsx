import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

interface StudyTimerViewProps {
  t: (key: string) => string;
  getThemeClasses: (variant: string) => string;
}

const StudyTimerView: React.FC<StudyTimerViewProps> = ({ t, getThemeClasses }) => {
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [timeLeft, setTimeLeft] = useState(focusMinutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [timerStyle, setTimerStyle] = useState<'circle' | 'bar' | 'text'>('circle');
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

   useEffect(() => {
    // Initialize audio client-side only
    audioRef.current = new Audio('/bell.mp3');
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const resetTimer = useCallback((currentMode = mode) => {
    setIsActive(false);
    if (currentMode === 'focus') {
      setTimeLeft(focusMinutes * 60);
    } else {
      setTimeLeft(breakMinutes * 60);
    }
  }, [mode, focusMinutes, breakMinutes]);
  
  const switchMode = useCallback(() => {
    if (audioRef.current) {
        audioRef.current.play().catch(e => console.error("Error playing sound:", e));
    }
    const newMode = mode === 'focus' ? 'break' : 'focus';
    setMode(newMode);
    setIsActive(true); // Automatically start the next session
  }, [mode]);

  useEffect(() => {
    resetTimer(mode);
  }, [focusMinutes, breakMinutes, mode, resetTimer]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      switchMode();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, switchMode]);
  
  const totalDuration = mode === 'focus' ? focusMinutes * 60 : breakMinutes * 60;
  const progress = totalDuration > 0 ? ((totalDuration - timeLeft) / totalDuration) * 100 : 0;
  
  const cycleTimerStyle = (direction: number) => {
      const styles: Array<'circle' | 'bar' | 'text'> = ['circle', 'bar', 'text'];
      const currentIndex = styles.indexOf(timerStyle);
      let nextIndex = (currentIndex + direction + styles.length) % styles.length;
      setTimerStyle(styles[nextIndex]);
  }

  const TimerVisual = () => {
      switch(timerStyle) {
          case 'circle':
              const strokeDashoffset = 283 * (1 - progress / 100);
              return (
                <div className="relative w-36 h-36 sm:w-48 sm:h-48 my-4">
                    <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle className="text-gray-200" strokeWidth="7" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                        <circle 
                            className={getThemeClasses('text')} 
                            strokeWidth="7" 
                            strokeDasharray="283"
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round" 
                            stroke="currentColor" 
                            fill="transparent" 
                            r="45" cx="50" cy="50"
                            style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 1s linear' }}
                        />
                    </svg>
                    <div className={`absolute inset-0 flex items-center justify-center text-3xl sm:text-4xl font-bold ${getThemeClasses('text-strong')}`}>
                        {formatTime(timeLeft)}
                    </div>
                </div>
              );
          case 'bar':
              return (
                  <div className="w-full h-36 sm:h-48 my-4 flex flex-col justify-center items-center">
                      <p className={`text-5xl sm:text-6xl font-bold mb-4 ${getThemeClasses('text-strong')}`}>{formatTime(timeLeft)}</p>
                      <div className="w-full h-4 bg-gray-200 rounded-full">
                          <div className={`${getThemeClasses('bg')} h-4 rounded-full transition-all duration-1000 ease-linear`} style={{ width: `${progress}%` }}></div>
                      </div>
                  </div>
              );
          case 'text':
               return (
                  <div className="w-full h-36 sm:h-48 my-4 flex justify-center items-center">
                      <p className={`text-6xl sm:text-7xl font-bold ${getThemeClasses('text-strong')}`}>{formatTime(timeLeft)}</p>
                  </div>
              );
          default:
              return null;
      }
  }


  return (
    <div className={`p-4 rounded-lg shadow-inner ${getThemeClasses('bg-light')} flex flex-col items-center space-y-4`}>
        <div className="w-full flex justify-center gap-2 sm:gap-4">
            <div className="flex-1 max-w-xs">
                <label className="block text-center font-semibold">{t('focus_session')} (min)</label>
                <input type="number" value={focusMinutes} onChange={e => setFocusMinutes(Math.max(1, Number(e.target.value)))} disabled={isActive} className="w-full p-2 border rounded-lg text-center"/>
            </div>
            <div className="flex-1 max-w-xs">
                <label className="block text-center font-semibold">{t('break_session')} (min)</label>
                <input type="number" value={breakMinutes} onChange={e => setBreakMinutes(Math.max(1, Number(e.target.value)))} disabled={isActive} className="w-full p-2 border rounded-lg text-center"/>
            </div>
        </div>
        
        <div className="w-full flex items-center justify-around">
            <button onClick={() => cycleTimerStyle(-1)} className="p-2 rounded-full hover:bg-gray-200 transition-colors"><ChevronLeft /></button>
            <TimerVisual />
            <button onClick={() => cycleTimerStyle(1)} className="p-2 rounded-full hover:bg-gray-200 transition-colors"><ChevronRight /></button>
        </div>


        <div className="flex gap-4">
            <button onClick={() => setIsActive(!isActive)} className={`flex items-center gap-2 p-4 rounded-full text-white shadow-lg transition-transform active:scale-90 ${getThemeClasses('bg')}`}>
                {isActive ? <Pause size={28}/> : <Play size={28}/>}
            </button>
            <button onClick={() => resetTimer()} className="flex items-center gap-2 p-4 rounded-full bg-white shadow-lg transition-transform active:scale-90">
                <RefreshCw size={28}/>
            </button>
        </div>
    </div>
  );
};

export default StudyTimerView;