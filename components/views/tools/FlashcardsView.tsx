
import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, Timestamp, orderBy, writeBatch, getDocs, increment } from '@firebase/firestore';
import { db, appId } from '../../../services/firebase';
import type { Flashcard, FlashcardDeck, AppUser, ModalContent } from '../../../types';
import { PlusCircle, Trash2, ArrowLeft, Save } from 'lucide-react';

interface FlashcardsViewProps {
  userId: string;
  user: AppUser;
  t: (key: string, replacements?: { [key: string]: string | number }) => string;
  tSubject: (key: string) => string;
  getThemeClasses: (variant: string) => string;
  showAppModal: (content: ModalContent) => void;
}

const FlashcardsView: React.FC<FlashcardsViewProps> = ({ userId, user, t, tSubject, getThemeClasses, showAppModal }) => {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<FlashcardDeck | null>(null);
  
  const [newDeckName, setNewDeckName] = useState('');
  
  // State for bulk-adding cards
  const [cardRows, setCardRows] = useState(Array.from({ length: 10 }, () => ({ question: '', answer: '' })));

  const userSubjects = user.selectedSubjects || [];
  
  // Fetch decks for the selected subject
  useEffect(() => {
    if (!selectedSubject || user.uid === 'guest-user') {
      setDecks([]);
      return;
    }
    const q = query(
      collection(db, `artifacts/${appId}/users/${userId}/flashcardDecks`),
      where('subject', '==', selectedSubject),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, snapshot => {
      setDecks(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as FlashcardDeck)));
    });
    return () => unsubscribe();
  }, [userId, selectedSubject, user.uid]);

  const handleCreateDeck = async () => {
    if (user.uid === 'guest-user') {
        showAppModal({ text: t('error_guest_action_not_allowed') });
        return;
    }
    if (!newDeckName.trim() || !selectedSubject) {
        showAppModal({ text: t('error_empty_deck_name') });
        return;
    }
    await addDoc(collection(db, `artifacts/${appId}/users/${userId}/flashcardDecks`), {
        name: newDeckName,
        subject: selectedSubject,
        ownerId: userId,
        createdAt: Timestamp.now(),
        cardCount: 0,
    });
    showAppModal({text: t('deck_added_success')});
    setNewDeckName('');
  };

  const handleDeleteDeck = async (deck: FlashcardDeck) => {
    if (user.uid === 'guest-user') {
        showAppModal({ text: t('error_guest_action_not_allowed') });
        return;
    }
    showAppModal({
        text: t('confirm_delete_deck', { name: deck.name }),
        confirmAction: async () => {
            const batch = writeBatch(db);
            const deckRef = doc(db, `artifacts/${appId}/users/${userId}/flashcardDecks`, deck.id);
            const cardsQuery = query(collection(deckRef, 'cards'));
            const cardsSnapshot = await getDocs(cardsQuery);
            cardsSnapshot.forEach(cardDoc => batch.delete(cardDoc.ref));
            batch.delete(deckRef);
            await batch.commit();
            showAppModal({text: t('deck_deleted_success')});
            setSelectedDeck(null);
        },
        cancelAction: () => {}
    });
  };
  
  const handleRowInputChange = (index: number, field: 'question' | 'answer', value: string) => {
    const newRows = [...cardRows];
    newRows[index][field] = value;
    setCardRows(newRows);
  };
  
  const addMoreRows = () => {
    setCardRows(prev => [...prev, ...Array.from({ length: 5 }, () => ({ question: '', answer: '' }))]);
  };

  const handleSaveCards = async () => {
    if (!selectedDeck) return;
    if (user.uid === 'guest-user') {
        showAppModal({ text: t('error_guest_action_not_allowed') });
        return;
    }
    const batch = writeBatch(db);
    const deckRef = doc(db, `artifacts/${appId}/users/${userId}/flashcardDecks`, selectedDeck.id);
    let cardsAddedCount = 0;

    cardRows.forEach(row => {
        if (row.question.trim() && row.answer.trim()) {
            const cardRef = doc(collection(deckRef, 'cards'));
            batch.set(cardRef, {
                question: row.question,
                answer: row.answer,
                ownerId: userId,
                createdAt: Timestamp.now()
            });
            cardsAddedCount++;
        }
    });

    if (cardsAddedCount > 0) {
        batch.update(deckRef, { cardCount: increment(cardsAddedCount) });
        await batch.commit();
        showAppModal({ text: t('flashcard_added_success') });
        setCardRows(Array.from({ length: 10 }, () => ({ question: '', answer: '' }))); // Reset form
    } else {
        showAppModal({ text: t('error_empty_flashcard') });
    }
  };


  if (!selectedSubject) {
    return (
      <div className={`p-4 rounded-lg shadow-inner ${getThemeClasses('bg-light')} space-y-4`}>
        <h3 className="font-bold text-lg text-center">{t('select_a_subject_first')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {userSubjects.map(s => (
            <button key={s} onClick={() => setSelectedSubject(s)} className="p-4 bg-white rounded-lg shadow-md font-semibold hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
              {tSubject(s)}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!selectedDeck) {
    return (
      <div className={`p-4 rounded-lg shadow-inner ${getThemeClasses('bg-light')} space-y-4`}>
        <button onClick={() => setSelectedSubject(null)} className="font-semibold flex items-center gap-1 hover:underline"><ArrowLeft size={16}/> {t('back_to_subjects_selection')}</button>
        <h3 className="font-bold text-lg text-center">{t('decks_for_subject', { subject: tSubject(selectedSubject) })}</h3>
        <div className="bg-white p-3 rounded-lg shadow-sm flex gap-2">
            <input value={newDeckName} onChange={e => setNewDeckName(e.target.value)} placeholder={t('deck_name_placeholder')} className="flex-grow p-2 border rounded-lg"/>
            <button onClick={handleCreateDeck} className={`flex items-center text-white font-bold p-2 rounded-lg ${getThemeClasses('bg')} ${getThemeClasses('hover-bg')}`}><PlusCircle size={20}/></button>
        </div>
        <div className="space-y-2">
            {decks.length === 0 ? <p className="text-center italic text-gray-500 py-4">{t('no_decks_found')}</p> :
             decks.map(deck => (
                <div key={deck.id} className="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center">
                    <button onClick={() => setSelectedDeck(deck)} className="text-left flex-grow">
                        <p className="font-semibold">{deck.name}</p>
                        <p className="text-sm text-gray-500">{t('cards_in_deck', { count: deck.cardCount || 0 })}</p>
                    </button>
                    <button onClick={() => handleDeleteDeck(deck)} className="p-2 text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors active:scale-90"><Trash2 className="w-4 h-4"/></button>
                </div>
            ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg shadow-inner ${getThemeClasses('bg-light')} space-y-4`}>
        <button onClick={() => setSelectedDeck(null)} className="font-semibold flex items-center gap-1 hover:underline"><ArrowLeft size={16}/> {t('back_to_decks')}</button>
        <h3 className="font-bold text-lg text-center">{t('add_flashcard')} - {selectedDeck.name}</h3>
        
        <div className="space-y-3">
          {cardRows.map((row, index) => (
            <div key={index} className="flex flex-col sm:flex-row gap-2 items-center bg-white p-2 rounded-lg shadow-sm">
                <span className="font-semibold text-gray-400 hidden sm:inline">{index + 1}</span>
                <textarea
                    placeholder={`${t('question')} ${index + 1}`}
                    value={row.question}
                    onChange={e => handleRowInputChange(index, 'question', e.target.value)}
                    className="w-full p-2 border rounded-md"
                    rows={1}
                />
                <textarea
                    placeholder={`${t('answer')} ${index + 1}`}
                    value={row.answer}
                    onChange={e => handleRowInputChange(index, 'answer', e.target.value)}
                    className="w-full p-2 border rounded-md"
                    rows={1}
                />
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center gap-4">
            <button onClick={addMoreRows} className="py-2 px-4 rounded-lg bg-gray-200 hover:bg-gray-300 font-semibold transition-colors active:scale-95">
              {t('add_more_rows')}
            </button>
            <button onClick={handleSaveCards} className={`flex items-center gap-2 py-2 px-4 rounded-lg text-white font-bold ${getThemeClasses('bg')} ${getThemeClasses('hover-bg')} transition-colors active:scale-95`}>
                <Save className="w-5 h-5"/> {t('save_note_button')}
            </button>
        </div>
    </div>
  );
};

export default FlashcardsView;
