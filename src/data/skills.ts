import {
  BookOpen,
  BriefcaseBusiness,
  Code2,
  Dumbbell,
  Languages,
  Music2,
  Palette,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'
import type { SkillCategory, SkillEntry } from '@/types'

export interface SkillCategoryMeta {
  category: SkillCategory
  icon: LucideIcon
  accent: string
  skills: string[]
}

export const skillCategories: SkillCategoryMeta[] = [
  {
    category: 'Music',
    icon: Music2,
    accent: 'from-rose-500 to-orange-400',
    skills: ['Guitar', 'Piano', 'Singing', 'Violin', 'Music Theory'],
  },
  {
    category: 'Tech',
    icon: Code2,
    accent: 'from-indigo-500 to-sky-500',
    skills: ['Python', 'Web Dev', 'Excel', 'UI Design', 'Data Analysis'],
  },
  {
    category: 'Creative',
    icon: Palette,
    accent: 'from-fuchsia-500 to-pink-500',
    skills: ['Drawing', 'Video Editing', 'Photography', 'Animation', 'Branding'],
  },
  {
    category: 'Wellness',
    icon: Dumbbell,
    accent: 'from-emerald-500 to-teal-500',
    skills: ['Yoga', 'Meditation', 'Fitness', 'Pilates', 'Breathwork'],
  },
  {
    category: 'Lifestyle',
    icon: UtensilsCrossed,
    accent: 'from-amber-500 to-yellow-400',
    skills: ['Cooking', 'Baking', 'Gardening', 'Meal Prep', 'Coffee Brewing'],
  },
  {
    category: 'Academic',
    icon: BookOpen,
    accent: 'from-blue-500 to-cyan-500',
    skills: ['Maths', 'English', 'Physics', 'Chemistry', 'Essay Writing'],
  },
  {
    category: 'Business',
    icon: BriefcaseBusiness,
    accent: 'from-violet-500 to-purple-500',
    skills: ['Marketing', 'Finance', 'Public Speaking', 'Sales', 'Negotiation'],
  },
  {
    category: 'Languages',
    icon: Languages,
    accent: 'from-teal-500 to-cyan-500',
    skills: ['Hindi', 'Spanish', 'French', 'Japanese', 'German'],
  },
]

export const allSkills = skillCategories.flatMap((entry) =>
  entry.skills.map((skill) => ({
    category: entry.category,
    name: skill,
  })),
)

export function createSkill(
  id: string,
  name: string,
  category: SkillCategory,
  level: SkillEntry['level'] = 'Intermediate',
) {
  return {
    id,
    name,
    category,
    level,
  } satisfies SkillEntry
}
