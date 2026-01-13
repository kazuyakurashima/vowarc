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

interface AudioUrls {
  why: string;
  pain: string;
  ideal: string;
}

interface OnboardingStore {
  answers: OnboardingAnswer;
  inputTypes: InputTypes;
  audioUrls: AudioUrls;
  setAnswer: (key: keyof OnboardingAnswer, value: string) => void;
  setInputType: (key: keyof InputTypes, type: InputType) => void;
  setAudioUrl: (key: keyof AudioUrls, url: string) => void;
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
  audioUrls: {
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
  setInputType: (key, type) =>
    set((state) => ({
      inputTypes: {
        ...state.inputTypes,
        [key]: type,
      },
    })),
  setAudioUrl: (key, url) =>
    set((state) => ({
      audioUrls: {
        ...state.audioUrls,
        [key]: url,
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
      audioUrls: {
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
