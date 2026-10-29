export const formatPrice = (value: number, currency = 'GBP', locale = 'en-GB') =>
  new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value)
