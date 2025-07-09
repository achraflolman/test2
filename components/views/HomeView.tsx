
import React from 'react';
import { FileText, Link } from 'lucide-react';
import { subjectIconMap } from '../../constants';
import type { AppUser, FileData } from '../../types';

interface HomeViewProps {
  user: AppUser;
  setCurrentView: (view: string) => void;
  t: (key: string) => string;
  getThemeClasses: (variant: string) => string;
  tSubject: (key: string) => string;
  setCurrentSubject: (subject: string | null) => void;
  recentFiles: FileData[];
}

const HomeView: React.FC<HomeViewProps> = ({ user, setCurrentView, t, getThemeClasses, tSubject, setCurrentSubject, recentFiles }) => {
  const userSubjects = user.selectedSubjects || [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className={`text-3xl font-bold text-center mb-6 ${getThemeClasses('text-strong')}`}>{t('my_subjects')}</h2>
        {userSubjects.length === 0 ? (
          <div className={`p-6 rounded-lg text-center ${getThemeClasses('bg-light')}`}>
            <p className="font-semibold text-lg">{t('profile_incomplete_message')}</p>
            <p className="mt-2">{t('go_to_settings_message')}</p>
            <button
              onClick={() => setCurrentView('settings')}
              className={`mt-4 font-bold py-2 px-4 rounded-lg text-white ${getThemeClasses('bg')} ${getThemeClasses('hover-bg')} transition-transform active:scale-95`}
            >
              {t('settings')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {userSubjects.map(subjectKey => {
              const Icon = subjectIconMap[subjectKey] || subjectIconMap.default;
              return (
                <button
                  key={subjectKey}
                  onClick={() => setCurrentSubject(subjectKey)}
                  className={`p-4 rounded-xl shadow-lg flex flex-col items-center justify-center text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 ${getThemeClasses('ring')} bg-white`}
                >
                  <Icon className={`w-10 h-10 mb-3 ${getThemeClasses('text')}`} />
                  <span className={`text-lg font-bold ${getThemeClasses('text-strong')}`}>{tSubject(subjectKey)}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h3 className={`text-2xl font-bold text-center mb-4 ${getThemeClasses('text-strong')}`}>{t('recent_files_title')}</h3>
        <div className={`p-4 rounded-lg ${getThemeClasses('bg-light')}`}>
          {recentFiles.length === 0 ? (
            <p className="text-center text-gray-500 italic">{t('no_recent_files')}</p>
          ) : (
            <ul className="space-y-3">
              {recentFiles.map(file => (
                <li key={file.id} className="bg-white p-3 rounded-lg shadow-sm flex items-center justify-between transition-shadow hover:shadow-md">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{file.title}</p>
                    <p className="text-sm text-gray-500">({tSubject(file.subject)}) - {file.createdAt.toDate().toLocaleDateString()}</p>
                  </div>
                  <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" className={`ml-2 flex-shrink-0 bg-green-500 hover:bg-green-600 text-white text-xs py-1 px-2 rounded-md shadow transition-colors active:scale-95`}>
                    <Link className="w-3 h-3 inline" /> {t('Bekijk')}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeView;
