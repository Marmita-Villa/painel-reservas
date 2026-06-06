export type Lang = "pt" | "en";

export const translations = {
  pt: {
    // Widget — geral
    reserveTable: "Reservar uma mesa",
    viewMenu: "Ver cardápio",
    instantConfirmation: "Confirmação",
    instantConfirmationSub: "instantânea",
    free: "Gratuito",
    freeSub: "sem taxas",
    noSignup: "Sem cadastro",
    noSignupSub: "reserva rápida",
    daysAvailable: "dias disponíveis",

    // Widget — steps
    whichDate: "Qual data?",
    selectDay: "Selecione o dia da sua visita",
    whatTime: "Que horas?",
    lunch: "Almoço",
    dinner: "Jantar",
    howManyPeople: "Quantas pessoas?",
    largeGroups: "Grupos maiores:",
    continueWith: "Continuar com",
    person: "pessoa",
    people: "pessoas",
    yourDetails: "Seus dados",
    toConfirmReservation: "Para confirmar sua reserva",
    fullName: "Nome completo *",
    whatsappPhone: "WhatsApp / Telefone *",
    specialOccasion: "Ocasião especial",
    optional: "opcional",
    notes: "Observações",
    notesPlaceholder: "Alergias, preferências, cadeirinha...",
    reviewReservation: "Revisar reserva",
    confirmReservation: "Confirmar Reserva",
    reservationConfirmed: "Reserva confirmada!",
    seeYouSoon: "Te esperamos,",
    anotherReservation: "Fazer outra reserva",
    confirmationSentTo: "Confirmação enviada para",

    // Details labels
    date: "Data",
    time: "Horário",
    persons: "Pessoas",
    local: "Local",
    name: "Nome",
    phone: "Telefone",
    occasion: "Ocasião",
    obs: "Obs.",

    // Confirm step
    reviewData: "Revise os dados antes de confirmar",
    whatsappConfirmation: "Você receberá uma confirmação no WhatsApp.",

    // Occasions
    birthday: "Aniversário 🎂",
    romance: "Namoro 💑",
    business: "Negócios 💼",
    graduation: "Formatura 🎓",
    engagement: "Noivado 💍",
    other: "Outro",

    // Calendar
    available: "Disponível",
    fewSlots: "Poucos horários",

    // Errors
    errorConfirm: "Erro ao confirmar. Tente novamente.",

    // Cardápio
    menuTitle: "Cardápio",
    itemsInMenu: "itens no cardápio",
    makeReservation: "Fazer uma reserva",
    menuComingSoon: "Cardápio em breve",
    menuComingSoonDesc: "O restaurante está montando o cardápio digital.",

    // Fila
    joinQueue: "Entrar na fila",
    waitingQueue: "Fila de espera",
    yourPosition: "Sua posição",
    estimatedWait: "Espera estimada",
    minutes: "min",
    inQueue: "na fila",
    queueEmpty: "Fila vazia",
    enterQueue: "Entrar na fila",
    yourName: "Seu nome",
    yourPhone: "Seu WhatsApp",
    partySizeLabel: "Quantas pessoas?",
    joinNow: "Entrar na fila agora",
    youAreIn: "Você está na fila!",
    tableReady: "Sua mesa está pronta!",
    goToRestaurant: "Por favor, dirija-se ao restaurante.",

    // Language toggle
    language: "Idioma",
  },
  en: {
    // Widget — general
    reserveTable: "Reserve a table",
    viewMenu: "View menu",
    instantConfirmation: "Instant",
    instantConfirmationSub: "confirmation",
    free: "Free",
    freeSub: "no fees",
    noSignup: "No signup",
    noSignupSub: "quick booking",
    daysAvailable: "days available",

    // Widget — steps
    whichDate: "Which date?",
    selectDay: "Select the day of your visit",
    whatTime: "What time?",
    lunch: "Lunch",
    dinner: "Dinner",
    howManyPeople: "How many people?",
    largeGroups: "Larger groups:",
    continueWith: "Continue with",
    person: "person",
    people: "people",
    yourDetails: "Your details",
    toConfirmReservation: "To confirm your reservation",
    fullName: "Full name *",
    whatsappPhone: "WhatsApp / Phone *",
    specialOccasion: "Special occasion",
    optional: "optional",
    notes: "Notes",
    notesPlaceholder: "Allergies, preferences, high chair...",
    reviewReservation: "Review reservation",
    confirmReservation: "Confirm Reservation",
    reservationConfirmed: "Reservation confirmed!",
    seeYouSoon: "See you soon,",
    anotherReservation: "Make another reservation",
    confirmationSentTo: "Confirmation sent to",

    // Details labels
    date: "Date",
    time: "Time",
    persons: "Guests",
    local: "Location",
    name: "Name",
    phone: "Phone",
    occasion: "Occasion",
    obs: "Notes",

    // Confirm step
    reviewData: "Review your details before confirming",
    whatsappConfirmation: "You will receive a confirmation on WhatsApp.",

    // Occasions
    birthday: "Birthday 🎂",
    romance: "Date night 💑",
    business: "Business 💼",
    graduation: "Graduation 🎓",
    engagement: "Engagement 💍",
    other: "Other",

    // Calendar
    available: "Available",
    fewSlots: "Few slots",

    // Errors
    errorConfirm: "Error confirming. Please try again.",

    // Cardápio / Menu
    menuTitle: "Menu",
    itemsInMenu: "items on the menu",
    makeReservation: "Make a reservation",
    menuComingSoon: "Menu coming soon",
    menuComingSoonDesc: "The restaurant is building the digital menu.",

    // Fila / Queue
    joinQueue: "Join the queue",
    waitingQueue: "Waiting queue",
    yourPosition: "Your position",
    estimatedWait: "Estimated wait",
    minutes: "min",
    inQueue: "in queue",
    queueEmpty: "Queue is empty",
    enterQueue: "Join the queue",
    yourName: "Your name",
    yourPhone: "Your WhatsApp",
    partySizeLabel: "How many people?",
    joinNow: "Join the queue now",
    youAreIn: "You are in the queue!",
    tableReady: "Your table is ready!",
    goToRestaurant: "Please head to the restaurant.",

    // Language toggle
    language: "Language",
  },
} as const;

export type TranslationKey = keyof typeof translations["pt"];

export function t(lang: Lang, key: TranslationKey): string {
  return translations[lang][key] ?? translations["pt"][key] ?? key;
}
