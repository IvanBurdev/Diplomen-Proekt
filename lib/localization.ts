const CATEGORY_LABELS_BY_SLUG: Record<string, string> = {
  'home-kits': 'Домакински екипи',
  'away-kits': 'Гостуващи екипи',
  'third-kits': 'Трети екипи',
  'training-gear': 'Тренировъчна екипировка',
  'training-wear': 'Тренировъчна екипировка',
  'retro-kits': 'Ретро класики',
  'retro-classics': 'Ретро класики',
  accessories: 'Аксесоари',
}

const CATEGORY_LABELS_BY_NAME: Record<string, string> = {
  'Home Kits': 'Домакински екипи',
  'Away Kits': 'Гостуващи екипи',
  'Third Kits': 'Трети екипи',
  'Training Gear': 'Тренировъчна екипировка',
  'Training Wear': 'Тренировъчна екипировка',
  'Retro Kits': 'Ретро класики',
  'Retro Classics': 'Ретро класики',
  Accessories: 'Аксесоари',
}

const COLOR_LABELS_BY_VALUE: Record<string, string> = {
  white: 'Бял',
  black: 'Черен',
  red: 'Червен',
  blue: 'Син',
  green: 'Зелен',
  yellow: 'Жълт',
  navy: 'Тъмносин',
  orange: 'Оранжев',
  purple: 'Лилав',
  pink: 'Розов',
  gray: 'Сив',
  grey: 'Сив',
}

export function getCategoryLabelBg(category: { slug?: string | null; name?: string | null }) {
  if (category.slug && CATEGORY_LABELS_BY_SLUG[category.slug]) {
    return CATEGORY_LABELS_BY_SLUG[category.slug]
  }

  if (category.name && CATEGORY_LABELS_BY_NAME[category.name]) {
    return CATEGORY_LABELS_BY_NAME[category.name]
  }

  return category.name || ''
}

export function getColorLabelBg(color: string) {
  const normalized = color.trim().toLowerCase()
  return COLOR_LABELS_BY_VALUE[normalized] || color
}

