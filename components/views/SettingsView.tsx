
import React, { useState, useEffect } from 'react';
import type { AppUser, ModalContent } from '../../types';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { allSubjects, availableThemeColors, educationLevels } from '../../constants';
import { User, Palette, Info, HelpCircle, Shield } from 'lucide-react';

interface SettingsViewProps {
  user: AppUser;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
  getThemeClasses: (variant: string) => string;
  language: 'nl' | 'en';
  setLanguage: (lang: 'nl' | 'en') => void;
  themeColor: string;
  setThemeColor: (color: string) => void;
  showAppModal: (content: ModalContent) => void;
  tSubject: (key: string) => string;
  setCurrentView: (view: string) => void;
  onProfileUpdate: (updatedData: Partial<AppUser>) => Promise<void>;
}

const SettingsView: React.FC<SettingsViewProps> = ({ user, t, getThemeClasses, language, setLanguage, themeColor, setThemeColor, showAppModal, tSubject, setCurrentView, onProfileUpdate }) => {
  const [activeTab, setActiveTab] = useState('account');
  const [isSaving, setIsSaving] = useState(false);
  
  // Local state for form fields
  const [userName, setUserName] = useState(user.userName || '');
  const [schoolName, setSchoolName] = useState(user.schoolName || '');
  const [className, setClassName] = useState(user.className || '');
  const [educationLevel, setEducationLevel] = useState(user.educationLevel || '');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(user.selectedSubjects || []);
  
  // Re-initialize form state if the user object from props changes.
  // This fixes the "refreshing" bug and keeps the form in sync.
  useEffect(() => {
    if (user) {
        setUserName(user.userName || '');
        setSchoolName(user.schoolName || '');
        setClassName(user.className || '');
        setEducationLevel(user.educationLevel || '');
        setSelectedSubjects(user.selectedSubjects || []);
    }
  }, [user]);

  const colorClasses: {[key: string]: string} = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    rose: 'bg-rose-500',
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
    indigo: 'bg-indigo-500',
    teal: 'bg-teal-500',
    amber: 'bg-amber-500',
  };

  const handleProfileSave = () => {
    const originalSubjects = user.selectedSubjects || [];
    const subjectsToRemove = originalSubjects.filter(s => !selectedSubjects.includes(s));

    const performSave = async () => {
        setIsSaving(true);
        await onProfileUpdate({
            userName,
            schoolName,
            className,
            educationLevel,
            selectedSubjects,
        });
        showAppModal({ text: t('success_settings_saved') });
        setIsSaving(false);
    };

    if (subjectsToRemove.length > 0 && user.uid !== 'guest-user') {
        showAppModal({
            text: t('confirm_remove_subjects_warning'),
            confirmAction: performSave,
            cancelAction: () => {}
        });
    } else {
        performSave();
    }
  };

  const handlePasswordReset = async () => {
    if(!auth.currentUser || user.uid === 'guest-user') {
        showAppModal({ text: t('error_guest_action_not_allowed')});
        return;
    }
    try {
        await sendPasswordResetEmail(auth, auth.currentUser.email!);
        showAppModal({text: t('password_reset_sent', {email: auth.currentUser.email!})});
    } catch (error) {
        showAppModal({text: t('error_password_reset_failed')});
    }
  };
  
  const handleSubjectToggle = (subject: string) => {
    setSelectedSubjects(prev => prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]);
  };
  
  const handleThemeChange = (color: string) => {
    setThemeColor(color);
    localStorage.setItem('themeColor', color);
    onProfileUpdate({ themePreference: color });
  }

  const handleLangChange = (lang: 'nl' | 'en') => {
    setLanguage(lang);
    localStorage.setItem('appLanguage', lang);
    onProfileUpdate({ languagePreference: lang });
  }

  const SettingSection = ({ title, children, icon }: { title: string, children: React.ReactNode, icon: React.ReactNode}) => (
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md animate-fade-in">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              {icon}
              {title}
          </h3>
          <div className="space-y-4">
              {children}
          </div>
      </div>
  );

  return (
    <div className="space-y-6">
      <h2 className={`text-3xl font-bold text-center ${getThemeClasses('text-strong')}`}>{t('settings_title')}</h2>
      <div className="flex justify-center border-b flex-wrap">
        <button type="button" onClick={() => setActiveTab('account')} className={`py-2 px-4 font-semibold transition-colors duration-200 ${activeTab === 'account' ? getThemeClasses('text') + ' border-b-2 ' + getThemeClasses('border') : 'text-gray-500 hover:bg-gray-100 rounded-t-lg'}`}>{t('settings_account_section')}</button>
        <button type="button" onClick={() => setActiveTab('appearance')} className={`py-2 px-4 font-semibold transition-colors duration-200 ${activeTab === 'appearance' ? getThemeClasses('text') + ' border-b-2 ' + getThemeClasses('border') : 'text-gray-500 hover:bg-gray-100 rounded-t-lg'}`}>{t('settings_appearance_section')}</button>
        <button type="button" onClick={() => setActiveTab('privacy')} className={`py-2 px-4 font-semibold transition-colors duration-200 ${activeTab === 'privacy' ? getThemeClasses('text') + ' border-b-2 ' + getThemeClasses('border') : 'text-gray-500 hover:bg-gray-100 rounded-t-lg'}`}>{t('settings_privacy_section')}</button>
        <button type="button" onClick={() => setActiveTab('help')} className={`py-2 px-4 font-semibold transition-colors duration-200 ${activeTab === 'help' ? getThemeClasses('text') + ' border-b-2 ' + getThemeClasses('border') : 'text-gray-500 hover:bg-gray-100 rounded-t-lg'}`}>{t('settings_help_info_section')}</button>
      </div>
      
      {activeTab === 'account' && (
        <SettingSection title={t('profile_section')} icon={<User className={getThemeClasses('text')} />}>
            <input value={userName} onChange={e => setUserName(e.target.value)} placeholder={t('your_name')} className="w-full p-2 border rounded-lg" />
            <input value={schoolName} onChange={e => setSchoolName(e.target.value)} placeholder={t('school_name')} className="w-full p-2 border rounded-lg" />
            <input value={className} onChange={e => setClassName(e.target.value)} placeholder={t('class_name')} className="w-full p-2 border rounded-lg" />
            <select value={educationLevel} onChange={e => setEducationLevel(e.target.value)} className="w-full p-2 border rounded-lg bg-white">
                <option value="">{t('Selecteer_Niveau')}</option>
                {educationLevels.map(level => <option key={level} value={level}>{level.toUpperCase()}</option>)}
            </select>
            <p className="font-semibold">{t('select_subjects')}</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {allSubjects.map(s => <button key={s} onClick={() => handleSubjectToggle(s)} className={`p-2 rounded-lg text-sm transition-all duration-200 active:scale-95 ${selectedSubjects.includes(s) ? getThemeClasses('bg') + ' text-white shadow' : 'bg-gray-100 hover:bg-gray-200'}`}>{tSubject(s)}</button>)}
            </div>
            <button onClick={handleProfileSave} disabled={isSaving} className={`w-full py-2 px-4 rounded-lg text-white font-bold ${getThemeClasses('bg')} ${getThemeClasses('hover-bg')} transition-transform active:scale-95 disabled:opacity-70`}>
                {isSaving ? t('saving') : t('save_profile_info_button')}
            </button>
            
             <div className="pt-4 border-t">
                <p className="font-semibold">{t('password_reset_section_title')}</p>
                <p className="text-sm text-gray-600">{t('password_reset_section_description', {email: user.email})}</p>
                <button onClick={handlePasswordReset} className="w-full mt-2 py-2 px-4 rounded-lg text-white font-bold bg-orange-500 hover:bg-orange-600 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">{t('send_reset_email_button')}</button>
              </div>
        </SettingSection>
      )}

      {activeTab === 'appearance' && (
        <SettingSection title={t('settings_appearance_section')} icon={<Palette className={getThemeClasses('text')} />}>
            <div>
                <p className="font-semibold">{t('choose_theme')}</p>
                <div className="flex flex-wrap gap-3 mt-2">
                    {availableThemeColors.map(color => <button key={color} onClick={() => handleThemeChange(color)} className={`w-10 h-10 rounded-full transition-transform duration-200 hover:scale-110 active:scale-100 ${colorClasses[color]} ${themeColor === color ? `ring-2 ring-offset-2 ${getThemeClasses('ring')}` : ''}`}></button>)}
                </div>
            </div>
            <div>
                 <p className="font-semibold">{t('language_preference')}</p>
                <div className="mt-2">
                    <div className="relative flex w-full sm:w-1/2 p-1 bg-gray-200 rounded-lg">
                        <button onClick={() => handleLangChange('nl')} className={`relative w-full py-2 text-sm font-bold rounded-md transition-colors ${language !== 'nl' ? 'text-gray-600' : ''}`}>
                            {t('dutch')}
                        </button>
                        <button onClick={() => handleLangChange('en')} className={`relative w-full py-2 text-sm font-bold rounded-md transition-colors ${language !== 'en' ? 'text-gray-600' : ''}`}>
                           {t('english')}
                        </button>
                        <div
                            className={`absolute top-1 h-[calc(100%-0.5rem)] w-[calc(50%-0.25rem)] bg-white rounded-md shadow-md transition-transform duration-300 ease-in-out`}
                            style={{ transform: language === 'en' ? 'translateX(100%)' : 'translateX(0)'}}
                        />
                    </div>
                </div>
            </div>
        </SettingSection>
      )}

       {activeTab === 'privacy' && (
        <SettingSection title={t('settings_privacy_section')} icon={<Shield className={getThemeClasses('text')} />}>
            <div className="text-gray-700 space-y-2">
                <p>{t('privacy_policy_content')}</p>
            </div>
        </SettingSection>
      )}

      {activeTab === 'help' && (
          <SettingSection title={t('settings_help_info_section')} icon={<HelpCircle className={getThemeClasses('text')}/>}>
              <button onClick={() => setCurrentView('appInfo')} className="w-full text-left p-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold flex items-center gap-2 transition-colors">
                  <Info className="w-5 h-5"/> {t('app_info')}
              </button>
              <button onClick={() => setCurrentView('faq')} className="w-full text-left p-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-semibold flex items-center gap-2 transition-colors">
                  <HelpCircle className="w-5 h-5"/> {t('faq')}
              </button>
          </SettingSection>
      )}
    </div>
  );
};

export default SettingsView;