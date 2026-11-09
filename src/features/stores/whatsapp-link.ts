/** Tautan wa.me dengan pesan pembuka; nomor dibersihkan dari karakter non-digit. */
export function whatsappLink(phone: string, message: string): string {
  return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
}
