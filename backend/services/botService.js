// botService.js
const { Telegraf, Markup } = require('telegraf');
const { User, Presentation, Slide, Export, logSystemEvent } = require('./dbService');
const { generatePPTX, generatePDF } = require('./exportService');
const { getTranslation } = require('../utils/i18n');
const logger = require('../utils/logger');

// In‑memory wizard sessions
const sessions = new Map();
function getOrCreateSession(telegramId) {
  const id = String(telegramId);
  if (!sessions.has(id)) {
    sessions.set(id, { step: 'IDLE', title: '', audience: 'General' });
  }
  return sessions.get(id);
}
function clearSession(telegramId) {
  sessions.delete(String(telegramId));
}

// Global bot instance
let botInstance = null;
function getBotInstance() {
  return botInstance;
}

// Telegram rejects inline keyboard URLs pointing at localhost/loopback/private
function isPubliclyAccessible(url) {
  try {
    const { protocol, hostname } = new URL(url);
    if (protocol !== 'http:' && protocol !== 'https:') return false;
    if (['localhost', '127.0.0.1', '0.0.0.0', '::1'].includes(hostname)) return false;
    if (hostname.endsWith('.local')) return false;
    if (/^10\.|^192\.168\.|^172\.(1[6-9]|2\d|3[01])\./.test(hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

/** Initialise and start the Telegram bot */
function initBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    logger.warn('TELEGRAM_BOT_TOKEN is missing – bot will not start.');
    return null;
  }
  const bot = new Telegraf(token);
  botInstance = bot;
  
  const MINI_APP_URL = (process.env.MINI_APP_URL || 'http://localhost:5173').replace(/\/+$/, '');

  function miniAppButton(label, url) {
    if (!isPubliclyAccessible(url)) return null;
    if (url.startsWith('https://')) {
      return Markup.button.webApp(label, url);
    }
    return Markup.button.url(label, url);
  }

  function buildKeyboard(rows) {
    const filtered = rows
      .map(row => row.filter(Boolean))
      .filter(row => row.length > 0);
    return filtered.length ? Markup.inlineKeyboard(filtered) : {};
  }

  // Middleware – ensure a User document exists
  bot.use(async (ctx, next) => {
    if (!ctx.from) return next();
    const telegramId = String(ctx.from.id);
    const role = (ctx.from.username && ctx.from.username.toLowerCase() === 'identitynull') ? 'ADMIN' : 'USER';
    try {
      let user = await User.findOne({ telegramId });
      if (!user) {
        user = await User.create({
          telegramId,
          username: ctx.from.username || null,
          firstName: ctx.from.first_name || null,
          lastName: ctx.from.last_name || null,
          subscription: 'FREE',
          role
        });
        logger.info(`New user registered: ${ctx.from.username || telegramId}`);
        await logSystemEvent('user_registration', `New Telegram user: ${telegramId}`, user._id);
      } else if (user.isBanned) {
        return ctx.reply('⚠️ You have been banned by the administrator and cannot use this service.');
      } else {
        if (user.username !== ctx.from.username || user.firstName !== ctx.from.first_name || user.role !== role) {
          user.username = ctx.from.username || null;
          user.firstName = ctx.from.first_name || null;
          user.lastName = ctx.from.last_name || null;
          user.role = role;
          await user.save();
        }
      }
      ctx.dbUser = user;
    } catch (err) {
      logger.error('User middleware error: %O', err);
    }
    return next();
  });

  // /start – welcome message & language choice
  bot.start(async ctx => {
    if (!ctx.dbUser.language) {
      return ctx.reply(
        "🇬🇧 Please select your language / Пожалуйста, выберите язык / Iltimos, tilni tanlang:",
        Markup.inlineKeyboard([
          [Markup.button.callback("🇬🇧 English", "lang_en")],
          [Markup.button.callback("🇷🇺 Русский", "lang_ru")],
          [Markup.button.callback("🇺🇿 O'zbekcha", "lang_uz")]
        ])
      );
    }

    const lang = ctx.dbUser.language;
    const welcome = getTranslation(lang, 'welcome');
    const appButton = miniAppButton(getTranslation(lang, 'btn_open_editor'), MINI_APP_URL);

    await ctx.reply(welcome, {
      parse_mode: 'Markdown',
      ...buildKeyboard([
        [appButton],
        [Markup.button.callback(getTranslation(lang, 'btn_start_creating'), 'cmd_create')],
        [Markup.button.callback(getTranslation(lang, 'btn_my_presentations'), 'cmd_my')]
      ])
    });
  });

  // /lang – change language selection
  bot.command('lang', async ctx => {
    await ctx.reply(
      "🇬🇧 Please select your language / Пожалуйста, выберите язык / Iltimos, tilni tanlang:",
      Markup.inlineKeyboard([
        [Markup.button.callback("🇬🇧 English", "lang_en")],
        [Markup.button.callback("🇷🇺 Русский", "lang_ru")],
        [Markup.button.callback("🇺🇿 O'zbekcha", "lang_uz")]
      ])
    );
  });

  // /help – usage details
  bot.help(async ctx => {
    const lang = ctx.dbUser.language || 'en';
    await ctx.reply(getTranslation(lang, 'cmd_help'), { parse_mode: 'Markdown' });
  });

  // /account – simple stats
  bot.command('account', async ctx => {
    const lang = ctx.dbUser.language || 'en';
    try {
      const presCount = await Presentation.countDocuments({ userId: ctx.dbUser._id });
      const msg = getTranslation(lang, 'my_account', {
        tgId: ctx.dbUser.telegramId,
        sub: ctx.dbUser.subscription,
        count: presCount
      });
      await ctx.reply(msg, { parse_mode: 'Markdown' });
    } catch (err) {
      logger.error('Account command error: %O', err);
      await ctx.reply('Could not load account details.');
    }
  });

  // /create – start the wizard
  const startWizard = async ctx => {
    const lang = ctx.dbUser.language || 'en';
    const session = getOrCreateSession(ctx.from.id);
    if (ctx.dbUser.subscription === 'FREE') {
      const cnt = await Presentation.countDocuments({ userId: ctx.dbUser._id });
      if (cnt >= 5) return ctx.reply(getTranslation(lang, 'free_limit_reached'));
    }
    session.step = 'WIZARD_TITLE';
    await ctx.reply(getTranslation(lang, 'enter_title'), { parse_mode: 'Markdown' });
  };
  bot.command('create', startWizard);
  bot.action('cmd_create', startWizard);

  // /my – list user presentations
  const listDecks = async ctx => {
    const lang = ctx.dbUser.language || 'en';
    try {
      const list = await Presentation.find({ userId: ctx.dbUser._id })
        .sort({ createdAt: -1 })
        .limit(10);
      if (!list.length) return ctx.reply(getTranslation(lang, 'no_decks'));
      const buttons = list.map(p => {
        const lockIcon = p.paymentStatus === 'APPROVED' ? '🔓' : '🔒';
        const btnText = `${lockIcon} ${p.title.length > 25 ? p.title.slice(0, 22) + '...' : p.title}`;
        return [Markup.button.callback(btnText, `show_deck_${p._id}`)];
      });
      await ctx.reply(getTranslation(lang, 'select_deck'), { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) });
    } catch (err) {
      logger.error('List presentations error: %O', err);
      await ctx.reply('Error loading presentations.');
    }
  };
  bot.command('my', listDecks);
  bot.action('cmd_my', listDecks);

  // Callback handling
  bot.on('callback_query', async ctx => {
    const tgId = ctx.from.id;
    const session = getOrCreateSession(tgId);
    const data = ctx.callbackQuery.data;
    const lang = ctx.dbUser.language || 'en';
    try {
      // Language Change callbacks
      if (data.startsWith('lang_')) {
        const selectedLang = data.replace('lang_', '');
        ctx.dbUser.language = selectedLang;
        await ctx.dbUser.save();
        await ctx.answerCbQuery();

        const welcome = getTranslation(selectedLang, 'welcome');
        const appButton = miniAppButton(getTranslation(selectedLang, 'btn_open_editor'), MINI_APP_URL);

        await ctx.reply(welcome, {
          parse_mode: 'Markdown',
          ...buildKeyboard([
            [appButton],
            [Markup.button.callback(getTranslation(selectedLang, 'btn_start_creating'), 'cmd_create')],
            [Markup.button.callback(getTranslation(selectedLang, 'btn_my_presentations'), 'cmd_my')]
          ])
        });
        return;
      }

      // Show Presentation details callback
      if (data.startsWith('show_deck_')) {
        const presId = data.replace('show_deck_', '');
        const pres = await Presentation.findById(presId);
        if (!pres) return ctx.answerCbQuery('Presentation not found.');

        const editUrl = `${MINI_APP_URL}/?tgId=${tgId}&presId=${presId}&action=edit`;
        const editButton = miniAppButton(getTranslation(lang, 'btn_open_editor'), editUrl);

        const lockStatus = pres.paymentStatus === 'APPROVED' ? '✅ Unlocked' : '🔒 Locked (Awaiting Payment)';
        let text = `📊 *${pres.title}*\n`
          + `• Audience: ${pres.audience}\n`
          + `• Style: ${pres.style}\n`
          + `• Slides: ${pres.slideCount}\n`
          + `• Status: ${lockStatus}\n`
          + `• Created: ${pres.createdAt.toLocaleDateString()}`;

        const buttonRows = [];
        if (editButton) buttonRows.push([editButton]);
        
        // Show download buttons only if approved
        if (pres.paymentStatus === 'APPROVED') {
          buttonRows.push([
            Markup.button.callback(getTranslation(lang, 'btn_download_pptx'), `dl_pptx_${presId}`),
            Markup.button.callback(getTranslation(lang, 'btn_download_pdf'), `dl_pdf_${presId}`)
          ]);
        } else {
          // If locked, show payment prompt command
          buttonRows.push([Markup.button.callback('💳 Pay to Unlock', `request_pay_${presId}`)]);
        }

        await ctx.reply(text, {
          parse_mode: 'Markdown',
          ...buildKeyboard(buttonRows)
        });
        return ctx.answerCbQuery();
      }

      // Trigger payment request manually callback
      if (data.startsWith('request_pay_')) {
        const presId = data.replace('request_pay_', '');
        const pres = await Presentation.findById(presId);
        if (!pres) return ctx.answerCbQuery('Presentation not found.');
        
        pres.paymentStatus = 'PENDING_PAYMENT';
        await pres.save();

        await ctx.reply(getTranslation(lang, 'payment_request'), { parse_mode: 'Markdown' });
        return ctx.answerCbQuery();
      }

      // Download PPTX callback
      if (data.startsWith('dl_pptx_')) {
        const presId = data.replace('dl_pptx_', '');
        const pres = await Presentation.findById(presId);
        if (!pres) return ctx.answerCbQuery('Presentation not found.');
        
        if (pres.paymentStatus !== 'APPROVED') {
          return ctx.reply(getTranslation(lang, 'not_approved_yet'));
        }

        await ctx.answerCbQuery('Generating PPTX…');
        const slides = await Slide.find({ presentationId: presId }).sort({ order: 1 });
        if (!slides.length) return ctx.reply('Presentation empty.');
        
        const buffer = await generatePPTX(pres, slides, { includeTOC: true });
        await Export.create({ userId: ctx.dbUser._id, presentationId: pres._id, format: 'PPTX' });
        await logSystemEvent('export', { format: 'PPTX', presentationId: pres._id }, ctx.dbUser._id);
        
        await ctx.replyWithDocument({ source: buffer, filename: `${pres.title.replace(/[^a-zA-Z0-9]/g, '_')}.pptx` });
        return;
      }

      // Download PDF callback
      if (data.startsWith('dl_pdf_')) {
        const presId = data.replace('dl_pdf_', '');
        const pres = await Presentation.findById(presId);
        if (!pres) return ctx.answerCbQuery('Presentation not found.');
        
        if (pres.paymentStatus !== 'APPROVED') {
          return ctx.reply(getTranslation(lang, 'not_approved_yet'));
        }

        await ctx.answerCbQuery('Generating PDF…');
        const slides = await Slide.find({ presentationId: presId }).sort({ order: 1 });
        if (!slides.length) return ctx.reply('Presentation empty.');
        
        const buffer = await generatePDF(pres, slides, { includeTOC: true });
        await Export.create({ userId: ctx.dbUser._id, presentationId: pres._id, format: 'PDF' });
        await logSystemEvent('export', { format: 'PDF', presentationId: pres._id }, ctx.dbUser._id);
        
        await ctx.replyWithDocument({ source: buffer, filename: `${pres.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf` });
        return;
      }

      // Admin Approve callback
      if (data.startsWith('approve_pay_')) {
        const presId = data.replace('approve_pay_', '');
        const pres = await Presentation.findById(presId);
        if (!pres) return ctx.answerCbQuery('Presentation not found.');

        pres.paymentStatus = 'APPROVED';
        await pres.save();
        await ctx.answerCbQuery('Payment Approved ✅');

        // Notify user
        const owner = await User.findById(pres.userId);
        if (owner) {
          const ownerLang = owner.language || 'en';
          await ctx.telegram.sendMessage(owner.telegramId, getTranslation(ownerLang, 'payment_approved', { title: pres.title }), { parse_mode: 'Markdown' });

          // Auto-send PDF directly
          try {
            const slides = await Slide.find({ presentationId: pres._id }).sort({ order: 1 });
            if (slides.length > 0) {
              await ctx.telegram.sendMessage(owner.telegramId, "Generating and sending your PDF... 🕒");
              const buffer = await generatePDF(pres, slides, { includeTOC: true });
              await Export.create({ userId: owner._id, presentationId: pres._id, format: 'PDF' });
              const safeTitle = pres.title.replace(/[^a-zA-Z0-9]/g, '_');
              await ctx.telegram.sendDocument(owner.telegramId, { source: buffer, filename: `${safeTitle}.pdf` });
            }
          } catch (pdfErr) {
            logger.error('Failed to auto-send PDF after approval: %O', pdfErr);
          }
        }

        // Edit Admin message
        await ctx.editMessageCaption(`Approved ✅ for presentation: ${pres.title}`);
        return;
      }

      // Admin Reject callback
      if (data.startsWith('reject_pay_')) {
        const presId = data.replace('reject_pay_', '');
        const pres = await Presentation.findById(presId);
        if (!pres) return ctx.answerCbQuery('Presentation not found.');

        pres.paymentStatus = 'REJECTED';
        await pres.save();
        await ctx.answerCbQuery('Payment Rejected ❌');

        // Notify user
        const owner = await User.findById(pres.userId);
        if (owner) {
          const ownerLang = owner.language || 'en';
          await ctx.telegram.sendMessage(owner.telegramId, getTranslation(ownerLang, 'payment_rejected', { title: pres.title }), { parse_mode: 'Markdown' });
        }

        // Edit Admin message
        await ctx.editMessageCaption(`Rejected ❌ for presentation: ${pres.title}`);
        return;
      }

      // Wizard Audience selected callback
      if (session.step === 'WIZARD_AUDIENCE' && data.startsWith('aud_')) {
        const audience = data.replace('aud_', '');
        session.audience = audience;
        session.step = 'IDLE';
        const title = session.title;

        // Note: initial style is set to professional, style is chosen in the mini app style screen later.
        const editUrl = `${MINI_APP_URL}/?tgId=${tgId}&title=${encodeURIComponent(title)}&audience=${encodeURIComponent(audience)}&action=new`;
        const openButton = miniAppButton(getTranslation(lang, 'btn_open_editor'), editUrl);

        let confirm = getTranslation(lang, 'config_done', {
          title,
          audience
        }) + `\n\n🔗 ${editUrl}`;

        await ctx.reply(confirm, { parse_mode: 'Markdown', ...buildKeyboard([[openButton]]) });
        clearSession(tgId);
        return ctx.answerCbQuery();
      }
    } catch (err) {
      logger.error('Callback handling error: %O', err);
      ctx.reply('An error occurred processing request.');
    }
  });

  // Text message handler – wizard steps (title → audience)
  bot.on('text', async ctx => {
    const lang = ctx.dbUser.language || 'en';
    const session = getOrCreateSession(ctx.from.id);
    if (session.step === 'WIZARD_TITLE') {
      session.title = ctx.message.text.trim();
      session.step = 'WIZARD_AUDIENCE';
      await ctx.reply(getTranslation(lang, 'choose_audience'), {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback(getTranslation(lang, 'audience_students'), 'aud_Students'), Markup.button.callback(getTranslation(lang, 'audience_teachers'), 'aud_Teachers')],
          [Markup.button.callback(getTranslation(lang, 'audience_business'), 'aud_Business'), Markup.button.callback(getTranslation(lang, 'audience_investors'), 'aud_Investors')],
          [Markup.button.callback(getTranslation(lang, 'audience_general'), 'aud_General')]
        ])
      });
    } else {
      await ctx.reply('Type /create to start a new presentation, or /my to view your decks.');
    }
  });

  // Photo message handler – payment receipt screenshot upload
  bot.on('photo', async ctx => {
    const lang = ctx.dbUser.language || 'en';
    try {
      // Find user's latest presentation which is PENDING_PAYMENT or REJECTED
      const presentation = await Presentation.findOne({ 
        userId: ctx.dbUser._id, 
        paymentStatus: { $in: ['PENDING_PAYMENT', 'REJECTED'] } 
      }).sort({ createdAt: -1 });

      if (!presentation) {
        return ctx.reply(getTranslation(lang, 'invalid_receipt') + '\nType /create to start or /my to view decks.');
      }

      const photo = ctx.message.photo[ctx.message.photo.length - 1];
      const photoId = photo.file_id;

      // Update presentation payment status
      presentation.paymentStatus = 'SUBMITTED';
      presentation.paymentReceipt = photoId;
      await presentation.save();

      await ctx.reply(getTranslation(lang, 'payment_submitted'), { parse_mode: 'Markdown' });

      // Notify Admin (@identitynull)
      let adminChatId = process.env.ADMIN_TELEGRAM_ID;
      let adminLang = 'en';

      const adminUser = await User.findOne({ username: { $regex: new RegExp('^identitynull$', 'i') } });
      if (adminUser) {
        adminChatId = adminUser.telegramId;
        adminLang = adminUser.language || 'en';
      }

      if (adminChatId) {
        const adminText = getTranslation(adminLang, 'admin_pending_title', {
          username: ctx.from.username || ctx.from.id,
          tgId: ctx.from.id,
          name: `${ctx.from.first_name || ''} ${ctx.from.last_name || ''}`.trim(),
          title: presentation.title,
          presId: presentation._id
        });

        await ctx.telegram.sendPhoto(adminChatId, photoId, {
          caption: adminText,
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [
              Markup.button.callback(getTranslation(adminLang, 'admin_approve_btn'), `approve_pay_${presentation._id}`),
              Markup.button.callback(getTranslation(adminLang, 'admin_reject_btn'), `reject_pay_${presentation._id}`)
            ]
          ])
        });
      } else {
        logger.warn('Admin chat ID not found. Payment receipt could not be forwarded.');
      }
    } catch (err) {
      logger.error('Photo handling error: %O', err);
      await ctx.reply('Error processing payment screenshot.');
    }
  });

  // Catch-all to prevent crashes
  bot.catch((err, ctx) => {
    logger.error(`Telegraf error for update ${ctx.update?.update_id}: %O`, err);
  });

  return bot;
}

module.exports = {
  initBot,
  getBotInstance
};