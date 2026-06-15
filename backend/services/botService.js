// botService.js
const { Telegraf, Markup } = require('telegraf');
const { User, Presentation, Slide, Export, logSystemEvent } = require('./dbService');
const { generatePPTX, generatePDF } = require('./exportService');
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

// Telegram rejects inline keyboard URLs pointing at localhost/loopback/private
// addresses ("Wrong HTTP URL"), for both `url` and `webApp` buttons.
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
  const MINI_APP_URL = process.env.MINI_APP_URL || 'http://localhost:5173';

  // Returns a real button if MINI_APP_URL is usable by Telegram, otherwise
  // null so the caller can fall back to plain text instead of crashing.
  function miniAppButton(label, url) {
    if (!isPubliclyAccessible(url)) return null;
    if (url.startsWith('https://')) {
      return Markup.button.webApp(label, url);
    }
    return Markup.button.url(label, url);
  }

  // Filters out null buttons/empty rows so Markup.inlineKeyboard never
  // receives invalid entries.
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
    try {
      let user = await User.findOne({ telegramId });
      if (!user) {
        user = await User.create({
          telegramId,
          username: ctx.from.username || null,
          firstName: ctx.from.first_name || null,
          lastName: ctx.from.last_name || null,
          subscription: 'FREE'
        });
        logger.info(`New user registered: ${ctx.from.username || telegramId}`);
        await logSystemEvent('user_registration', `New Telegram user: ${telegramId}`, user._id);
      } else if (user.isBanned) {
        return ctx.reply('⚠️ You have been banned by the administrator and cannot use this service.');
      } else {
        if (user.username !== ctx.from.username || user.firstName !== ctx.from.first_name) {
          user.username = ctx.from.username || null;
          user.firstName = ctx.from.first_name || null;
          user.lastName = ctx.from.last_name || null;
          await user.save();
        }
      }
      ctx.dbUser = user;
    } catch (err) {
      logger.error('User middleware error: %O', err);
    }
    return next();
  });

  // /start – welcome message
  bot.start(async ctx => {
    let welcome = `🎨 *Welcome to Presentation Bot SaaS!* 🎨\n\n`
      + `Generate high‑quality slide decks in seconds using AI and edit them live in our Web Mini App.\n\n`
      + `*What you can do:*\n`
      + `🚀 /create – start the wizard\n`
      + `📁 /my – list your decks\n`
      + `👤 /account – view subscription\n`
      + `ℹ️ /help – help info`;

    const appButton = miniAppButton('🎨 Open Presentation Editor', MINI_APP_URL);
    if (!appButton) welcome += `\n\n🔗 Mini App: ${MINI_APP_URL}`;

    await ctx.reply(welcome, {
      parse_mode: 'Markdown',
      ...buildKeyboard([
        [appButton],
        [Markup.button.callback('🚀 New Presentation', 'cmd_create')]
      ])
    });
  });

  // /help – usage details
  bot.help(async ctx => {
    const help = `🤖 *Presentation Bot Help* 🤖\n\n`
      + `1️⃣ Run /create or click “New Presentation”.\n`
      + `2️⃣ Send a title.\n`
      + `3️⃣ Choose the target audience.\n`
      + `4️⃣ Click “Open Presentation Editor” to launch the Mini App where AI builds the slides.\n\n`
      + `💾 Export: use /my to download PPTX or PDF files.`;
    await ctx.reply(help, { parse_mode: 'Markdown' });
  });

  // /account – simple stats
  bot.command('account', async ctx => {
    try {
      const presCount = await Presentation.countDocuments({ userId: ctx.dbUser._id });
      const exportCount = await Export.countDocuments({ userId: ctx.dbUser._id });
      const msg = `👤 *My Account*\n\n`
        + `• Telegram ID: \`${ctx.dbUser.telegramId}\`\n`
        + `• Plan: \`${ctx.dbUser.subscription}\`\n`
        + `• Presentations: \`${presCount}\` (Free limit: 5)\n`
        + `• Exports: \`${exportCount}\`\n`
        + `• Status: Active ✅`;
      await ctx.reply(msg, { parse_mode: 'Markdown' });
    } catch (err) {
      logger.error('Account command error: %O', err);
      await ctx.reply('Could not load account details.');
    }
  });

  // /create – start the wizard
  const startWizard = async ctx => {
    const session = getOrCreateSession(ctx.from.id);
    if (ctx.dbUser.subscription === 'FREE') {
      const cnt = await Presentation.countDocuments({ userId: ctx.dbUser._id });
      if (cnt >= 5) return ctx.reply('⚠️ Free limit reached (5 presentations). Upgrade to continue.');
    }
    session.step = 'WIZARD_TITLE';
    await ctx.reply('✍️ Send the *Presentation Title* you want to create.', { parse_mode: 'Markdown' });
  };
  bot.command('create', startWizard);
  bot.action('cmd_create', startWizard);

  // /my – list user presentations
  bot.command('my', async ctx => {
    try {
      const list = await Presentation.find({ userId: ctx.dbUser._id })
        .sort({ createdAt: -1 })
        .limit(10);
      if (!list.length) return ctx.reply('You have no presentations yet. Use /create to begin.');
      const buttons = list.map(p => [Markup.button.callback(p.title.length > 30 ? p.title.slice(0, 27) + '...' : p.title, `show_deck_${p._id}`)]);
      await ctx.reply('📁 *Select a presentation:*', { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) });
    } catch (err) {
      logger.error('List presentations error: %O', err);
      await ctx.reply('Error loading your presentations.');
    }
  });

  // Callback handling (view, export, wizard audience)
  bot.on('callback_query', async ctx => {
    const tgId = ctx.from.id;
    const session = getOrCreateSession(tgId);
    const data = ctx.callbackQuery.data;
    try {
      if (data.startsWith('show_deck_')) {
        const presId = data.replace('show_deck_', '');
        const pres = await Presentation.findById(presId);
        if (!pres) return ctx.answerCbQuery('Presentation not found.');

        const editUrl = `${MINI_APP_URL}/?tgId=${tgId}&presId=${presId}&action=edit`;
        const editButton = miniAppButton('🎨 Open in Visual Editor', editUrl);

        let text = `📊 *${pres.title}*\n`
          + `• Audience: ${pres.audience}\n`
          + `• Style: ${pres.style}\n`
          + `• Slides: ${pres.slideCount}\n`
          + `• Created: ${pres.createdAt.toLocaleDateString()}`;
        if (!editButton) text += `\n\n🔗 Editor: ${editUrl}`;

        await ctx.reply(text, {
          parse_mode: 'Markdown',
          ...buildKeyboard([
            [editButton],
            [Markup.button.callback('📥 PPTX', `dl_pptx_${presId}`), Markup.button.callback('📥 PDF', `dl_pdf_${presId}`)]
          ])
        });
        return ctx.answerCbQuery();
      }
      if (data.startsWith('dl_pptx_')) {
        const presId = data.replace('dl_pptx_', '');
        await ctx.answerCbQuery('Generating PPTX…');
        const pres = await Presentation.findById(presId);
        const slides = await Slide.find({ presentationId: presId }).sort({ order: 1 });
        if (!pres || !slides.length) return ctx.reply('Presentation not found or empty.');
        const buffer = await generatePPTX(pres, slides, { includeTOC: true });
        await Export.create({ userId: ctx.dbUser._id, presentationId: pres._id, format: 'PPTX' });
        await logSystemEvent('export', { format: 'PPTX', presentationId: pres._id }, ctx.dbUser._id);
        await ctx.replyWithDocument({ source: buffer, filename: `${pres.title.replace(/[^a-zA-Z0-9]/g, '_')}.pptx` });
        return;
      }
      if (data.startsWith('dl_pdf_')) {
        const presId = data.replace('dl_pdf_', '');
        await ctx.answerCbQuery('Generating PDF…');
        const pres = await Presentation.findById(presId);
        const slides = await Slide.find({ presentationId: presId }).sort({ order: 1 });
        if (!pres || !slides.length) return ctx.reply('Presentation not found or empty.');
        const buffer = await generatePDF(pres, slides, { includeTOC: true });
        await Export.create({ userId: ctx.dbUser._id, presentationId: pres._id, format: 'PDF' });
        await logSystemEvent('export', { format: 'PDF', presentationId: pres._id }, ctx.dbUser._id);
        await ctx.replyWithDocument({ source: buffer, filename: `${pres.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf` });
        return;
      }
      if (session.step === 'WIZARD_AUDIENCE' && data.startsWith('aud_')) {
        const audience = data.replace('aud_', '');
        session.audience = audience;
        session.step = 'IDLE';
        const title = session.title;

        const editUrl = `${MINI_APP_URL}/?tgId=${tgId}&title=${encodeURIComponent(title)}&audience=${encodeURIComponent(audience)}&action=new`;
        const openButton = miniAppButton('🎨 Open Presentation Editor', editUrl);

        let confirm = `🎉 *Presentation Configured!* 🎉\n\n• Title: ${title}\n• Audience: ${audience}\n\nClick below to open the Mini App and let AI build the slides.`;
        if (!openButton) confirm += `\n\n🔗 ${editUrl}`;

        await ctx.reply(confirm, { parse_mode: 'Markdown', ...buildKeyboard([[openButton]]) });
        clearSession(tgId);
        return ctx.answerCbQuery();
      }
    } catch (err) {
      logger.error('Callback handling error: %O', err);
      ctx.reply('An error occurred processing your request.');
    }
  });

  // Text messages – wizard steps (title → audience)
  bot.on('text', async ctx => {
    const session = getOrCreateSession(ctx.from.id);
    if (session.step === 'WIZARD_TITLE') {
      session.title = ctx.message.text.trim();
      session.step = 'WIZARD_AUDIENCE';
      await ctx.reply('Great! Now choose the *Target Audience*:', {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('👨‍🎓 Students', 'aud_Students'), Markup.button.callback('👩‍🏫 Teachers', 'aud_Teachers')],
          [Markup.button.callback('💼 Business', 'aud_Business'), Markup.button.callback('💰 Investors', 'aud_Investors')],
          [Markup.button.callback('🌍 General', 'aud_General')]
        ])
      });
    } else {
      await ctx.reply('Type /create to start a new presentation, or /my to view your decks.');
    }
  });

  // Catch-all: prevents one bad update from crashing the whole process
  bot.catch((err, ctx) => {
    logger.error(`Telegraf error for update ${ctx.update?.update_id}: %O`, err);
  });

  return bot;
}
module.exports = { initBot };