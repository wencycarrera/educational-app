// src/data/curriculum-skeleton.ts

export interface LessonTopic {
    id: string;
    title: string;
    description: string;
    icon: string; // The name of the icon in your asset library
    color: string; // Background color for the card
    order: number;
  }
  
  export const FIXED_CURRICULUM: LessonTopic[] = [
    {
      id: 'lesson_01',
      title: 'Lesson 1: Numbers 0–20',
      description: 'Numbers 0–20', 
      icon: 'numbers_0_20_icon',
      color: '#FF6B6B', // Red-ish
      order: 1,
    },
    {
      id: 'lesson_02',
      title: 'Lesson 2: Numbers 21–100',
      description: 'Numbers 21–100',
      icon: 'hundred_icon',
      color: '#4ECDC4', // Teal-ish
      order: 2,
    },
    {
      id: 'lesson_03',
      title: 'Lesson 3: Comparing Numbers',
      description: 'Comparing Numbers',
      icon: 'scale_icon',
      color: '#FFE66D', // Yellow-ish
      order: 3,
    },
    {
      id: 'lesson_04',
      title: 'Lesson 4: Place Value',
      description: 'Place Value',
      icon: 'blocks_icon',
      color: '#1A535C', // Dark Teal
      order: 4,
    },
    {
      id: 'lesson_05',
      title: 'Lesson 5: Ordinal & Money',
      description: 'Ordinal & Money',
      icon: 'money_icon',
      color: '#FF9F1C', // Orange
      order: 5,
    },
    {
      id: 'lesson_06',
      title: 'Lesson 6: Addition (Up to 20)',
      description: 'Addition (Up to 20)',
      icon: 'plus_icon',
      color: '#2B2D42', // Navy
      order: 6,
    },
    {
      id: 'lesson_07',
      title: 'Lesson 7: Subtraction (Up to 20)',
      description: 'Subtraction (Up to 20)',
      icon: 'minus_icon',
      color: '#9B59B6', // Purple
      order: 7,
    },
    {
      id: 'lesson_08',
      title: 'Lesson 8: Word Problems',
      description: 'Word Problems',
      icon: 'book_icon',
      color: '#E74C3C', // Red
      order: 8,
    },
    {
      id: 'lesson_09',
      title: 'Lesson 9: Shapes & Patterns',
      description: 'Shapes & Patterns',
      icon: 'shape_icon',
      color: '#3498DB', // Blue
      order: 9,
    },
    {
      id: 'lesson_10',
      title: 'Lesson 10: Measurement',
      description: 'Measurement',
      icon: 'ruler_icon',
      color: '#16A085', // Teal
      order: 10,
    },
  ];