// i18n.js
const translations = {
  en: {
    select_lang: "🇬🇧 Please select your language / Пожалуйста, выберите язык / Iltimos, tilni tanlang:",
    welcome: "🎨 *Welcome to Presentation Bot!* 🎨\n\nGenerate high-quality slide decks in seconds using AI and edit them live in our Web Mini App.\n\n*Features:*\n• 8-10 slides with professional content\n• 3 implementation plans and Q&A section\n• Export to PDF and PPTX\n• Easy visual editing",
    btn_start_creating: "🚀 Start Creating",
    btn_my_presentations: "📁 My Presentations",
    btn_open_editor: "🎨 Open Presentation Editor",
    btn_download_pptx: "📥 PPTX",
    btn_download_pdf: "📥 PDF",
    cmd_help: "🤖 *Help* 🤖\n\n1. Press \"Start Creating\" or send /create.\n2. Choose a topic and audience.\n3. The presentation will be generated, and you'll preview it in different styles.\n4. Select a style, complete the dummy payment, and send the receipt screenshot here.\n5. Once approved, you can download the PDF/PPTX or edit slides.",
    free_limit_reached: "⚠️ Free limit reached (5 presentations). Upgrade to continue.",
    enter_title: "✍️ Send the *Presentation Title* you want to create.",
    choose_audience: "Great! Now choose the *Target Audience*:",
    audience_students: "👨‍🎓 Students",
    audience_teachers: "👩‍🏫 Teachers",
    audience_business: "💼 Business",
    audience_investors: "💰 Investors",
    audience_general: "🌍 General",
    config_done: "🎉 *Presentation Configured!* 🎉\n\n• Title: {title}\n• Audience: {audience}\n\nClick below to open the Mini App to choose style and preview slides.",
    payment_request: "💳 *Payment Verification Required* 💳\n\nTo unlock and download this presentation, please pay to the following card:\n\n*Card Number:* `8600 1234 5678 9012` (Dummy Card)\n*Amount:* 49,000 UZS\n\n👇 Please send the receipt screenshot or photo here in the chat.",
    payment_submitted: "🕒 *Receipt Received!* \nYour payment is being verified by the admin. You will be notified as soon as it is approved.",
    admin_pending_title: "🔔 *New Payment Submission* 🔔\n\n• User: @{username} (ID: {tgId})\n• Name: {name}\n• Presentation: *{title}* (ID: {presId})\n\nPlease verify the attached receipt image.",
    admin_approve_btn: "✅ Approve",
    admin_reject_btn: "❌ Reject",
    payment_approved: "🎉 *Payment Approved!* 🎉\n\nYour presentation *\"{title}\"* is now unlocked!\n\nYou can now:\n• Download PDF or PPTX\n• Change styles and edit slides in the editor.",
    payment_rejected: "⚠️ *Payment Rejected* ⚠️\n\nYour payment verification for *\"{title}\"* was rejected by the admin. Please send the correct receipt photo again.",
    not_approved_yet: "🔒 This presentation is locked. Please complete the payment and get admin approval first.",
    no_decks: "You have no presentations yet. Use /create to begin.",
    select_deck: "📁 *Select a presentation:*",
    banned: "⚠️ You have been banned by the administrator.",
    invalid_receipt: "⚠️ Please send an image/photo of your payment receipt.",
    my_account: "👤 *My Account*\n\n• ID: `{tgId}`\n• Plan: `{sub}`\n• Presentations: `{count}`"
  },
  ru: {
    select_lang: "🇷🇺 Пожалуйста, выберите язык:",
    welcome: "🎨 *Добро пожаловать в Presentation Bot!* 🎨\n\nСоздавайте презентации высокого качества за секунды с помощью ИИ и редактируйте их в Mini App.\n\n*Возможности:*\n• 8-10 слайдов с профессиональным текстом\n• 3 тарифных плана и раздел Вопросы и Ответы (Q&A)\n• Экспорт в PDF и PPTX\n• Удобное визуальное редактирование",
    btn_start_creating: "🚀 Создать презентацию",
    btn_my_presentations: "📁 Мои презентации",
    btn_open_editor: "🎨 Открыть редактор",
    btn_download_pptx: "📥 PPTX",
    btn_download_pdf: "📥 PDF",
    cmd_help: "🤖 *Справка* 🤖\n\n1. Нажмите \"Создать презентацию\" или отправьте /create.\n2. Укажите тему и аудиторию.\n3. Презентация будет создана, и вы сможете оценить ее в разных стилях.\n4. Выберите стиль, сделайте тестовый платеж и отправьте скриншот чека сюда в чат.\n5. После одобрения админом вы сможете скачать PDF/PPTX или редактировать её.",
    free_limit_reached: "⚠️ Достигнут лимит (5 презентаций). Обновите аккаунт для продолжения.",
    enter_title: "✍️ Отправьте *Название презентации*, которую хотите создать.",
    choose_audience: "Отлично! Теперь выберите *Целевую аудиторию*:",
    audience_students: "👨‍🎓 Студенты",
    audience_teachers: "👩‍🏫 Учителя",
    audience_business: "💼 Бизнес",
    audience_investors: "💰 Инвесторы",
    audience_general: "🌍 Общая аудитория",
    config_done: "🎉 *Настройка завершена!* 🎉\n\n• Название: {title}\n• Аудитория: {audience}\n\nНажмите ниже, чтобы открыть Mini App, выбрать стиль и просмотреть слайды.",
    payment_request: "💳 *Требуется подтверждение оплаты* 💳\n\nЧтобы разблокировать и скачать эту презентацию, пожалуйста, переведите оплату на карту:\n\n*Номер карты:* `8600 1234 5678 9012` (Тестовая карта)\n*Сумма:* 49,000 UZS\n\n👇 Отправьте скриншот или фото чека об оплате сюда в чат.",
    payment_submitted: "🕒 *Чек получен!* \nВаш платеж проверяется администратором. Вы получите уведомление, как только он будет одобрен.",
    admin_pending_title: "🔔 *Новый платеж на проверку* 🔔\n\n• Пользователь: @{username} (ID: {tgId})\n• Имя: {name}\n• Презентация: *{title}* (ID: {presId})\n\nПожалуйста, проверьте прикрепленное фото чека.",
    admin_approve_btn: "✅ Одобрить",
    admin_reject_btn: "❌ Отклонить",
    payment_approved: "🎉 *Платеж одобрен!* 🎉\n\nВаша презентация *\"{title}\"* успешно разблокирована!\n\nТеперь вы можете:\n• Скачать PDF или PPTX\n• Менять стили и редактировать слайды в редакторе.",
    payment_rejected: "⚠️ *Платеж отклонен* ⚠️\n\nПодтверждение оплаты для *\"{title}\"* было отклонено администратором. Пожалуйста, отправьте правильное фото чека еще раз.",
    not_approved_yet: "🔒 Эта презентация заблокирована. Пожалуйста, произведите оплату и дождитесь одобрения администратора.",
    no_decks: "У вас пока нет презентаций. Используйте /create, чтобы начать.",
    select_deck: "📁 *Выберите презентацию:*",
    banned: "⚠️ Вы заблокированы администратором.",
    invalid_receipt: "⚠️ Пожалуйста, отправьте изображение/фото чека об оплате.",
    my_account: "👤 *Мой аккаунт*\n\n• ID: `{tgId}`\n• Тариф: `{sub}`\n• Презентаций: `{count}`"
  },
  uz: {
    select_lang: "🇺🇿 Iltimos, tilni tanlang:",
    welcome: "🎨 *Taqdimot Botiga xush kelibsiz!* 🎨\n\nAI yordamida soniyalar ichida yuqori sifatli slaydlar yarating va ularni Web Mini ilovamizda tahrirlang.\n\n*Imkoniyatlar:*\n• 8-10 professional slaydlar\n• 3 xil reja va Savol-Javob (Q&A) bo'limi\n• PDF va PPTX formatida yuklab olish\n• Oson vizual tahrirlash",
    btn_start_creating: "🚀 Taqdimot yaratish",
    btn_my_presentations: "📁 Mening taqdimotlarim",
    btn_open_editor: "🎨 Tahrirlovchini ochish",
    btn_download_pptx: "📥 PPTX",
    btn_download_pdf: "📥 PDF",
    cmd_help: "🤖 *Yordam* 🤖\n\n1. \"Taqdimot yaratish\" tugmasini bosing yoki /create yuboring.\n2. Mavzu va auditoriyani tanlang.\n3. Taqdimot yaratiladi va uni turli uslublarda ko'rishingiz mumkin.\n4. Uslubni tanlang, to'lovni (dummy) amalga oshiring va chek rasmini shu yerga yuboring.\n5. Admin tasdiqlagach, PDF/PPTX yuklab olishingiz yoki tahrirlashingiz mumkin.",
    free_limit_reached: "⚠️ Bepul limit tugadi (5 ta taqdimot). Davom etish uchun tarifni yangilang.",
    enter_title: "✍️ Yaratmoqchi bo'lgan *Taqdimot nomini* yuboring.",
    choose_audience: "Ajoyib! Endi *Auditoriyani* tanlang:",
    audience_students: "👨‍🎓 Talabalar",
    audience_teachers: "👩‍🏫 O'qituvchilar",
    audience_business: "💼 Biznes",
    audience_investors: "💰 Investorlar",
    audience_general: "🌍 Umumiy auditoriya",
    config_done: "🎉 *Taqdimot sozlandi!* 🎉\n\n• Nomi: {title}\n• Auditoriya: {audience}\n\nUslubni tanlash va slaydlarni ko'rish uchun pastdagi Mini ilovani oching.",
    payment_request: "💳 *To'lovni tasdiqlash talab qilinadi* 💳\n\nTaqdimotni ochish va yuklab olish uchun quyidagi kartaga to'lov qiling:\n\n*Karta raqami:* `8600 1234 5678 9012` (Test karta)\n*Summa:* 49,000 UZS\n\n👇 To'lov chekining skrinshoti yoki rasmini shu yerga yuboring.",
    payment_submitted: "🕒 *Chek qabul qilindi!* \nTo'lovingiz admin tomonidan tekshirilmoqda. Tasdiqlanishi bilan sizga xabar beramiz.",
    admin_pending_title: "🔔 *Yangi to'lov cheki* 🔔\n\n• Foydalanuvchi: @{username} (ID: {tgId})\n• Ism: {name}\n• Taqdimot: *{title}* (ID: {presId})\n\nIltimos, ilova qilingan chek rasmini tekshiring.",
    admin_approve_btn: "✅ Tasdiqlash",
    admin_reject_btn: "❌ Rad etish",
    payment_approved: "🎉 *To'lov tasdiqlandi!* 🎉\n\nSizning *\"{title}\"* taqdimotingiz blokdan ochildi!\n\nEndi siz:\n• PDF yoki PPTX yuklab olishingiz\n• Mini ilovada slaydlarni tahrirlashingiz va uslublarni o'zgartirishingiz mumkin.",
    payment_rejected: "⚠️ *To'lov rad etildi* ⚠️\n\n*\"{title}\"* taqdimoti uchun to'lov admin tomonidan rad etildi. Iltimos, to'g'ri chek rasmini qayta yuboring.",
    not_approved_yet: "🔒 Ushbu taqdimot bloklangan. Iltimos, to'lovni amalga oshiring va admin tasdiqlashini kuting.",
    no_decks: "Sizda hali taqdimotlar yo'q. Boshlash uchun /create yuboring.",
    select_deck: "📁 *Taqdimotni tanlang:*",
    banned: "⚠️ Siz administrator tomonidan bloklangansiz.",
    invalid_receipt: "⚠️ Iltimos, to'lov chekining rasmini yuboring.",
    my_account: "👤 *Mening hisobim*\n\n• ID: `{tgId}`\n• Tarif: `{sub}`\n• Taqdimotlar: `{count}`"
  }
};

function getTranslation(lang, key, replacements = {}) {
  const selectedLang = translations[lang] ? lang : 'en';
  let text = translations[selectedLang][key] || translations['en'][key] || key;
  
  Object.keys(replacements).forEach(placeholder => {
    text = text.replace(new RegExp(`{${placeholder}}`, 'g'), replacements[placeholder]);
  });
  
  return text;
}

module.exports = {
  translations,
  getTranslation
};
