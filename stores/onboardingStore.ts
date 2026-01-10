import { create } from 'zustand';

interface OnboardingAnswer {
  why: string;
  pain: string;
  ideal: string;
}

interface OnboardingStore {
  answers: OnboardingAnswer;
  setAnswer: (key: keyof OnboardingAnswer, value: string) => void;
  clearAnswers: () => void;
  generatedMeaning: string;
  generatedVow: string;
  setGeneratedMeaning: (meaning: string) => void;
  setGeneratedVow: (vow: string) => void;
}

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  answers: {
    why: '',
    pain: '',
    ideal: '',
  },
  setAnswer: (key, value) =>
    set((state) => ({
      answers: {
        ...state.answers,
        [key]: value,
      },
    })),
  clearAnswers: () =>
    set({
      answers: {
        why: '',
        pain: '',
        ideal: '',
      },
      generatedMeaning: '',
      generatedVow: '',
    }),
  generatedMeaning: '',
  generatedVow: '',
  setGeneratedMeaning: (meaning) => set({ generatedMeaning: meaning }),
  setGeneratedVow: (vow) => set({ generatedVow: vow }),
}));
