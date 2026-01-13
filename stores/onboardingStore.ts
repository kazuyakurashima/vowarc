import { create } from 'zustand';

interface OnboardingAnswer {
  why: string;
  pain: string;
  ideal: string;
}

type InputType = 'text' | 'voice';

interface InputTypes {
  why: InputType;
  pain: InputType;
  ideal: InputType;
}

interface OnboardingStore {
  answers: OnboardingAnswer;
  inputTypes: InputTypes;
  setAnswer: (key: keyof OnboardingAnswer, value: string) => void;
  setInputType: (key: keyof InputTypes, type: InputType) => void;
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
  inputTypes: {
    why: 'text',
    pain: 'text',
    ideal: 'text',
  },
  setAnswer: (key, value) =>
    set((state) => ({
      answers: {
        ...state.answers,
        [key]: value,
      },
    })),
  setInputType: (key, type) =>
    set((state) => ({
      inputTypes: {
        ...state.inputTypes,
        [key]: type,
      },
    })),
  clearAnswers: () =>
    set({
      answers: {
        why: '',
        pain: '',
        ideal: '',
      },
      inputTypes: {
        why: 'text',
        pain: 'text',
        ideal: 'text',
      },
      generatedMeaning: '',
      generatedVow: '',
    }),
  generatedMeaning: '',
  generatedVow: '',
  setGeneratedMeaning: (meaning) => set({ generatedMeaning: meaning }),
  setGeneratedVow: (vow) => set({ generatedVow: vow }),
}));
