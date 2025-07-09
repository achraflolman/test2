
import React, { useState, useCallback } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, Timestamp } from '@firebase/firestore';
import { db, appId, auth } from '../../services/firebase';
import { allSubjects, educationLevels } from '../../constants';
import type { ModalContent } from '../../types';

interface AuthViewProps {
  showAppModal: (content: ModalContent) => void;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
  getThemeClasses: (variant: string) => string;
  tSubject: (key: string) => string;
  handleGuestLogin: () => void;
}

const FormInput = ({ name, label, type, value, onChange, placeholder, required = true, disabled = false, getThemeClasses }: any) => (
    <div>
        <label className="block text-gray-800 text-sm font-bold mb-2">{label}</label>
        <input name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} required={required} disabled={disabled}
            className={`shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 ${getThemeClasses('ring')} transition-all duration-200 disabled:bg-gray-100`} />
    </div>
);

const AuthView: React.FC<AuthViewProps> = ({ showAppModal, t, getThemeClasses, tSubject, handleGuestLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
      email: '',
      password: '',
      regName: '',
      regSchoolName: '',
      regClassName: '',
      regEducationLevel: '',
      regLanguage: 'nl',
  });
  const [selectedRegSubjects, setSelectedRegSubjects] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({...prev, [name]: value}));
  }, []);

    const handleAuthError = (errorCode: string) => {
        let key = 'error_unknown';
        switch (errorCode) {
            case 'auth/invalid-email': key = 'error_invalid_email'; break;
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential': key = 'error_invalid_credentials'; break;
            case 'auth/email-already-in-use': key = 'error_email_in_use'; break;
            case 'auth/weak-password': key = 'error_weak_password'; break;
            default: console.error("Firebase Auth Error:", errorCode);
        }
        showAppModal({ text: t(key) });
    };

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { email, password, regName, regSchoolName, regClassName, regEducationLevel, regLanguage } = formData;

    if (isRegister) {
      if (!regName || !email || !password || selectedRegSubjects.length === 0 || !regSchoolName || !regClassName || !regEducationLevel) {
        showAppModal({ text: t('error_fill_all_fields') });
        setIsSubmitting(false);
        return;
      }
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, `artifacts/${appId}/public/data/users`, userCredential.user.uid), {
          uid: userCredential.user.uid,
          email,
          userName: regName,
          profilePictureUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(regName)}&background=random&color=fff&size=128`,
          createdAt: Timestamp.now(),
          selectedSubjects: selectedRegSubjects,
          schoolName: regSchoolName,
          className: regClassName,
          educationLevel: regEducationLevel,
          languagePreference: regLanguage,
          themePreference: 'emerald',
        });
        // onAuthStateChanged will handle view change, so we don't need to do anything here.
        // isSubmitting will be reset implicitly when the component unmounts on successful auth.
      } catch (error: any) {
        handleAuthError(error.code);
        setIsSubmitting(false);
      }
    } else { // Login
      try {
        await signInWithEmailAndPassword(auth, email, password);
         // onAuthStateChanged will handle view change.
      } catch (error: any) {
        handleAuthError(error.code);
        setIsSubmitting(false);
      }
    }
  };

  const handlePasswordReset = async () => {
    if (!formData.email) {
      showAppModal({ text: t('error_enter_email_for_reset') });
      return;
    }
    try {
      await sendPasswordResetEmail(auth, formData.email);
      showAppModal({ text: t('password_reset_sent', { email: formData.email }) });
    } catch (error: any) {
      handleAuthError(error.code);
    }
  };

  const handleSubjectToggle = (subject: string) => {
    setSelectedRegSubjects(prev =>
      prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
    );
  };
  
  return (
    <div className={`min-h-screen w-full flex items-center justify-center p-4 animate-fade-in-slow`}>
      <div className="w-full max-w-md">
        <div className="bg-white p-8 rounded-xl shadow-2xl">
          <h2 className={`text-3xl font-bold text-center mb-6 ${getThemeClasses('text-strong')}`}>
            {isRegister ? t('register_title') : t('login_title')}
          </h2>
          <form onSubmit={handleAuthAction} className="space-y-5">
            {isRegister && (
              <FormInput name="regName" label={t('your_name')} type="text" value={formData.regName} onChange={handleInputChange} placeholder={t('placeholder_name')} disabled={isSubmitting} getThemeClasses={getThemeClasses}/>
            )}
            <FormInput name="email" label={t('email_address')} type="email" value={formData.email} onChange={handleInputChange} placeholder={t('placeholder_email')} disabled={isSubmitting} getThemeClasses={getThemeClasses}/>
            <FormInput name="password" label={t('password')} type="password" value={formData.password} onChange={handleInputChange} placeholder={t('placeholder_password')} disabled={isSubmitting} getThemeClasses={getThemeClasses}/>
            
            {isRegister && (
              <>
                <FormInput name="regSchoolName" label={t('school_name')} type="text" value={formData.regSchoolName} onChange={handleInputChange} placeholder={t('school_name')} disabled={isSubmitting} getThemeClasses={getThemeClasses}/>
                <FormInput name="regClassName" label={t('class_name')} type="text" value={formData.regClassName} onChange={handleInputChange} placeholder={t('class_name')} disabled={isSubmitting} getThemeClasses={getThemeClasses}/>
                <div>
                  <label className="block text-gray-800 text-sm font-bold mb-2">{t('education_level')}</label>
                  <select name="regEducationLevel" value={formData.regEducationLevel} onChange={handleInputChange} required disabled={isSubmitting}
                      className={`shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 ${getThemeClasses('ring')} transition-all duration-200 bg-white disabled:bg-gray-100`}>
                      <option value="">{t('Selecteer_Niveau')}</option>
                      {educationLevels.map(level => <option key={level} value={level}>{level.toUpperCase()}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                    <label className="block text-gray-800 text-sm font-bold">{t('select_subjects')}</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg">
                        {allSubjects.map(subject => (
                            <button type="button" key={subject} onClick={() => handleSubjectToggle(subject)} disabled={isSubmitting}
                                className={`p-2 text-sm font-semibold rounded-md transition-all duration-200 border-2 active:scale-95 disabled:opacity-50 ${selectedRegSubjects.includes(subject) ? `${getThemeClasses('bg')} text-white border-transparent shadow-sm` : 'bg-gray-100 hover:bg-gray-200 border-gray-100'}`}>
                                {tSubject(subject)}
                            </button>
                        ))}
                    </div>
                </div>
              </>
            )}
            
            <div className="pt-2 space-y-4">
              <button type="submit" disabled={isSubmitting} className={`w-full font-bold py-3 px-4 rounded-lg text-white ${getThemeClasses('bg')} ${getThemeClasses('hover-bg')} shadow-lg hover:shadow-xl transition-all duration-200 transform ${isRegister ? 'active:scale-[.97]' : 'active:scale-[.98]'} disabled:opacity-70 disabled:cursor-not-allowed`}>
                {isSubmitting ? 'Verwerken...' : (isRegister ? t('register_account') : t('login_button'))}
              </button>
              <button type="button" disabled={isSubmitting} onClick={() => setIsRegister(!isRegister)} className="w-full text-center py-3 px-4 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition-all duration-200 transform active:scale-[.98] shadow-sm disabled:opacity-70">
                {isRegister ? t('already_account') : t('no_account_register')}
              </button>
            </div>
          </form>
           <div className="mt-4 text-center">
            {!isRegister && (
              <button onClick={handlePasswordReset} className="text-sm font-semibold text-gray-500 hover:underline">
                {t('forgot_password')}
              </button>
            )}
          </div>
           <div className="mt-4 pt-4 border-t border-gray-200">
             <button
              type="button"
              onClick={handleGuestLogin}
              className={`w-full text-center py-2 px-4 rounded-lg bg-slate-500 text-white font-semibold hover:bg-slate-600 transition-all duration-200 transform active:scale-[.98] shadow-sm disabled:opacity-70`}
              disabled={isSubmitting}
            >
              Sla over (Testmodus)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthView;
